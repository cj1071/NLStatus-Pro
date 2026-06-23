/**
 * AI 总结查看器
 */

import { Storage } from '../../utils/storage';
import { Utils } from '../../utils/helpers';
import { Network } from '../../utils/network';
import { renderMarkdown } from './markdown';
import type { ViewerPayload, ChatMessage } from './types';

const VIEWER_FONT_KEY = 'aiTopicSummaryViewerFont';
const VIEWER_READING_KEY = 'aiTopicSummaryViewerReading';

export class SummaryViewer {
  private _overlay: HTMLElement | null = null;
  private _escHandler: ((event: KeyboardEvent) => void) | null = null;
  private _resizeHandler: ((event: MouseEvent) => void) | null = null;
  private _resizeUpHandler: (() => void) | null = null;
  private _suppressBackdropClick = false;
  private _currentOutput = '';
  private _chatMessages: ChatMessage[] = [];

  constructor(
    private _storage: Storage,
    private _showToast: (msg: string) => void,
    private _onAskFollowUp: (question: string, onChunk: (chunk: string) => void) => Promise<void>,
  ) {}

  show(data: ViewerPayload): void {
    this.close();
    this._currentOutput = data.summary || '';

    const fontSize = this._getFont();
    const isReading = this._getReading();
    const modeText = data.mode === 'brief' ? '简略' : '详细';
    const rangeMeta = data.range ? `<span>${data.range.start}-${data.range.end} 楼</span>` : '';
    const summaryHtml = data.summary
      ? renderMarkdown(data.summary)
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
            <span>${this._formatDate(data.timestamp)}</span>
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
    this._overlay = overlay;
    this._bindEvents(data);
    this._bindResize(overlay);
    this._resetChat(data);
    this.updateSummary(data.summary, !!data.streaming);
  }

  close(): void {
    if (this._overlay) {
      this._overlay.remove();
      this._overlay = null;
    }
    this._suppressBackdropClick = false;

    if (this._escHandler) {
      document.removeEventListener('keydown', this._escHandler);
      this._escHandler = null;
    }
    if (this._resizeHandler) {
      document.removeEventListener('mousemove', this._resizeHandler);
      this._resizeHandler = null;
    }
    if (this._resizeUpHandler) {
      document.removeEventListener('mouseup', this._resizeUpHandler);
      this._resizeUpHandler = null;
    }
  }

  updateSummary(summary: string, streaming: boolean): void {
    if (summary.trim()) this._currentOutput = summary;
    const summaryEl = this._overlay?.querySelector<HTMLElement>('#nle-ai-viewer-summary');
    const content = this._overlay?.querySelector<HTMLElement>('#nle-ai-viewer-content');
    if (!summaryEl || !content) return;

    summaryEl.innerHTML = summary.trim()
      ? `${renderMarkdown(summary)}${streaming ? '<span class="nle-ai-cursor">|</span>' : ''}`
      : `<div class="nle-ai-status">${streaming ? '正在生成总结...' : '暂无总结内容'}</div>`;

    content.scrollTop = content.scrollHeight;
    this._setChatEnabled(!streaming && summary.trim().length > 0);
  }

  showError(message: string): void {
    const summaryEl = this._overlay?.querySelector<HTMLElement>('#nle-ai-viewer-summary');
    if (!summaryEl) return;
    summaryEl.innerHTML = `<div class="nle-ai-error">${Utils.escapeHtml(message)}</div>`;
    this._setChatEnabled(false);
  }

  appendMessage(role: 'user' | 'assistant', content: string, html = false): HTMLElement {
    const list = this._overlay?.querySelector<HTMLElement>('#nle-ai-viewer-content');
    const item = document.createElement('div');
    item.className = `nle-ai-viewer-msg ${role}`;
    item.innerHTML = `
      <div class="nle-ai-viewer-msg-label">${role === 'user' ? '你的问题' : 'AI 回复'}</div>
      <div class="nle-ai-viewer-msg-content">${html ? content : (role === 'user' ? Utils.escapeHtml(content) : renderMarkdown(content))}</div>
    `;
    list?.appendChild(item);
    if (list) list.scrollTop = list.scrollHeight;
    return item.querySelector<HTMLElement>('.nle-ai-viewer-msg-content')!;
  }

  getChatMessages(): ChatMessage[] {
    return this._chatMessages;
  }

  setChatMessages(messages: ChatMessage[]): void {
    this._chatMessages = messages;
  }

