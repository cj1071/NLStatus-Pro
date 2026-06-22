import { CURRENT_SITE } from '../site';
import { Network } from '../utils/network';
import { Storage } from '../utils/storage';
import { Utils } from '../utils/helpers';
import { TopicHelpers } from '../utils/topicHelpers';

type SummaryMode = 'brief' | 'detailed';

interface AISummaryConfig {
  apiUrl: string;
  apiKey: string;
  model: string;
  promptBrief: string;
  promptDetailed: string;
}

interface TopicInfo {
  id: number;
  title: string;
  postsCount: number;
  views: number;
  likeCount: number;
}

interface HistoryRecord {
  topicId: number;
  title: string;
  summary: string;
  mode: SummaryMode;
  range: {
    start: number;
    end: number;
  };
  timestamp: number;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ViewerPayload {
  title: string;
  summary: string;
  mode: SummaryMode;
  topicId: number;
  range?: {
    start: number;
    end: number;
  };
  timestamp?: number;
  streaming?: boolean;
}

const CONFIG_KEY = 'aiTopicSummaryConfig';
const HISTORY_KEY = 'aiTopicSummaryHistory';
const VIEWER_FONT_KEY = 'aiTopicSummaryViewerFont';
const VIEWER_READING_KEY = 'aiTopicSummaryViewerReading';
const DEFAULT_MODEL = 'gpt-4o-mini';
const DEFAULT_API_URL = 'https://api.openai.com/v1/chat/completions';
const PROMPT_BRIEF = '用简洁的方式总结以下论坛讨论，提炼核心观点、争议点和结论，控制在 200 字以内。';
const PROMPT_DETAILED = '详细分析和总结以下论坛讨论，按主题脉络、主要观点、分歧、有效信息和结论建议组织内容。';

export class AITopicSummary {
  private _overlay: HTMLElement;
  private _body: HTMLElement;
  private _mountHost: HTMLElement;
  private _config: AISummaryConfig;
  private _history: HistoryRecord[];
  private _mode: SummaryMode = 'detailed';
  private _topicCache: TopicInfo | null = null;
  private _abort: AbortController | null = null;
  private _chatAbort: AbortController | null = null;
  private _currentOutput = '';
  private _chatMessages: ChatMessage[] = [];
  private _lastUrl = location.href;
  private _urlTimer: ReturnType<typeof setInterval> | null = null;
  private _keydownHandler: ((event: KeyboardEvent) => void) | null = null;
  private _viewerOverlay: HTMLElement | null = null;
  private _viewerEscHandler: ((event: KeyboardEvent) => void) | null = null;
  private _viewerResizeHandler: ((event: MouseEvent) => void) | null = null;
  private _viewerResizeUpHandler: (() => void) | null = null;
  private _viewerSuppressBackdropClick = false;

