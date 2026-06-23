/**
 * 帖子导出 UI 模块
 */

import type { TopicInfo, ExportFormat, ExportStatus } from './types';
import { Utils } from '../../utils/helpers';

export class ExportUI {
  private _overlay: HTMLElement;
  private _body: HTMLElement;

  constructor(
    private _root: HTMLElement,
    onClose: () => void,
    onRefresh: () => void,
  ) {
    const mountHost = this._root.querySelector<HTMLElement>('.nle-main')
      || this._root.querySelector<HTMLElement>('.nle-body')
      || this._root;

    this._overlay = document.createElement('div');
    this._overlay.className = 'nle-export-overlay nle-overlay-base';
    this._overlay.innerHTML = `
      <div class="nle-export-header nle-overlay-header">
        <div class="nle-export-title">📥 导出帖子</div>
        <div class="nle-export-header-actions">
          <button class="nle-export-refresh nle-btn-sm" type="button">刷新</button>
          <button class="nle-export-close nle-btn-close" type="button" title="关闭">×</button>
        </div>
      </div>
      <div class="nle-export-body"></div>
    `;
    this._body = this._overlay.querySelector('.nle-export-body')!;
    mountHost.appendChild(this._overlay);

    this._overlay.querySelector('.nle-export-close')?.addEventListener('click', onClose);
    this._overlay.querySelector('.nle-export-refresh')?.addEventListener('click', onRefresh);
  }

  show(): void {
    const mountHost = this._root.querySelector<HTMLElement>('.nle-main')
      || this._root.querySelector<HTMLElement>('.nle-body')
      || this._root;
    mountHost.classList.add('nle-subpanel-open');
    this._overlay.classList.add('show');
  }

  hide(): void {
    const mountHost = this._root.querySelector<HTMLElement>('.nle-main')
      || this._root.querySelector<HTMLElement>('.nle-body')
      || this._root;
    this._overlay.classList.remove('show');
    mountHost.classList.remove('nle-subpanel-open');
  }

  remove(): void {
    this._overlay.remove();
  }

  showNotTopic(): void {
    this._body.innerHTML = `
      <div class="nle-export-not-topic">
        <div class="nle-export-not-topic-title">请先进入一个话题帖子</div>
        <div class="nle-export-not-topic-desc">导出功能会抓取当前话题楼层，并生成 Markdown、HTML 或 PDF。</div>
      </div>
    `;
  }

  showLoading(message = '正在获取话题信息...'): void {
    this._body.innerHTML = `<div class="nle-export-status">${Utils.escapeHtml(message)}</div>`;
  }

  showError(error: string): void {
    this._body.innerHTML = `<div class="nle-export-status">${Utils.escapeHtml(error)}</div>`;
  }

