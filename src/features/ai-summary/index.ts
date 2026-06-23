/**
 * AI 帖子总结主类
 */

import { Storage } from '../../utils/storage';
import { Utils } from '../../utils/helpers';
import { Network } from '../../utils/network';
import { AIConfigManager } from './config';
import { SummaryHistoryManager } from './history';
import { AISummaryGenerator } from './generator';
import { SummaryViewer } from './viewer';
import { renderMarkdown } from './markdown';
import type { SummaryMode, TopicInfo, HistoryRecord, ViewerPayload, ChatMessage } from './types';
import { PROMPT_BRIEF, PROMPT_DETAILED } from './types';
import { TopicInfoCard } from '../../ui/components/topic-info-card';

export class AITopicSummary {
  private _overlay: HTMLElement;
  private _body: HTMLElement;
  private _mountHost: HTMLElement;
  private _configManager: AIConfigManager;
  private _historyManager: SummaryHistoryManager;
  private _generator: AISummaryGenerator | null = null;
  private _viewer: SummaryViewer;
  private _mode: SummaryMode = 'detailed';
  private _topicCache: TopicInfo | null = null;
  private _abort: AbortController | null = null;
  private _chatAbort: AbortController | null = null;
  private _lastUrl = location.href;
  private _urlTimer: ReturnType<typeof setInterval> | null = null;
  private _keydownHandler: ((event: KeyboardEvent) => void) | null = null;

  constructor(
    private _root: HTMLElement,
    private _storage: Storage,
    private _showToast: (msg: string) => void,
  ) {
    this._mountHost = this._root.querySelector<HTMLElement>('.nle-main')
      || this._root.querySelector<HTMLElement>('.nle-body')
      || this._root;

    this._configManager = new AIConfigManager(this._storage);
    this._historyManager = new SummaryHistoryManager(this._storage);
    this._viewer = new SummaryViewer(
      this._storage,
      this._showToast,
      (question, onChunk) => this._handleFollowUpQuestion(question, onChunk),
    );

    this._overlay = document.createElement('div');
    this._overlay.className = 'nle-ai-overlay nle-overlay-base';
    this._overlay.innerHTML = `
      <div class="nle-ai-header nle-overlay-header">
        <div class="nle-ai-title">AI 帖子总结</div>
        <div class="nle-ai-header-actions">
          <button class="nle-ai-refresh nle-btn-sm" type="button">刷新</button>
          <button class="nle-ai-close nle-btn-close" type="button" title="关闭">×</button>
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
    const topicId = Network.getTopicId();
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
    this._viewer.close();
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
      if (e.key === 'Escape' && this._overlay.classList.contains('show')) this.hide();
    };
    document.addEventListener('keydown', this._keydownHandler);
  }

  private async _getTopicInfo(refresh = false): Promise<TopicInfo | null> {
    const topicId = Network.getTopicId();
    if (!topicId) return null;
    if (!refresh && this._topicCache?.id === topicId) return this._topicCache;

    try {
      const data = await Network.fetchJSONDirect<any>(`/t/${topicId}.json`);
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
      if (!Network.getTopicId()) return;
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
    if (!Network.getTopicId()) {
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

      const config = this._configManager.get();
      const hasApi = config.apiUrl.trim().length > 0;

      this._body.innerHTML = `
        ${TopicInfoCard.render(info, { compact: true, showTags: false })}
        ${hasApi ? '' : '<div class="nle-ai-warning">请先在"设置"里填写 OpenAI 兼容 API 地址。</div>'}
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

    const config = this._configManager.get();
    if (!config.apiUrl.trim()) {
      setStatus('请先在设置中填写 API 地址', 'error');
      return;
    }

    this._abort = new AbortController();
    this._generator = new AISummaryGenerator(config);

    button.disabled = true;
    button.textContent = '获取帖子内容...';
    stopButton.style.display = '';
    setStatus('正在获取帖子内容...');

    const updateStatus = (text: string) => {
      button.textContent = text;
      setStatus(text);
    };

    try {
      const dialogues = await this._generator.fetchTopicContent(
        info.id,
        start,
        end,
        this._abort.signal,
        updateStatus,
      );

      if (!dialogues.trim()) throw new Error('没有获取到可总结的帖子内容');

      const prompt = this._mode === 'brief'
        ? (config.promptBrief.trim() || PROMPT_BRIEF)
        : (config.promptDetailed.trim() || PROMPT_DETAILED);

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

      this._viewer.show(viewerPayload);

      let currentOutput = '';
      await this._generator.generate(prompt, content, this._abort.signal, (chunk) => {
        currentOutput += chunk;
        this._viewer.updateSummary(currentOutput, true);
      });

      if (!currentOutput.trim()) throw new Error('AI 未返回内容');

      this._viewer.updateSummary(currentOutput, false);

      const record: HistoryRecord = {
        topicId: info.id,
        title: info.title,
        summary: currentOutput,
        mode: this._mode,
        range: { start, end },
        timestamp: Date.now(),
      };

      this._historyManager.add(record);
      this._viewer.setChatMessages([
        {
          role: 'system',
          content: `你是一个帮助用户理解论坛帖子内容的助手。以下是话题"${info.title}"的总结：\n\n${currentOutput}\n\n请基于这个总结回答用户问题。如果问题超出总结内容范围，请明确说明。`,
        },
        { role: 'assistant', content: currentOutput },
      ]);

      setStatus('总结完成，可在弹窗中阅读或追问');
      this._showToast('总结完成');
    } catch (e) {
      const err = e as Error;
      const message = err.name === 'AbortError' ? '已停止总结' : (err.message || '总结失败');
      setStatus(message, 'error');
      this._viewer.showError(message);
    } finally {
      button.disabled = false;
      button.textContent = '开始总结';
      stopButton.style.display = 'none';
      this._abort = null;
    }
  }