  private static _cleanCookedRegex = {
    lightbox: /<div class="lightbox-wrapper">\s*<a class="lightbox" href="([^"]+)"(?:\s+data-download-href="([^"]+)")?[^>]*title="([^"]*)"[^>]*>[\s\S]*?<\/a>\s*<\/div>/gi,
    attachment: /<a class="attachment" href="([^"]+)"[^>]*>([^<]+)<\/a>/gi,
    emoji: /<img[^>]+class="emoji[^>]*alt="([^"]*)"[^>]*>/gi,
    quote: /<aside class="quote(?:-modified)?[^>]*>[\s\S]*?<blockquote>([\s\S]*?)<\/blockquote>[\s\S]*?<\/aside>/gi,
    br: /<br\s*\/?>/gi,
    closingTags: /<\/p>|<\/li>|<\/div>/gi,
    allTags: /<[^>]+>/g,
    trailingSpaces: /[ \t]+\n/g,
    multipleNewlines: /\n{3,}/g,
    multipleSpaces: /[ \t]{2,}/g,
  };

  constructor(
    private _root: HTMLElement,
    private _storage: Storage,
    private _showToast: (msg: string) => void,
  ) {
    this._mountHost = this._root.querySelector<HTMLElement>('.nle-main')
      || this._root.querySelector<HTMLElement>('.nle-body')
      || this._root;
    this._config = this._loadConfig();
    this._history = this._loadHistory();
    this._overlay = document.createElement('div');
    this._overlay.className = 'nle-ai-overlay';
    this._overlay.innerHTML = `
      <div class="nle-ai-header">
        <div class="nle-ai-title">AI 帖子总结</div>
        <div class="nle-ai-header-actions">
          <button class="nle-ai-refresh" type="button">刷新</button>
          <button class="nle-ai-close" type="button" title="关闭">×</button>
        </div>
      </div>
      <div class="nle-ai-tabs">
        <button class="nle-ai-tab active" type="button" data-tab="home">首页</button>
        <button class="nle-ai-tab" type="button" data-tab="history">历史</button>
        <button class="nle-ai-tab" type="button" data-tab="settings">设置</button>
      </div>
      <div class="nle-ai-body"></div>
    `;
    this._body = this._overlay.querySelector('.nle-ai-body')!;
    this._mountHost.appendChild(this._overlay);
    this._bindShellEvents();
  }

  show(): void {
    const topicId = TopicHelpers.getTopicId();
    if (this._topicCache && this._topicCache.id !== topicId) this._topicCache = null;
    this._lastUrl = location.href;
    this._mountHost.classList.add('nle-subpanel-open');
    this._overlay.classList.add('show');
    const active = this._overlay.querySelector<HTMLElement>('.nle-ai-tab.active')?.dataset.tab || 'home';
    if (active === 'settings') this._renderSettings();
    else if (active === 'history') this._renderHistory();
    else void this._renderHome(false);
  }

  hide(): void {
    this._stopUrlWatch();
    this._abort?.abort();
    this._abort = null;
    this._overlay.classList.remove('show');
    this._mountHost.classList.remove('nle-subpanel-open');
  }

  destroy(): void {
    this.hide();
    this._closeViewer();
    if (this._keydownHandler) {
      document.removeEventListener('keydown', this._keydownHandler);
      this._keydownHandler = null;
    }
    this._overlay.remove();
  }

  private _bindShellEvents(): void {
    this._overlay.querySelector('.nle-ai-close')?.addEventListener('click', () => this.hide());
    this._overlay.querySelector('.nle-ai-refresh')?.addEventListener('click', () => {
      const tab = this._overlay.querySelector<HTMLElement>('.nle-ai-tab.active')?.dataset.tab;
      this._topicCache = null;
      if (tab === 'history') this._renderHistory();
      else if (tab === 'settings') this._renderSettings();
      else void this._renderHome(true);
    });
    this._overlay.querySelectorAll<HTMLElement>('.nle-ai-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this._overlay.querySelectorAll('.nle-ai-tab').forEach(item => item.classList.remove('active'));
        tab.classList.add('active');
        const next = tab.dataset.tab;
        if (next === 'history') this._renderHistory();
        else if (next === 'settings') this._renderSettings();
        else void this._renderHome(false);
      });
    });
    this._keydownHandler = (e) => {
      if (e.key === 'Escape' && this._viewerOverlay) return;
      if (e.key === 'Escape' && this._overlay.classList.contains('show')) this.hide();
    };
    document.addEventListener('keydown', this._keydownHandler);
  }

  private _loadConfig(): AISummaryConfig {
    const defaults: AISummaryConfig = {
      apiUrl: DEFAULT_API_URL,
      apiKey: '',
      model: DEFAULT_MODEL,
      promptBrief: '',
      promptDetailed: '',
    };
    const saved = this._storage.get(CONFIG_KEY, null);
    return saved && typeof saved === 'object' ? { ...defaults, ...(saved as Partial<AISummaryConfig>) } : defaults;
  }

  private _saveConfig(): void {
    this._storage.setNow(CONFIG_KEY, this._config);
  }

  private _loadHistory(): HistoryRecord[] {
    const saved = this._storage.get(HISTORY_KEY, []);
    return Array.isArray(saved) ? saved.filter(this._isHistoryRecord) : [];
  }

  private _saveHistory(): void {
    this._storage.setNow(HISTORY_KEY, this._history);
  }

  private _isHistoryRecord(value: unknown): value is HistoryRecord {
    if (!value || typeof value !== 'object') return false;
    const record = value as Partial<HistoryRecord>;
    return typeof record.topicId === 'number'
      && typeof record.title === 'string'
      && typeof record.summary === 'string'
      && (record.mode === 'brief' || record.mode === 'detailed')
      && typeof record.timestamp === 'number';
  }

  private _addHistory(record: HistoryRecord): void {
    const key = `${record.topicId}_${record.mode}_${record.range.start}_${record.range.end}`;
    const idx = this._history.findIndex(item => `${item.topicId}_${item.mode}_${item.range?.start}_${item.range?.end}` === key);
    if (idx >= 0) this._history[idx] = record;
    else this._history.unshift(record);
    this._history = this._history.slice(0, 100);
    this._saveHistory();
  }

  private async _getTopicInfo(refresh = false): Promise<TopicInfo | null> {
    const topicId = TopicHelpers.getTopicId();
    if (!topicId) return null;
    if (!refresh && this._topicCache?.id === topicId) return this._topicCache;

    try {
      const data = await TopicHelpers.fetchJSON<any>(`/t/${topicId}.json`);
      this._topicCache = {
        id: topicId,
        title: Utils.sanitize(data?.title || data?.fancy_title || '当前话题', 160),
        postsCount: Math.max(1, Utils.toSafeInt(data?.posts_count, 1)),
        views: Utils.toSafeInt(data?.views, 0),
        likeCount: Utils.toSafeInt(data?.like_count, 0),
      };
      return this._topicCache;
    } catch {
      const title = document.querySelector('.fancy-title, .topic-title')?.textContent?.trim() || '当前话题';
      const replies = this._getReplyCount();
      this._topicCache = {
        id: topicId,
        title: Utils.sanitize(title, 160),
        postsCount: Math.max(1, replies + 1),
        views: 0,
        likeCount: 0,
      };
      return this._topicCache;
    }
  }

  private _getReplyCount(): number {
    const text = document.querySelector('.timeline-replies')?.textContent?.trim() || '';
    return Utils.toSafeInt(text.includes('/') ? text.split('/').pop() : text, 0);
  }

  private _startUrlWatch(): void {
    if (this._urlTimer) return;
    this._urlTimer = setInterval(() => {
      if (this._lastUrl === location.href) return;
      this._lastUrl = location.href;
      this._topicCache = null;
      if (!this._overlay.classList.contains('show')) return;
      if (!TopicHelpers.getTopicId()) return;
      const active = this._overlay.querySelector<HTMLElement>('.nle-ai-tab.active');
      if (active?.dataset.tab === 'home') {
        this._stopUrlWatch();
        void this._renderHome(false);
      }
    }, 800);
  }

  private _stopUrlWatch(): void {
    if (!this._urlTimer) return;
    clearInterval(this._urlTimer);
    this._urlTimer = null;
  }

  private async _renderHome(refresh: boolean): Promise<void> {
    if (!TopicHelpers.getTopicId()) {
      this._startUrlWatch();
      this._body.innerHTML = `
        <div class="nle-ai-empty">
          <div class="nle-ai-empty-title">请先进入一个话题帖子</div>
          <div class="nle-ai-empty-desc">AI 总结会读取当前话题楼层内容，并按选定范围生成总结。</div>
        </div>
      `;
      return;
    }
    this._stopUrlWatch();
    this._body.innerHTML = '<div class="nle-ai-status">正在获取话题信息...</div>';

    try {
      const info = await this._getTopicInfo(refresh);
      if (!info) throw new Error('获取话题信息失败');
      const hasApi = this._config.apiUrl.trim().length > 0;
      this._body.innerHTML = `
        <div class="nle-ai-info">
          <div class="nle-ai-topic-title">${Utils.escapeHtml(info.title)}</div>
          <div class="nle-ai-info-grid">
            <div><span>楼层</span><b>${Utils.formatNumber(info.postsCount)}</b></div>
            <div><span>浏览</span><b>${Utils.formatNumber(info.views)}</b></div>
            <div><span>点赞</span><b>${Utils.formatNumber(info.likeCount)}</b></div>
          </div>
        </div>
        ${hasApi ? '' : '<div class="nle-ai-warning">请先在“设置”里填写 OpenAI 兼容 API 地址。</div>'}
        <div class="nle-ai-range">
          <label>楼层范围</label>
          <input id="nle-ai-start" type="number" min="1" max="${info.postsCount}" value="1">
          <span>至</span>
          <input id="nle-ai-end" type="number" min="1" max="${info.postsCount}" value="${info.postsCount}">
        </div>
        <div class="nle-ai-mode">
          <button class="nle-ai-mode-btn ${this._mode === 'brief' ? 'active' : ''}" type="button" data-mode="brief">
            <b>简略</b><span>快速概要</span>
          </button>
          <button class="nle-ai-mode-btn ${this._mode === 'detailed' ? 'active' : ''}" type="button" data-mode="detailed">
            <b>详细</b><span>结构分析</span>
          </button>
        </div>
        <div class="nle-ai-actions">
          <button id="nle-ai-summarize" class="nle-ai-primary" type="button" ${hasApi ? '' : 'disabled'}>开始总结</button>
          <button id="nle-ai-stop" class="nle-ai-secondary" type="button" style="display:none">停止</button>
        </div>
        <div id="nle-ai-run-status" class="nle-ai-status" style="display:none"></div>
      `;
      this._bindHomeEvents(info);
    } catch (e) {
      this._body.innerHTML = `<div class="nle-ai-error">${Utils.escapeHtml((e as Error).message || '获取话题信息失败')}</div>`;
    }
  }

  private _bindHomeEvents(info: TopicInfo): void {
    this._body.querySelectorAll<HTMLElement>('.nle-ai-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this._mode = (btn.dataset.mode === 'brief' ? 'brief' : 'detailed');
        this._body.querySelectorAll('.nle-ai-mode-btn').forEach(item => item.classList.remove('active'));
        btn.classList.add('active');
      });
    });
    this._body.querySelector('#nle-ai-summarize')?.addEventListener('click', () => this._summarize(info));
    this._body.querySelector('#nle-ai-stop')?.addEventListener('click', () => this._abort?.abort());
  }

  private async _summarize(info: TopicInfo): Promise<void> {
    const startEl = this._body.querySelector<HTMLInputElement>('#nle-ai-start');
    const endEl = this._body.querySelector<HTMLInputElement>('#nle-ai-end');
    const button = this._body.querySelector<HTMLButtonElement>('#nle-ai-summarize');
    const stopButton = this._body.querySelector<HTMLElement>('#nle-ai-stop');
    const status = this._body.querySelector<HTMLElement>('#nle-ai-run-status');
    if (!startEl || !endEl || !button || !stopButton || !status) return;

    const setStatus = (text: string, type: 'status' | 'error' = 'status') => {
      status.className = type === 'error' ? 'nle-ai-error' : 'nle-ai-status';
      status.style.display = '';
      status.textContent = text;
    };

    const start = Math.max(1, Math.min(Utils.toSafeInt(startEl.value, 1), info.postsCount));
    const end = Math.max(1, Math.min(Utils.toSafeInt(endEl.value, info.postsCount), info.postsCount));
    if (start > end) {
      setStatus('起始楼层不能大于结束楼层', 'error');
      return;
    }
    if (!this._config.apiUrl.trim()) {
      setStatus('请先在设置中填写 API 地址', 'error');
      return;
    }

    this._abort = new AbortController();
    this._currentOutput = '';
    this._chatMessages = [];
    button.disabled = true;
    button.textContent = '获取帖子内容...';
    stopButton.style.display = '';
    setStatus('正在获取帖子内容...');

    const updateStatus = (text: string) => {
      button.textContent = text;
      setStatus(text);
    };

    try {
      const dialogues = await this._fetchDialogues(info.id, start, end, this._abort.signal, updateStatus);
      if (!dialogues.trim()) throw new Error('没有获取到可总结的帖子内容');
      const prompt = this._mode === 'brief'
        ? (this._config.promptBrief.trim() || PROMPT_BRIEF)
        : (this._config.promptDetailed.trim() || PROMPT_DETAILED);
      const content = `话题标题: ${info.title}\n\n帖子内容 (第 ${start} 楼至第 ${end} 楼):\n${dialogues}`;

      button.textContent = 'AI 分析中...';
      setStatus('AI 分析中，结果已在弹窗中显示');
      const viewerPayload: ViewerPayload = {
        title: info.title,
        summary: '',
        mode: this._mode,
        topicId: info.id,
        range: { start, end },
        timestamp: Date.now(),
        streaming: true,
      };
      this._showViewer(viewerPayload);
      await this._callAI(prompt, content, this._abort.signal, (chunk) => {
        this._currentOutput += chunk;
        this._updateViewerSummary(this._currentOutput, true);
      });

      if (!this._currentOutput.trim()) throw new Error('AI 未返回内容');
      this._updateViewerSummary(this._currentOutput, false);
      const record: HistoryRecord = {
        topicId: info.id,
        title: info.title,
        summary: this._currentOutput,
        mode: this._mode,
        range: { start, end },
        timestamp: Date.now(),
      };
      this._resetViewerChat(record);
      this._addHistory(record);
      setStatus('总结完成，可在弹窗中阅读或追问');
      this._showToast('总结完成');
    } catch (e) {
      const err = e as Error;
      const message = err.name === 'AbortError' ? '已停止总结' : (err.message || '总结失败');
      setStatus(message, 'error');
      this._updateViewerError(message);
    } finally {
      button.disabled = false;
      button.textContent = '开始总结';
      stopButton.style.display = 'none';
      this._abort = null;
    }
  }

  private _formatViewerDate(timestamp?: number): string {
    if (!timestamp) return '刚刚';
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  private _getViewerFont(): string {
    const value = this._storage.get(VIEWER_FONT_KEY, 'md');
    return typeof value === 'string' && ['sm', 'md', 'lg', 'xl'].includes(value) ? value : 'md';
  }

  private _getViewerReading(): boolean {
    return this._storage.get(VIEWER_READING_KEY, false) === true;
  }

  private _showViewer(data: ViewerPayload): void {
    this._closeViewer();
    this._currentOutput = data.summary || '';

    const fontSize = this._getViewerFont();
    const isReading = this._getViewerReading();
    const modeText = data.mode === 'brief' ? '简略' : '详细';
    const rangeMeta = data.range ? `<span>${data.range.start}-${data.range.end} 楼</span>` : '';
    const summaryHtml = data.summary
      ? this._renderMarkdown(data.summary)
      : `<div class="nle-ai-status">${data.streaming ? '正在生成总结...' : '暂无总结内容'}</div>`;

    const overlay = document.createElement('div');
    overlay.className = `nle-ai-viewer-overlay${isReading ? ' reading' : ''}`;
    overlay.innerHTML = `
      <div class="nle-ai-viewer" role="dialog" aria-modal="true" aria-label="AI 帖子总结详情">
        <div class="nle-ai-viewer-header">
          <div class="nle-ai-viewer-title">
            <span class="nle-ai-viewer-dot"></span>
            <span>AI 总结详情</span>
          </div>
          <div class="nle-ai-viewer-actions">
            <div class="nle-ai-font-btn" id="nle-ai-viewer-font" title="调整字号">
              <span>Aa</span>
              <div class="nle-ai-font-menu" id="nle-ai-font-menu">
                <button type="button" data-font="sm" class="${fontSize === 'sm' ? 'active' : ''}">小</button>
                <button type="button" data-font="md" class="${fontSize === 'md' ? 'active' : ''}">标准</button>
                <button type="button" data-font="lg" class="${fontSize === 'lg' ? 'active' : ''}">大</button>
                <button type="button" data-font="xl" class="${fontSize === 'xl' ? 'active' : ''}">更大</button>
              </div>
            </div>
            <button class="nle-ai-viewer-btn" id="nle-ai-viewer-reading" type="button">${isReading ? '助手' : '阅读'}</button>
            <button class="nle-ai-viewer-btn" id="nle-ai-viewer-copy" type="button">复制</button>
            <button class="nle-ai-viewer-btn" id="nle-ai-viewer-goto" type="button">话题</button>
            <button class="nle-ai-viewer-btn nle-ai-viewer-close" id="nle-ai-viewer-close" type="button">×</button>
          </div>
        </div>
        <div class="nle-ai-viewer-info">
          <div class="nle-ai-viewer-topic-title">${Utils.escapeHtml(data.title)}</div>
          <div class="nle-ai-viewer-meta">
            <span class="nle-ai-viewer-mode ${data.mode}">${modeText}</span>
            <span>${this._formatViewerDate(data.timestamp)}</span>
            ${rangeMeta}
          </div>
        </div>
        <div class="nle-ai-viewer-content font-${fontSize}" id="nle-ai-viewer-content">
          <div class="nle-ai-viewer-msg assistant">
            <div class="nle-ai-viewer-msg-label">AI 总结</div>
            <div class="nle-ai-viewer-msg-content" id="nle-ai-viewer-summary">${summaryHtml}</div>
          </div>
        </div>
        <div class="nle-ai-viewer-chat">
          <div class="nle-ai-viewer-chat-row">
            <input id="nle-ai-viewer-chat-input" class="nle-ai-viewer-chat-input" type="text" placeholder="输入问题继续追问...">
            <button id="nle-ai-viewer-chat-send" class="nle-ai-viewer-chat-send" type="button" aria-label="发送追问">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M21 3L3.8 10.2c-.9.4-.8 1.7.2 1.9l6.4 1.5 1.5 6.4c.2 1 1.5 1.1 1.9.2L21 3z"></path>
                <path d="M10.5 13.5L21 3"></path>
              </svg>
            </button>
          </div>
          <div class="nle-ai-viewer-chat-hint" id="nle-ai-viewer-chat-hint">💡 基于以上总结内容进行追问</div>
        </div>
        <div class="nle-ai-viewer-resize" aria-hidden="true"></div>
      </div>
    `;

    document.body.appendChild(overlay);
    this._viewerOverlay = overlay;
    this._bindViewerEvents(data);
    this._bindViewerResize(overlay);
    this._resetViewerChat(data);
    this._updateViewerSummary(data.summary, !!data.streaming);
  }

  private _bindViewerEvents(data: ViewerPayload): void {
    const overlay = this._viewerOverlay;
    if (!overlay) return;

    overlay.querySelector('#nle-ai-viewer-close')?.addEventListener('click', () => this._closeViewer());
    overlay.addEventListener('click', (event) => {
      if (this._viewerSuppressBackdropClick) {
        this._viewerSuppressBackdropClick = false;
        return;
      }
      if (event.target === overlay) this._closeViewer();
    });
    this._viewerEscHandler = (event) => {
      if (event.key === 'Escape') this._closeViewer();
    };
    document.addEventListener('keydown', this._viewerEscHandler);

    overlay.querySelector('#nle-ai-viewer-copy')?.addEventListener('click', () => this._copyViewerContent(data.title));
    overlay.querySelector('#nle-ai-viewer-goto')?.addEventListener('click', () => {
      window.open(`${TopicHelpers.getOrigin()}/t/${data.topicId}`, '_blank', 'noopener,noreferrer');
    });

    const readingBtn = overlay.querySelector<HTMLButtonElement>('#nle-ai-viewer-reading');
    readingBtn?.addEventListener('click', () => {
      const next = !overlay.classList.contains('reading');
      overlay.classList.toggle('reading', next);
      readingBtn.textContent = next ? '助手' : '阅读';
      this._storage.setNow(VIEWER_READING_KEY, next);
    });

    const fontBtn = overlay.querySelector<HTMLElement>('#nle-ai-viewer-font');
    const fontMenu = overlay.querySelector<HTMLElement>('#nle-ai-font-menu');
    const content = overlay.querySelector<HTMLElement>('#nle-ai-viewer-content');
    fontBtn?.addEventListener('click', (event) => {
      event.stopPropagation();
      fontMenu?.classList.toggle('show');
    });
    fontMenu?.querySelectorAll<HTMLButtonElement>('[data-font]').forEach(btn => {
      btn.addEventListener('click', (event) => {
        event.stopPropagation();
        const size = btn.dataset.font || 'md';
        if (!['sm', 'md', 'lg', 'xl'].includes(size)) return;
        content?.classList.remove('font-sm', 'font-md', 'font-lg', 'font-xl');
        content?.classList.add(`font-${size}`);
        fontMenu.querySelectorAll('button').forEach(item => item.classList.toggle('active', item === btn));
        fontMenu.classList.remove('show');
        this._storage.setNow(VIEWER_FONT_KEY, size);
      });
    });
    overlay.addEventListener('click', () => fontMenu?.classList.remove('show'));

    overlay.querySelector('#nle-ai-viewer-chat-send')?.addEventListener('click', () => this._askViewerFollowUp(data));
    overlay.querySelector<HTMLInputElement>('#nle-ai-viewer-chat-input')?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        void this._askViewerFollowUp(data);
      }
    });
  }

  private _bindViewerResize(overlay: HTMLElement): void {
    const viewer = overlay.querySelector<HTMLElement>('.nle-ai-viewer');
    const handle = overlay.querySelector<HTMLElement>('.nle-ai-viewer-resize');
    if (!viewer || !handle) return;

    let resizing = false;
    let startX = 0;
    let startY = 0;
    let startWidth = 0;
    let startHeight = 0;

    handle.addEventListener('mousedown', (event) => {
      resizing = true;
      this._viewerSuppressBackdropClick = true;
      startX = event.clientX;
      startY = event.clientY;
      const rect = viewer.getBoundingClientRect();
      startWidth = rect.width;
      startHeight = rect.height;
      event.preventDefault();
      event.stopPropagation();
    });
    handle.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
    });

    this._viewerResizeHandler = (event) => {
      if (!resizing) return;
      const nextWidth = Math.min(window.innerWidth - 24, Math.max(360, startWidth + event.clientX - startX));
      const nextHeight = Math.min(window.innerHeight - 24, Math.max(360, startHeight + event.clientY - startY));
      viewer.style.width = `${nextWidth}px`;
      viewer.style.height = `${nextHeight}px`;
    };
    this._viewerResizeUpHandler = () => {
      if (resizing) {
        window.setTimeout(() => {
          this._viewerSuppressBackdropClick = false;
        }, 0);
      }
      resizing = false;
    };
    document.addEventListener('mousemove', this._viewerResizeHandler);
    document.addEventListener('mouseup', this._viewerResizeUpHandler);
  }

  private _updateViewerSummary(summary: string, streaming: boolean): void {
    if (summary.trim()) this._currentOutput = summary;
    const overlay = this._viewerOverlay;
    const summaryEl = overlay?.querySelector<HTMLElement>('#nle-ai-viewer-summary');
    const content = overlay?.querySelector<HTMLElement>('#nle-ai-viewer-content');
    if (!summaryEl || !content) return;
    summaryEl.innerHTML = summary.trim()
      ? `${this._renderMarkdown(summary)}${streaming ? '<span class="nle-ai-cursor">|</span>' : ''}`
      : `<div class="nle-ai-status">${streaming ? '正在生成总结...' : '暂无总结内容'}</div>`;
    content.scrollTop = content.scrollHeight;
    this._setViewerChatEnabled(!streaming && summary.trim().length > 0);
  }

  private _updateViewerError(message: string): void {
    const summaryEl = this._viewerOverlay?.querySelector<HTMLElement>('#nle-ai-viewer-summary');
    if (!summaryEl) return;
    summaryEl.innerHTML = `<div class="nle-ai-error">${Utils.escapeHtml(message)}</div>`;
    this._setViewerChatEnabled(false);
  }

  private _resetViewerChat(data: ViewerPayload): void {
    if (!data.summary.trim()) {
      this._chatMessages = [];
      this._setViewerChatEnabled(false);
      return;
    }
    this._chatMessages = [
      {
        role: 'system',
        content: `你是一个帮助用户理解论坛帖子内容的助手。以下是话题“${data.title}”的总结：\n\n${data.summary}\n\n请基于这个总结回答用户问题。如果问题超出总结内容范围，请明确说明。`,
      },
      { role: 'assistant', content: data.summary },
    ];
    this._setViewerChatEnabled(true);
  }

  private _setViewerChatEnabled(enabled: boolean): void {
    const overlay = this._viewerOverlay;
    const input = overlay?.querySelector<HTMLInputElement>('#nle-ai-viewer-chat-input');
    const send = overlay?.querySelector<HTMLButtonElement>('#nle-ai-viewer-chat-send');
    const hint = overlay?.querySelector<HTMLElement>('#nle-ai-viewer-chat-hint');
    if (!input || !send || !hint) return;
    const ready = enabled && this._config.apiUrl.trim().length > 0;
    input.disabled = !ready;
    send.disabled = !ready;
    input.placeholder = enabled ? '输入问题继续追问...' : '总结生成完成后可追问';
    hint.textContent = ready ? '💡 基于以上总结内容进行追问' : (enabled ? '请先在设置中配置 API' : '总结生成完成后可追问');
  }

  private async _askViewerFollowUp(data: ViewerPayload): Promise<void> {
    const overlay = this._viewerOverlay;
    const input = overlay?.querySelector<HTMLInputElement>('#nle-ai-viewer-chat-input');
    const send = overlay?.querySelector<HTMLButtonElement>('#nle-ai-viewer-chat-send');
    const content = overlay?.querySelector<HTMLElement>('#nle-ai-viewer-content');
    if (!overlay || !input || !send || !content) return;
    const question = input.value.trim();
    if (!question || !this._currentOutput.trim()) return;
    if (!this._config.apiUrl.trim()) {
      this._showToast('请先在设置中配置 API');
      return;
    }

    input.value = '';
    input.disabled = true;
    send.disabled = true;
    send.classList.add('loading');
    this._appendViewerMessage('user', question);
    const answerEl = this._appendViewerMessage('assistant', '<span class="nle-ai-chat-typing">思考中...</span>', true);

    this._chatAbort = new AbortController();
    try {
      const messages: ChatMessage[] = this._chatMessages.length
        ? [...this._chatMessages, { role: 'user', content: question }]
        : [
            {
              role: 'system',
              content: `你是一个帮助用户理解论坛帖子内容的助手。请基于话题“${data.title}”的总结回答问题：\n\n${this._currentOutput}`,
            },
            { role: 'user', content: question },
          ];
      let answer = '';
      await this._callAI('请基于已有帖子总结回答追问。', question, this._chatAbort.signal, (chunk) => {
        answer += chunk;
        answerEl.innerHTML = this._renderMarkdown(answer);
        content.scrollTop = content.scrollHeight;
      }, messages);
      if (!answer.trim()) throw new Error('AI 未返回内容');
      this._chatMessages = [...messages, { role: 'assistant', content: answer }];
    } catch (e) {
      answerEl.innerHTML = `<span class="nle-ai-chat-error">${Utils.escapeHtml(((e as Error).name === 'AbortError' ? '已停止追问' : (e as Error).message) || '追问失败')}</span>`;
    } finally {
      input.disabled = false;
      send.disabled = false;
      send.classList.remove('loading');
      this._chatAbort = null;
      input.focus();
    }
  }

  private _appendViewerMessage(role: 'user' | 'assistant', content: string, html = false): HTMLElement {
    const list = this._viewerOverlay?.querySelector<HTMLElement>('#nle-ai-viewer-content');
    const item = document.createElement('div');
    item.className = `nle-ai-viewer-msg ${role}`;
    item.innerHTML = `
      <div class="nle-ai-viewer-msg-label">${role === 'user' ? '你的问题' : 'AI 回复'}</div>
      <div class="nle-ai-viewer-msg-content">${html ? content : (role === 'user' ? Utils.escapeHtml(content) : this._renderMarkdown(content))}</div>
    `;
    list?.appendChild(item);
    if (list) list.scrollTop = list.scrollHeight;
    return item.querySelector<HTMLElement>('.nle-ai-viewer-msg-content')!;
  }

  private _copyViewerContent(title: string): void {
    let text = `话题：${title}\n\n`;
    const messages = this._chatMessages.filter(msg => msg.role !== 'system');
    if (messages.length) {
      text += messages.map(msg => {
        if (msg.role === 'user') return `【问】${msg.content}`;
        return `【AI】\n${msg.content}`;
      }).join('\n\n');
    } else {
      text += this._currentOutput;
    }
    void navigator.clipboard.writeText(text.trim()).then(() => this._showToast('已复制'));
  }

  private _closeViewer(): void {
    this._chatAbort?.abort();
    this._chatAbort = null;
    if (this._viewerOverlay) {
      this._viewerOverlay.remove();
      this._viewerOverlay = null;
    }
    this._viewerSuppressBackdropClick = false;
    if (this._viewerEscHandler) {
      document.removeEventListener('keydown', this._viewerEscHandler);
      this._viewerEscHandler = null;
    }
    if (this._viewerResizeHandler) {
      document.removeEventListener('mousemove', this._viewerResizeHandler);
      this._viewerResizeHandler = null;
    }
    if (this._viewerResizeUpHandler) {
      document.removeEventListener('mouseup', this._viewerResizeUpHandler);
      this._viewerResizeUpHandler = null;
    }
  }

  private async _fetchDialogues(
    topicId: number,
    start: number,
    end: number,
    signal: AbortSignal,
    progress: (text: string) => void,
  ): Promise<string> {
    progress('正在获取帖子列表...');
    const idData = await TopicHelpers.fetchJSON<{ post_ids?: number[] }>(
      `/t/${topicId}/post_ids.json?post_number=0&limit=99999`,
      signal,
    );
    const ids = [...(idData.post_ids || [])].slice(start - 1, end);
    if (start <= 1) {
      const topicData = await TopicHelpers.fetchJSON<any>(`/t/${topicId}.json`, signal);
      const firstId = Utils.toSafeInt(topicData?.post_stream?.posts?.[0]?.id, 0);
      if (firstId && !ids.includes(firstId)) ids.unshift(firstId);
    }
    if (!ids.length) throw new Error('没有找到帖子内容');

    const chunks: string[] = [];
    const totalBatches = Math.ceil(ids.length / 200);
    for (let i = 0; i < ids.length; i += 200) {
      if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
      const batchIndex = Math.floor(i / 200) + 1;
      progress(`正在获取帖子内容 (${batchIndex}/${totalBatches})...`);
      const batch = ids.slice(i, i + 200);
      const query = batch.map(id => `post_ids[]=${encodeURIComponent(String(id))}`).join('&');
      const data = await TopicHelpers.fetchJSON<any>(`/t/${topicId}/posts.json?${query}&include_suggested=false`, signal);
      const posts = Array.isArray(data?.post_stream?.posts) ? data.post_stream.posts : [];
      chunks.push(...posts.map((post: any) => this._formatPost(post)).filter(Boolean));
    }
    return chunks.join('\n\n');
  }

  private _formatPost(post: any): string {
    const postNumber = Utils.toSafeInt(post.post_number, 0);
    const username = Utils.sanitize(post.username || '', 80);
    const name = Utils.sanitize(post.name || post.display_username || username, 100);
    const content = this._cleanCooked(post.cooked || '');
    if (!content) return '';
    const reply = post.reply_to_post_number && post.reply_to_user
      ? `-回复[${Utils.toSafeInt(post.reply_to_post_number, 0)}楼] ${Utils.sanitize(post.reply_to_user.name || post.reply_to_user.username || '', 100)}（${Utils.sanitize(post.reply_to_user.username || '', 80)}）`
      : '';
    return `[${postNumber}楼] ${name}（${username}）${reply}:\n${content}`;
  }

  private _cleanCooked(html: string): string {
    const r = AITopicSummary._cleanCookedRegex;
    let content = html;
    content = content.replace(r.lightbox, (_match, hrefUrl, downloadHref, title) => {
      const url = hrefUrl || `${TopicHelpers.getOrigin()}${downloadHref || ''}`;
      return `\n[图片: ${title || '图片'}](${url})\n`;
    });
    content = content.replace(r.attachment, (_match, url, name) => `\n[附件: ${name.trim()}](${url})\n`);
    content = content.replace(r.emoji, '$1 ');
    content = content.replace(r.quote, (_match, quoteInner) => {
      const quote = this._decodeHtml(String(quoteInner).replace(r.allTags, ' ').replace(r.multipleSpaces, ' ').trim());
      return `\n[引用]\n${quote}\n[/引用]\n`;
    });
    content = content.replace(r.br, '\n');
    content = content.replace(r.closingTags, '\n');
    content = content.replace(r.allTags, ' ');
    return this._decodeHtml(content)
      .replace(r.trailingSpaces, '\n')
      .replace(r.multipleNewlines, '\n\n')
      .replace(r.multipleSpaces, ' ')
      .trim();
  }

  private _decodeHtml(value: string): string {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = value;
    return textarea.value;
  }

  private async _callAI(
    systemPrompt: string,
    userContent: string,
    signal: AbortSignal,
    onChunk: (chunk: string) => void,
    messages?: ChatMessage[],
  ): Promise<void> {
    const endpoint = this._resolveAIEndpoint();
    const msgArray: ChatMessage[] = messages || [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ];
    const body = {
      model: this._config.model || DEFAULT_MODEL,
      messages: msgArray,
      max_tokens: 4096,
      temperature: 0.7,
      stream: true,
    };

    try {
      await this._callAIWithFetch(endpoint, body, signal, onChunk);
    } catch (e) {
      if ((e as Error).name === 'AbortError') throw e;
      if (typeof GM_xmlhttpRequest !== 'function') throw e;
      await this._callAIWithGM(endpoint, { ...body, stream: false }, signal, onChunk);
    }
  }

  private _resolveAIEndpoint(): string {
    const rawUrl = this._config.apiUrl.trim();
    if (!rawUrl) throw new Error('请先在设置中填写 API 地址');

    let url: URL;
    try {
      url = new URL(rawUrl);
    } catch {
      throw new Error('API 地址格式不正确');
    }

    const path = url.pathname.replace(/\/+$/, '');
    if (!path) {
      url.pathname = '/v1/chat/completions';
      return url.toString();
    }
    if (/\/chat\/completions$/i.test(path)) {
      url.pathname = path;
      return url.toString();
    }

    url.pathname = `${path}/chat/completions`;
    return url.toString();
  }

  private async _callAIWithFetch(
    endpoint: string,
    body: Record<string, unknown>,
    signal: AbortSignal,
    onChunk: (chunk: string) => void,
  ): Promise<void> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this._config.apiKey.trim()) headers.Authorization = `Bearer ${this._config.apiKey.trim()}`;
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal,
    });
    if (!resp.ok) throw new Error(await this._readAIError(resp));

    if (!resp.body) {
      const data = await resp.json();
      onChunk(this._extractAIText(data));
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let raw = '';
    let received = false;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      raw += chunk;
      buffer += chunk;
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      received = this._consumeSSELines(lines, onChunk) || received;
    }
    if (buffer.trim()) received = this._consumeSSELines([buffer], onChunk) || received;
    if (!received && raw.trim()) {
      const data = JSON.parse(raw);
      onChunk(this._extractAIText(data));
    }
  }

  private _callAIWithGM(
    endpoint: string,
    body: Record<string, unknown>,
    signal: AbortSignal,
    onChunk: (chunk: string) => void,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      let settled = false;
      const rejectOnce = (error: Error) => {
        if (settled) return;
        settled = true;
        reject(error);
      };
      const abort = () => rejectOnce(new DOMException('Aborted', 'AbortError'));
      signal.addEventListener('abort', abort, { once: true });
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (this._config.apiKey.trim()) headers.Authorization = `Bearer ${this._config.apiKey.trim()}`;
      GM_xmlhttpRequest({
        method: 'POST',
        url: endpoint,
        headers,
        data: JSON.stringify(body),
        timeout: 60000,
        onload: (response) => {
          signal.removeEventListener('abort', abort);
          if (settled) return;
          settled = true;
          if (response.status < 200 || response.status >= 300) {
            reject(new Error(this._extractAIErrorText(response.responseText, response.status)));
            return;
          }
          try {
            const data = JSON.parse(response.responseText || '{}');
            onChunk(this._extractAIText(data));
            resolve();
          } catch {
            reject(new Error('AI 响应解析失败'));
          }
        },
        onerror: () => {
          signal.removeEventListener('abort', abort);
          rejectOnce(new Error('AI 请求失败'));
        },
        ontimeout: () => {
          signal.removeEventListener('abort', abort);
          rejectOnce(new Error('AI 请求超时'));
        },
      });
    });
  }

  private _consumeSSELines(lines: string[], onChunk: (chunk: string) => void): boolean {
    let received = false;
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === 'data: [DONE]') continue;
      if (!trimmed.startsWith('data: ')) continue;
      try {
        const data = JSON.parse(trimmed.slice(6));
        const text = data?.choices?.[0]?.delta?.content || data?.choices?.[0]?.message?.content || '';
        if (text) {
          received = true;
          onChunk(String(text));
        }
      } catch {
        // Skip incomplete or provider-specific event payloads.
      }
    }
    return received;
  }

  private async _readAIError(resp: Response): Promise<string> {
    const text = await resp.text().catch(() => '');
    return this._extractAIErrorText(text, resp.status);
  }

  private _extractAIErrorText(text: string, status: number): string {
    try {
      const data = JSON.parse(text);
      return data?.error?.message || data?.message || `AI 请求失败 (${status})`;
    } catch {
      return text.trim() || `AI 请求失败 (${status})`;
    }
  }

  private _extractAIText(data: any): string {
    const text = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.delta?.content || data?.content || '';
    if (!text) throw new Error('AI 未返回内容');
    return String(text);
  }

  private _renderSettings(): void {
    this._stopUrlWatch();
    this._body.innerHTML = `
      <div class="nle-ai-form">
        <label>API 地址（支持填 base URL，如 /v1；也支持完整 chat/completions 地址）</label>
        <input id="nle-ai-api-url" type="text" value="${Utils.escapeHtml(this._config.apiUrl)}" placeholder="${DEFAULT_API_URL}">
        <label>API Key</label>
        <input id="nle-ai-api-key" type="password" value="${Utils.escapeHtml(this._config.apiKey)}" placeholder="sk-...">
        <label>模型</label>
        <input id="nle-ai-model" type="text" value="${Utils.escapeHtml(this._config.model)}" placeholder="${DEFAULT_MODEL}">
        <label>简略提示词</label>
        <textarea id="nle-ai-prompt-brief" rows="3" placeholder="${Utils.escapeHtml(PROMPT_BRIEF)}">${Utils.escapeHtml(this._config.promptBrief)}</textarea>
        <label>详细提示词</label>
        <textarea id="nle-ai-prompt-detailed" rows="5" placeholder="${Utils.escapeHtml(PROMPT_DETAILED)}">${Utils.escapeHtml(this._config.promptDetailed)}</textarea>
        <div class="nle-ai-actions">
          <button id="nle-ai-save-settings" class="nle-ai-primary" type="button">保存设置</button>
          <button id="nle-ai-reset-settings" class="nle-ai-secondary" type="button">恢复默认</button>
        </div>
      </div>
    `;
    this._body.querySelector('#nle-ai-save-settings')?.addEventListener('click', () => {
      this._config = {
        apiUrl: this._body.querySelector<HTMLInputElement>('#nle-ai-api-url')?.value.trim() || DEFAULT_API_URL,
        apiKey: this._body.querySelector<HTMLInputElement>('#nle-ai-api-key')?.value.trim() || '',
        model: this._body.querySelector<HTMLInputElement>('#nle-ai-model')?.value.trim() || DEFAULT_MODEL,
        promptBrief: this._body.querySelector<HTMLTextAreaElement>('#nle-ai-prompt-brief')?.value.trim() || '',
        promptDetailed: this._body.querySelector<HTMLTextAreaElement>('#nle-ai-prompt-detailed')?.value.trim() || '',
      };
      this._saveConfig();
      this._showToast('设置已保存');
    });
    this._body.querySelector('#nle-ai-reset-settings')?.addEventListener('click', () => {
      if (!window.confirm('确定恢复默认 AI 配置吗？历史记录不会删除。')) return;
      this._config = { apiUrl: DEFAULT_API_URL, apiKey: '', model: DEFAULT_MODEL, promptBrief: '', promptDetailed: '' };
      this._saveConfig();
      this._renderSettings();
      this._showToast('已恢复默认');
    });
  }

  private _renderHistory(): void {
    this._stopUrlWatch();
    this._history = this._loadHistory();
    if (!this._history.length) {
      this._body.innerHTML = `
        <div class="nle-ai-empty">
          <div class="nle-ai-empty-title">暂无历史记录</div>
          <div class="nle-ai-empty-desc">完成帖子总结后会保存在本地。</div>
        </div>
      `;
      return;
    }
    this._body.innerHTML = `
      <div class="nle-ai-history-head">
        <span>共 ${this._history.length} 条</span>
        <button id="nle-ai-clear-history" type="button">清空</button>
      </div>
      <div class="nle-ai-history-list">
        ${this._history.map((item, idx) => this._renderHistoryItem(item, idx)).join('')}
      </div>
    `;
    this._body.querySelector('#nle-ai-clear-history')?.addEventListener('click', () => {
      if (!window.confirm('确定清空所有 AI 总结历史吗？')) return;
      this._history = [];
      this._saveHistory();
      this._renderHistory();
    });
    this._body.querySelectorAll<HTMLElement>('[data-history-action]').forEach(btn => {
      btn.addEventListener('click', (event) => {
        event.stopPropagation();
        const idx = Utils.toSafeInt(btn.dataset.idx, -1);
        const record = this._history[idx];
        if (!record) return;
        const action = btn.dataset.historyAction;
        if (action === 'view') this._showViewer({ ...record, timestamp: record.timestamp });
        if (action === 'copy') void navigator.clipboard.writeText(record.summary).then(() => this._showToast('已复制'));
        if (action === 'goto') window.open(`${TopicHelpers.getOrigin()}/t/${record.topicId}`, '_blank', 'noopener,noreferrer');
        if (action === 'delete') {
          this._history.splice(idx, 1);
          this._saveHistory();
          this._renderHistory();
        }
      });
    });
    this._body.querySelectorAll<HTMLElement>('[data-history-row]').forEach(row => {
      const open = () => {
        const idx = Utils.toSafeInt(row.dataset.idx, -1);
        const record = this._history[idx];
        if (record) this._showViewer({ ...record, timestamp: record.timestamp });
      };
      row.addEventListener('click', open);
      row.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        open();
      });
    });
  }

  private _renderHistoryItem(item: HistoryRecord, idx: number): string {
    const date = new Date(item.timestamp);
    const dateText = `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    const modeText = item.mode === 'brief' ? '简略' : '详细';
    const preview = item.summary.replace(/\s+/g, ' ').slice(0, 100);
    return `
      <div class="nle-ai-history-item" data-history-row data-idx="${idx}" role="button" tabindex="0">
        <div class="nle-ai-history-title">${Utils.escapeHtml(item.title)}</div>
        <div class="nle-ai-history-meta">${modeText} · ${item.range?.start || 1}-${item.range?.end || '?'} 楼 · ${dateText}</div>
        <div class="nle-ai-history-preview">${Utils.escapeHtml(preview)}${item.summary.length > 100 ? '...' : ''}</div>
        <div class="nle-ai-history-actions">
          <button type="button" data-history-action="view" data-idx="${idx}">查看</button>
          <button type="button" data-history-action="copy" data-idx="${idx}">复制</button>
          <button type="button" data-history-action="goto" data-idx="${idx}">话题</button>
          <button type="button" data-history-action="delete" data-idx="${idx}">删除</button>
        </div>
      </div>
    `;
  }

  private _renderMarkdown(md: string): string {
    if (!md) return '';

    const codeBlocks: string[] = [];
    const inlineCodes: string[] = [];
    let html = md.replace(/\r\n/g, '\n');

    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, lang, code) => {
      const placeholder = `\uE000NLECB${codeBlocks.length}\uE001`;
      const language = Utils.escapeHtml(String(lang || '').trim());
      codeBlocks.push(
        `<pre class="nle-ai-md-codeblock"${language ? ` data-lang="${language}"` : ''}><code>${Utils.escapeHtml(String(code).trim())}</code></pre>`,
      );
      return placeholder;
    });

    html = html.replace(/`([^`\n]+)`/g, (_match, code) => {
      const placeholder = `\uE000NLEIC${inlineCodes.length}\uE001`;
      inlineCodes.push(`<code class="nle-ai-md-inline-code">${Utils.escapeHtml(String(code))}</code>`);
      return placeholder;
    });

    html = Utils.escapeHtml(html);
    html = this._renderMarkdownBlocks(html);

    codeBlocks.forEach((block, i) => {
      html = html.split(`\uE000NLECB${i}\uE001`).join(block);
    });
    inlineCodes.forEach((code, i) => {
      html = html.split(`\uE000NLEIC${i}\uE001`).join(code);
    });

    return `<div class="nle-ai-markdown">${html}</div>`;
  }

  private _renderMarkdownBlocks(html: string): string {
    type MarkdownListKind = 'ul' | 'ol';
    interface MarkdownListItem {
      content: string;
      paragraphs: string[];
      children: MarkdownListNode[];
    }
    interface MarkdownListNode {
      kind: MarkdownListKind;
      indent: number;
      items: MarkdownListItem[];
    }

    const blocks: string[] = [];
    const paragraph: string[] = [];
    const rootLists: MarkdownListNode[] = [];
    const listStack: MarkdownListNode[] = [];
    let listHadBlankLine = false;

    const renderInline = (text: string) => this._renderMarkdownInline(text.trim());
    const renderList = (list: MarkdownListNode): string => {
      const tag = list.kind;
      const listClass = tag === 'ol' ? 'nle-ai-md-ol' : 'nle-ai-md-ul';
      const itemClass = tag === 'ol' ? 'nle-ai-md-oli' : 'nle-ai-md-li';
      const items = list.items
        .map(item => {
          const paragraphs = item.paragraphs.map(text => `<p class="nle-ai-md-p">${text}</p>`).join('');
          const children = item.children.map(renderList).join('');
          return `<li class="${itemClass}">${item.content}${paragraphs}${children}</li>`;
        })
        .join('');
      return `<${tag} class="${listClass}">${items}</${tag}>`;
    };
    const flushParagraph = () => {
      if (!paragraph.length) return;
      blocks.push(`<p class="nle-ai-md-p">${paragraph.map(renderInline).join('<br>')}</p>`);
      paragraph.length = 0;
    };
    const flushLists = () => {
      if (!rootLists.length) return;
      blocks.push(rootLists.map(renderList).join(''));
      rootLists.length = 0;
      listStack.length = 0;
      listHadBlankLine = false;
    };
    const getIndent = (value: string) => value.replace(/\t/g, '    ').length;
    const currentListItem = () => {
      const list = listStack[listStack.length - 1];
      return list?.items[list.items.length - 1] ?? null;
    };
    const createList = (kind: MarkdownListKind, indent: number): MarkdownListNode => {
      const list: MarkdownListNode = { kind, indent, items: [] };
      const parent = listStack[listStack.length - 1];
      const parentItem = parent?.items[parent.items.length - 1];
      if (parent && parentItem && indent > parent.indent) parentItem.children.push(list);
      else rootLists.push(list);
      listStack.push(list);
      return list;
    };
    const getListForItem = (kind: MarkdownListKind, indent: number): MarkdownListNode => {
      while (listStack.length && indent < listStack[listStack.length - 1].indent) listStack.pop();

      const current = listStack[listStack.length - 1];
      if (current?.indent === indent) {
        if (current.kind === kind) return current;
        listStack.pop();
        return createList(kind, indent);
      }
      if (!current || indent > current.indent) return createList(kind, indent);

      return createList(kind, indent);
    };
    const parseTableRow = (value: string): string[] => {
      let row = value.trim();
      if (!row.includes('|')) return [];
      if (row.startsWith('|')) row = row.slice(1);
      if (row.endsWith('|') && row[row.length - 2] !== '\\') row = row.slice(0, -1);

      const cells: string[] = [];
      let cell = '';
      for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '|' && row[i - 1] !== '\\') {
          cells.push(cell.replace(/\\\|/g, '|').trim());
          cell = '';
          continue;
        }
        cell += char;
      }
      cells.push(cell.replace(/\\\|/g, '|').trim());
      return cells;
    };
    const isTableSeparator = (value: string) => {
      const cells = parseTableRow(value);
      return cells.length > 1 && cells.every(cell => /^:?-{3,}:?$/.test(cell.replace(/\s+/g, '')));
    };
    const isTableRow = (value: string) => parseTableRow(value).length > 1;
    const renderTable = (head: string[], rows: string[][]): string => {
      const columnCount = Math.max(head.length, ...rows.map(row => row.length));
      const normalizeCells = (cells: string[]) => {
        const normalized = cells.slice(0, columnCount);
        while (normalized.length < columnCount) normalized.push('');
        return normalized;
      };
      const renderCells = (cells: string[], tag: 'th' | 'td') =>
        normalizeCells(cells).map(cell => `<${tag}>${renderInline(cell)}</${tag}>`).join('');
      const body = rows.map(row => `<tr>${renderCells(row, 'td')}</tr>`).join('');
      return `
        <div class="nle-ai-md-table-wrap">
          <table class="nle-ai-md-table">
            <thead><tr>${renderCells(head, 'th')}</tr></thead>
            <tbody>${body}</tbody>
          </table>
        </div>
      `;
    };

    const lines = html.split('\n');
    for (let index = 0; index < lines.length; index++) {
      const rawLine = lines[index];
      const line = rawLine.replace(/\s+$/, '');
      const trimmed = line.trim();

      if (!trimmed) {
        flushParagraph();
        if (listStack.length) listHadBlankLine = true;
        continue;
      }

      const heading = trimmed.match(/^(#{1,4})\s+(.+)$/);
      if (heading) {
        flushParagraph();
        flushLists();
        const level = Math.min(heading[1].length + 1, 5);
        blocks.push(`<h${level} class="nle-ai-md-h${level}">${renderInline(heading[2])}</h${level}>`);
        continue;
      }

      if (/^(---+|\*\*\*+)$/.test(trimmed)) {
        flushParagraph();
        flushLists();
        blocks.push('<hr class="nle-ai-md-hr">');
        continue;
      }

      const quote = trimmed.match(/^&gt;\s+(.+)$/);
      if (quote) {
        flushParagraph();
        flushLists();
        blocks.push(`<blockquote class="nle-ai-md-quote">${renderInline(quote[1])}</blockquote>`);
        continue;
      }

      if (index + 1 < lines.length && isTableRow(line) && isTableSeparator(lines[index + 1])) {
        flushParagraph();
        flushLists();
        const head = parseTableRow(line);
        const rows: string[][] = [];
        index += 2;
        while (index < lines.length && isTableRow(lines[index])) {
          rows.push(parseTableRow(lines[index]));
          index++;
        }
        index--;
        blocks.push(renderTable(head, rows));
        continue;
      }

      const listItem = line.match(/^(\s*)(?:(\d+)\.\s+|[-*]\s+)(.+)$/);
      if (listItem) {
        flushParagraph();
        listHadBlankLine = false;
        const indent = getIndent(listItem[1]);
        const kind: MarkdownListKind = listItem[2] ? 'ol' : 'ul';
        const list = getListForItem(kind, indent);
        list.items.push({ content: renderInline(listItem[3]), paragraphs: [], children: [] });
        continue;
      }

      const item = currentListItem();
      const textIndent = getIndent(line.match(/^(\s*)/)?.[1] ?? '');
      const currentList = listStack[listStack.length - 1];
      if (item && (!listHadBlankLine || textIndent > (currentList?.indent ?? 0))) {
        listHadBlankLine = false;
        item.paragraphs.push(renderInline(trimmed));
        continue;
      }
      flushLists();
      paragraph.push(trimmed);
    }

    flushParagraph();
    flushLists();
    return blocks.join('');
  }

  private _renderMarkdownInline(text: string): string {
    let html = text;
    html = html.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__([^_]+?)__/g, '<strong>$1</strong>');
    html = html.replace(/(^|[^\*])\*([^*\n]+?)\*(?!\*)/g, '$1<em>$2</em>');
    html = html.replace(/(^|[^_])_([^_\n]+?)_(?!_)/g, '$1<em>$2</em>');
    html = html.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="nle-ai-md-link">$1</a>');
    return html;
  }
}