  renderHome(
    info: TopicInfo,
    format: ExportFormat,
    embedImages: boolean,
    onFormatChange: (format: ExportFormat) => void,
    onEmbedImagesChange: (embed: boolean) => void,
    onExport: (start: number, end: number) => void,
  ): void {
    const tagHtml = info.tags.map(tag => `<span class="nle-export-tag">${Utils.escapeHtml(tag)}</span>`).join('');
    const categoryHtml = info.category
      ? `<span class="nle-export-category">${Utils.escapeHtml(info.category)}</span>`
      : '';

    this._body.innerHTML = `
      <div class="nle-export-info">
        <div class="nle-export-info-title">${Utils.escapeHtml(info.title)}</div>
        <div class="nle-export-info-tags">${categoryHtml}${tagHtml}</div>
        <div class="nle-export-info-row"><span>话题 ID</span><b>${info.id}</b></div>
        <div class="nle-export-info-row"><span>楼层数</span><b>${info.postsCount}</b></div>
        ${info.views ? `<div class="nle-export-info-row"><span>浏览量</span><b>${Utils.formatNumber(info.views)}</b></div>` : ''}
      </div>
      <div class="nle-export-range">
        <label>楼层范围</label>
        <input id="nle-export-start" type="number" min="1" max="${info.postsCount}" value="1">
        <span>至</span>
        <input id="nle-export-end" type="number" min="1" max="${info.postsCount}" value="${info.postsCount}">
      </div>
      <div class="nle-export-section-title">导出格式</div>
      <div class="nle-export-formats">
        <button class="nle-export-format ${format === 'html' ? 'active' : ''}" type="button" data-format="html">HTML</button>
        <button class="nle-export-format ${format === 'md' ? 'active' : ''}" type="button" data-format="md">Markdown</button>
        <button class="nle-export-format ${format === 'pdf' ? 'active' : ''}" type="button" data-format="pdf">PDF</button>
      </div>
      <label class="nle-export-option">
        <input id="nle-export-embed-images" type="checkbox" ${embedImages ? 'checked' : ''}>
        <span>HTML/PDF 嵌入图片</span>
      </label>
      <div class="nle-export-actions">
        <button id="nle-export-start-btn" class="nle-export-start" type="button">开始导出</button>
      </div>
      <div id="nle-export-status" class="nle-export-status" style="display:none"></div>
    `;

    // 绑定格式切换
    for (const btn of this._body.querySelectorAll<HTMLElement>('.nle-export-format')) {
      btn.addEventListener('click', () => {
        const newFormat = (btn.dataset.format || 'md') as ExportFormat;
        for (const item of this._body.querySelectorAll('.nle-export-format')) item.classList.remove('active');
        btn.classList.add('active');
        onFormatChange(newFormat);
      });
    }

    // 绑定嵌入图片选项
    const embedCheckbox = this._body.querySelector<HTMLInputElement>('#nle-export-embed-images');
    embedCheckbox?.addEventListener('change', () => {
      onEmbedImagesChange(embedCheckbox.checked);
    });

    // 绑定导出按钮
    this._body.querySelector('#nle-export-start-btn')?.addEventListener('click', () => {
      const startInput = this._body.querySelector<HTMLInputElement>('#nle-export-start');
      const endInput = this._body.querySelector<HTMLInputElement>('#nle-export-end');
      const start = Utils.toSafeInt(startInput?.value, 1);
      const end = Utils.toSafeInt(endInput?.value, info.postsCount);
      onExport(start, end);
    });
  }

  setStatus(status: ExportStatus): void {
    const statusEl = this._body.querySelector<HTMLElement>('#nle-export-status');
    if (!statusEl) return;

    statusEl.style.display = '';
    const icon = status.icon ? `${status.icon} ` : '';
    const progress = status.total && status.current !== undefined
      ? ` (${status.current}/${status.total})`
      : '';
    const detail = status.detail ? `<br><span style="font-size:12px;opacity:0.8">${Utils.escapeHtml(status.detail)}</span>` : '';
    statusEl.innerHTML = `${icon}${Utils.escapeHtml(status.message)}${progress}${detail}`;
  }

  enableExportButton(): void {
    const actions = this._body.querySelector<HTMLElement>('.nle-export-actions');
    if (!actions) return;
    actions.innerHTML = '<button id="nle-export-start-btn" class="nle-export-start" type="button">开始导出</button>';
  }

  replaceExportButton(onExport: (start: number, end: number) => void, info: TopicInfo): void {
    const actions = this._body.querySelector<HTMLElement>('.nle-export-actions');
    if (!actions) return;
    actions.innerHTML = '<button id="nle-export-start-btn" class="nle-export-start" type="button">开始导出</button>';
    actions.querySelector('#nle-export-start-btn')?.addEventListener('click', () => {
      const startInput = this._body.querySelector<HTMLInputElement>('#nle-export-start');
      const endInput = this._body.querySelector<HTMLInputElement>('#nle-export-end');
      const start = Utils.toSafeInt(startInput?.value, 1);
      const end = Utils.toSafeInt(endInput?.value, info.postsCount);
      onExport(start, end);
    });
  }

  disableExportButton(label = '导出中...'): void {
    const actions = this._body.querySelector<HTMLElement>('.nle-export-actions');
    if (!actions) return;
    actions.innerHTML = `<button class="nle-export-start" type="button" disabled>${Utils.escapeHtml(label)}</button>`;
  }

  showCancelButton(onCancel: () => void): void {
    const actions = this._body.querySelector<HTMLElement>('.nle-export-actions');
    if (!actions) return;
    actions.innerHTML = '<button class="nle-export-cancel" type="button">取消导出</button>';
    actions.querySelector('.nle-export-cancel')?.addEventListener('click', onCancel);
  }

  syncEmbedImagesControl(format: ExportFormat): void {
    const checkbox = this._body.querySelector<HTMLInputElement>('#nle-export-embed-images');
    const label = checkbox?.closest<HTMLElement>('label');
    if (!label) return;
    label.style.display = format === 'md' ? 'none' : '';
  }
}