  private _bindEvents(data: ViewerPayload): void {
    const overlay = this._overlay;
    if (!overlay) return;

    overlay.querySelector('#nle-ai-viewer-close')?.addEventListener('click', () => this.close());
    overlay.addEventListener('click', (event) => {
      if (this._suppressBackdropClick) {
        this._suppressBackdropClick = false;
        return;
      }
      if (event.target === overlay) this.close();
    });

    this._escHandler = (event) => {
      if (event.key === 'Escape') this.close();
    };
    document.addEventListener('keydown', this._escHandler);

    overlay.querySelector('#nle-ai-viewer-copy')?.addEventListener('click', () => this._copy(data.title));
    overlay.querySelector('#nle-ai-viewer-goto')?.addEventListener('click', () => {
      window.open(`${Network.getOrigin()}/t/${data.topicId}`, '_blank', 'noopener,noreferrer');
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

    overlay.querySelector('#nle-ai-viewer-chat-send')?.addEventListener('click', () => this._askFollowUp(data));
    overlay.querySelector<HTMLInputElement>('#nle-ai-viewer-chat-input')?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        void this._askFollowUp(data);
      }
    });
  }

  private _bindResize(overlay: HTMLElement): void {
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
      this._suppressBackdropClick = true;
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

    this._resizeHandler = (event) => {
      if (!resizing) return;
      const nextWidth = Math.min(window.innerWidth - 24, Math.max(360, startWidth + event.clientX - startX));
      const nextHeight = Math.min(window.innerHeight - 24, Math.max(360, startHeight + event.clientY - startY));
      viewer.style.width = `${nextWidth}px`;
      viewer.style.height = `${nextHeight}px`;
    };

    this._resizeUpHandler = () => {
      if (resizing) {
        window.setTimeout(() => {
          this._suppressBackdropClick = false;
        }, 0);
      }
      resizing = false;
    };

    document.addEventListener('mousemove', this._resizeHandler);
    document.addEventListener('mouseup', this._resizeUpHandler);
  }

  private _resetChat(data: ViewerPayload): void {
    if (!data.summary.trim()) {
      this._chatMessages = [];
      this._setChatEnabled(false);
      return;
    }

    this._chatMessages = [
      {
        role: 'system',
        content: `你是一个帮助用户理解论坛帖子内容的助手。以下是话题"${data.title}"的总结：\n\n${data.summary}\n\n请基于这个总结回答用户问题。如果问题超出总结内容范围，请明确说明。`,
      },
      { role: 'assistant', content: data.summary },
    ];
    this._setChatEnabled(true);
  }

  private _setChatEnabled(enabled: boolean): void {
    const overlay = this._overlay;
    const input = overlay?.querySelector<HTMLInputElement>('#nle-ai-viewer-chat-input');
    const send = overlay?.querySelector<HTMLButtonElement>('#nle-ai-viewer-chat-send');
    const hint = overlay?.querySelector<HTMLElement>('#nle-ai-viewer-chat-hint');
    if (!input || !send || !hint) return;

    input.disabled = !enabled;
    send.disabled = !enabled;
    input.placeholder = enabled ? '输入问题继续追问...' : '总结生成完成后可追问';
    hint.textContent = enabled ? '💡 基于以上总结内容进行追问' : '总结生成完成后可追问';
  }

  private async _askFollowUp(data: ViewerPayload): Promise<void> {
    const overlay = this._overlay;
    const input = overlay?.querySelector<HTMLInputElement>('#nle-ai-viewer-chat-input');
    const send = overlay?.querySelector<HTMLButtonElement>('#nle-ai-viewer-chat-send');
    const content = overlay?.querySelector<HTMLElement>('#nle-ai-viewer-content');
    if (!overlay || !input || !send || !content) return;

    const question = input.value.trim();
    if (!question || !this._currentOutput.trim()) return;

    input.value = '';
    input.disabled = true;
    send.disabled = true;
    send.classList.add('loading');

    this.appendMessage('user', question);
    const answerEl = this.appendMessage('assistant', '<span class="nle-ai-chat-typing">思考中...</span>', true);

    try {
      const messages: ChatMessage[] = this._chatMessages.length
        ? [...this._chatMessages, { role: 'user', content: question }]
        : [
            {
              role: 'system',
              content: `你是一个帮助用户理解论坛帖子内容的助手。请基于话题"${data.title}"的总结回答问题：\n\n${this._currentOutput}`,
            },
            { role: 'user', content: question },
          ];

      let answer = '';
      await this._onAskFollowUp(question, (chunk) => {
        answer += chunk;
        answerEl.innerHTML = renderMarkdown(answer);
        content.scrollTop = content.scrollHeight;
      });

      if (!answer.trim()) throw new Error('AI 未返回内容');
      this._chatMessages = [...messages, { role: 'assistant', content: answer }];
    } catch (e) {
      answerEl.innerHTML = `<span class="nle-ai-chat-error">${Utils.escapeHtml(((e as Error).name === 'AbortError' ? '已停止追问' : (e as Error).message) || '追问失败')}</span>`;
    } finally {
      input.disabled = false;
      send.disabled = false;
      send.classList.remove('loading');
      input.focus();
    }
  }

  private _copy(title: string): void {
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

  private _formatDate(timestamp?: number): string {
    if (!timestamp) return '刚刚';
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  private _getFont(): string {
    const value = this._storage.get(VIEWER_FONT_KEY, 'md');
    return typeof value === 'string' && ['sm', 'md', 'lg', 'xl'].includes(value) ? value : 'md';
  }

  private _getReading(): boolean {
    return this._storage.get(VIEWER_READING_KEY, false) === true;
  }
}