  private async _handleFollowUpQuestion(question: string, onChunk: (chunk: string) => void): Promise<void> {
    if (!this._generator) {
      this._generator = new AISummaryGenerator(this._configManager.get());
    }

    this._chatAbort = new AbortController();
    const messages = this._viewer.getChatMessages();

    try {
      await this._generator.generate(
        '请基于已有帖子总结回答追问。',
        question,
        this._chatAbort.signal,
        onChunk,
        messages,
      );
    } finally {
      this._chatAbort = null;
    }
  }

  private _renderSettings(): void {
    this._stopUrlWatch();
    const config = this._configManager.get();

    this._body.innerHTML = `
      <div class="nle-ai-form">
        <label>API 地址（支持填 base URL，如 /v1；也支持完整 chat/completions 地址）</label>
        <input id="nle-ai-api-url" type="text" value="${Utils.escapeHtml(config.apiUrl)}" placeholder="https://api.openai.com/v1/chat/completions">
        <label>API Key</label>
        <input id="nle-ai-api-key" type="password" value="${Utils.escapeHtml(config.apiKey)}" placeholder="sk-...">
        <label>模型</label>
        <input id="nle-ai-model" type="text" value="${Utils.escapeHtml(config.model)}" placeholder="gpt-4o-mini">
        <label>简略提示词</label>
        <textarea id="nle-ai-prompt-brief" rows="3" placeholder="${Utils.escapeHtml(PROMPT_BRIEF)}">${Utils.escapeHtml(config.promptBrief)}</textarea>
        <label>详细提示词</label>
        <textarea id="nle-ai-prompt-detailed" rows="5" placeholder="${Utils.escapeHtml(PROMPT_DETAILED)}">${Utils.escapeHtml(config.promptDetailed)}</textarea>
        <div class="nle-ai-actions">
          <button id="nle-ai-save-settings" class="nle-ai-primary" type="button">保存设置</button>
          <button id="nle-ai-reset-settings" class="nle-ai-secondary" type="button">恢复默认</button>
        </div>
      </div>
    `;

    this._body.querySelector('#nle-ai-save-settings')?.addEventListener('click', () => {
      this._configManager.set({
        apiUrl: this._body.querySelector<HTMLInputElement>('#nle-ai-api-url')?.value.trim() || '',
        apiKey: this._body.querySelector<HTMLInputElement>('#nle-ai-api-key')?.value.trim() || '',
        model: this._body.querySelector<HTMLInputElement>('#nle-ai-model')?.value.trim() || 'gpt-4o-mini',
        promptBrief: this._body.querySelector<HTMLTextAreaElement>('#nle-ai-prompt-brief')?.value.trim() || '',
        promptDetailed: this._body.querySelector<HTMLTextAreaElement>('#nle-ai-prompt-detailed')?.value.trim() || '',
      });
      this._showToast('设置已保存');
    });

    this._body.querySelector('#nle-ai-reset-settings')?.addEventListener('click', () => {
      if (!window.confirm('确定恢复默认 AI 配置吗？历史记录不会删除。')) return;
      this._configManager.reset();
      this._renderSettings();
      this._showToast('已恢复默认');
    });
  }

  private _renderHistory(): void {
    this._stopUrlWatch();
    const history = this._historyManager.getAll();

    if (!history.length) {
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
        <span>共 ${history.length} 条</span>
        <button id="nle-ai-clear-history" type="button">清空</button>
      </div>
      <div class="nle-ai-history-list">
        ${history.map((item, idx) => this._renderHistoryItem(item, idx)).join('')}
      </div>
    `;

    this._body.querySelector('#nle-ai-clear-history')?.addEventListener('click', () => {
      if (!window.confirm('确定清空所有 AI 总结历史吗？')) return;
      this._historyManager.clear();
      this._renderHistory();
    });

    this._body.querySelectorAll<HTMLElement>('[data-history-action]').forEach(btn => {
      btn.addEventListener('click', (event) => {
        event.stopPropagation();
        const idx = Utils.toSafeInt(btn.dataset.idx, -1);
        const record = history[idx];
        if (!record) return;

        const action = btn.dataset.historyAction;
        if (action === 'view') this._viewer.show({ ...record, timestamp: record.timestamp });
        if (action === 'copy') void navigator.clipboard.writeText(record.summary).then(() => this._showToast('已复制'));
        if (action === 'goto') window.open(`${Network.getOrigin()}/t/${record.topicId}`, '_blank', 'noopener,noreferrer');
        if (action === 'delete') {
          this._historyManager.delete(record.topicId, record.mode, record.range.start, record.range.end);
          this._renderHistory();
        }
      });
    });

    this._body.querySelectorAll<HTMLElement>('[data-history-row]').forEach(row => {
      const open = () => {
        const idx = Utils.toSafeInt(row.dataset.idx, -1);
        const record = history[idx];
        if (record) this._viewer.show({ ...record, timestamp: record.timestamp });
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
}
