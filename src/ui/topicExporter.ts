import { CURRENT_SITE } from '../site';
import { Network } from '../utils/network';
import { Utils } from '../utils/helpers';
import { TopicHelpers } from '../utils/topicHelpers';

type ExportFormat = 'md' | 'html' | 'pdf';

interface TopicInfo {
  id: number;
  title: string;
  postsCount: number;
  views: number;
  category: string;
  categoryColor: string;
  tags: string[];
}

interface TopicPost {
  postNumber: number;
  author: {
    username: string;
    name: string;
    avatarUrl: string;
  };
  timestamp: string;
  content: string;
  replyTo: {
    postNumber: number;
    username: string;
  } | null;
  likeCount: number;
}

interface ExportData {
  topic: TopicInfo;
  posts: TopicPost[];
  exportDate: string;
  postCount: number;
  range: {
    start: number;
    end: number;
  };
}

interface ExportStatus {
  icon?: string;
  message: string;
  detail?: string;
  current?: number;
  total?: number;
}

export class TopicExporter {
  private _overlay: HTMLElement;
  private _body: HTMLElement;
  private _mountHost: HTMLElement;
  private _format: ExportFormat = 'html';
  private _embedImages = false;
  private _cache: TopicInfo | null = null;
  private _abort: AbortController | null = null;
  private _imageCache = new Map<string, string>();

  constructor(
    private _root: HTMLElement,
    private _showToast: (msg: string) => void,
  ) {
    this._mountHost = this._root.querySelector<HTMLElement>('.nle-main')
      || this._root.querySelector<HTMLElement>('.nle-body')
      || this._root;
    this._overlay = document.createElement('div');
    this._overlay.className = 'nle-export-overlay';
    this._overlay.innerHTML = `
      <div class="nle-export-header">
        <div class="nle-export-title">📥 导出帖子</div>
        <div class="nle-export-header-actions">
          <button class="nle-export-refresh" type="button">刷新</button>
          <button class="nle-export-close" type="button" title="关闭">×</button>
        </div>
      </div>
      <div class="nle-export-body"></div>
    `;
    this._body = this._overlay.querySelector('.nle-export-body')!;
    this._mountHost.appendChild(this._overlay);

    this._overlay.querySelector('.nle-export-close')?.addEventListener('click', () => this.hide());
    this._overlay.querySelector('.nle-export-refresh')?.addEventListener('click', () => this._renderHome(true));
  }

  show(): void {
    this._mountHost.classList.add('nle-subpanel-open');
    this._overlay.classList.add('show');
    void this._renderHome(false);
  }

  hide(): void {
    this._abort?.abort();
    this._abort = null;
    this._overlay.classList.remove('show');
    this._mountHost.classList.remove('nle-subpanel-open');
  }

  destroy(): void {
    this.hide();
    this._imageCache.clear();
    this._overlay.remove();
  }

  private async _getTopicInfo(refresh = false): Promise<TopicInfo | null> {
    const topicId = TopicHelpers.getTopicId();
    if (!topicId) return null;
    if (!refresh && this._cache?.id === topicId) return this._cache;

    const data = await TopicHelpers.fetchJSON<any>(`/t/topic/${topicId}.json`);
    const tags = (data?.tags || [])
      .map((tag: unknown) => typeof tag === 'string' ? tag : (tag as { name?: string })?.name || '')
      .filter(Boolean);
    const category = document.querySelector('.badge-category__name, .category-name')?.textContent?.trim() || '';
    const categoryStyle = document.querySelector('.badge-category')?.getAttribute('style') || '';

    this._cache = {
      id: topicId,
      title: Utils.sanitize(data?.title || data?.fancy_title || '当前话题', 160),
      postsCount: Math.max(1, Utils.toSafeInt(data?.posts_count, 1)),
      views: Utils.toSafeInt(data?.views, 0),
      category,
      categoryColor: categoryStyle.match(/background-color:\s*#([0-9a-fA-F]+)/)?.[1] || '',
      tags,
    };
    return this._cache;
  }

  private async _renderHome(refresh = false): Promise<void> {
    const topicId = TopicHelpers.getTopicId();
    if (!topicId) {
      this._body.innerHTML = `
        <div class="nle-export-not-topic">
          <div class="nle-export-not-topic-title">请先进入一个话题帖子</div>
          <div class="nle-export-not-topic-desc">导出功能会抓取当前话题楼层，并生成 Markdown、HTML 或 PDF。</div>
        </div>
      `;
      return;
    }

    this._body.innerHTML = '<div class="nle-export-status">正在获取话题信息...</div>';

    try {
      const info = await this._getTopicInfo(refresh);
      if (!info) throw new Error('获取话题信息失败');

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
          <button class="nle-export-format ${this._format === 'html' ? 'active' : ''}" type="button" data-format="html">HTML</button>
          <button class="nle-export-format ${this._format === 'md' ? 'active' : ''}" type="button" data-format="md">Markdown</button>
          <button class="nle-export-format ${this._format === 'pdf' ? 'active' : ''}" type="button" data-format="pdf">PDF</button>
        </div>
        <label class="nle-export-option">
          <input id="nle-export-embed-images" type="checkbox" ${this._embedImages ? 'checked' : ''}>
          <span>HTML/PDF 嵌入图片</span>
        </label>
        <div class="nle-export-actions">
          <button id="nle-export-start-btn" class="nle-export-start" type="button">开始导出</button>
        </div>
        <div id="nle-export-status" class="nle-export-status" style="display:none"></div>
      `;

      this._bindHomeEvents(info);
    } catch (e) {
      this._body.innerHTML = `<div class="nle-export-status">${Utils.escapeHtml((e as Error).message || '获取话题信息失败')}</div>`;
    }
  }

  private _bindHomeEvents(info: TopicInfo): void {
    for (const btn of this._body.querySelectorAll<HTMLElement>('.nle-export-format')) {
      btn.addEventListener('click', () => {
        this._format = (btn.dataset.format || 'md') as ExportFormat;
        for (const item of this._body.querySelectorAll('.nle-export-format')) item.classList.remove('active');
        btn.classList.add('active');
        this._syncEmbedImagesControl();
      });
    }

    this._body.querySelector<HTMLInputElement>('#nle-export-embed-images')?.addEventListener('change', (e) => {
      this._embedImages = (e.currentTarget as HTMLInputElement).checked;
    });
    this._syncEmbedImagesControl();
    this._body.querySelector('#nle-export-start-btn')?.addEventListener('click', () => this._doExport(info));
  }

  private _syncEmbedImagesControl(): void {
    const input = this._body.querySelector<HTMLInputElement>('#nle-export-embed-images');
    if (!input) return;
    const isMarkdown = this._format === 'md';
    input.disabled = isMarkdown;
    input.checked = isMarkdown ? false : this._embedImages;
  }

  private async _doExport(info: TopicInfo): Promise<void> {
    const startInput = this._body.querySelector<HTMLInputElement>('#nle-export-start');
    const endInput = this._body.querySelector<HTMLInputElement>('#nle-export-end');
    const actions = this._body.querySelector<HTMLElement>('.nle-export-actions');
    const statusEl = this._body.querySelector<HTMLElement>('#nle-export-status');
    if (!startInput || !endInput || !actions || !statusEl) return;

    const start = Math.max(1, Math.min(Utils.toSafeInt(startInput.value, 1), info.postsCount));
    const end = Math.max(1, Math.min(Utils.toSafeInt(endInput.value, info.postsCount), info.postsCount));
    if (start > end) {
      this._showToast('起始楼层不能大于结束楼层');
      return;
    }

    this._abort = new AbortController();
    actions.innerHTML = '<button id="nle-export-stop-btn" class="nle-export-stop" type="button">停止导出</button>';
    actions.querySelector('#nle-export-stop-btn')?.addEventListener('click', () => this._abort?.abort());
    statusEl.style.display = '';

    const setStatus = (state: ExportStatus) => {
      const progress = state.total
        ? `<div class="nle-export-status-sub">进度：${Math.min(state.current || 0, state.total)}/${state.total}</div>`
        : '';
      const detail = state.detail ? `<div class="nle-export-status-sub">${Utils.escapeHtml(state.detail)}</div>` : '';
      statusEl.innerHTML = `
        <div class="nle-export-status-main">${Utils.escapeHtml(`${state.icon || ''} ${state.message}`.trim())}</div>
        ${progress}
        ${detail}
      `;
    };

    try {
      setStatus({ message: '正在获取帖子列表...', current: 0, total: end - start + 1 });
      const posts = await this._fetchPosts(info.id, start, end, setStatus, this._abort.signal);
      if (this._abort.signal.aborted) throw new Error('导出已取消');
      if (!posts.length) throw new Error('没有获取到帖子内容');

      const data: ExportData = {
        topic: info,
        posts,
        exportDate: new Date().toISOString(),
        postCount: posts.length,
        range: { start, end },
      };

      setStatus({ message: '正在生成文件...', current: posts.length, total: posts.length });
      if (this._format === 'md') {
        this._download(this._genMarkdown(data), this._genFilename(info, 'md'), 'text/markdown;charset=utf-8');
      } else {
        const html = this._genHTML(data);
        if (this._format === 'html') {
          this._download(html, this._genFilename(info, 'html'), 'text/html;charset=utf-8');
        } else {
          this._printPDF(html);
        }
      }

      setStatus({ icon: '完成', message: '导出成功' });
      this._showToast('导出成功');
    } catch (e) {
      const msg = (e as Error).message === '导出已取消' ? '导出已取消' : ((e as Error).message || '导出失败');
      setStatus({ message: msg });
      if (msg !== '导出已取消') this._showToast(msg);
    } finally {
      this._abort = null;
      actions.innerHTML = '<button id="nle-export-start-btn" class="nle-export-start" type="button">开始导出</button>';
      actions.querySelector('#nle-export-start-btn')?.addEventListener('click', () => this._doExport(info));
    }
  }

  private async _fetchPosts(
    topicId: number,
    start: number,
    end: number,
    progress: (state: ExportStatus) => void,
    signal: AbortSignal,
  ): Promise<TopicPost[]> {
    const idData = await TopicHelpers.fetchJSON<{ post_ids?: number[] }>(
      `/t/${topicId}/post_ids.json?post_number=0&limit=99999`,
      signal,
    );
    const allIds = [...(idData.post_ids || [])];
    const topicData = await TopicHelpers.fetchJSON<any>(`/t/${topicId}.json`, signal);
    const firstId = Utils.toSafeInt(topicData?.post_stream?.posts?.[0]?.id, 0);
    if (firstId && !allIds.includes(firstId)) allIds.unshift(firstId);
    const ids = allIds.slice(start - 1, end);
    if (!ids.length) throw new Error('没有找到帖子内容');

    const posts: TopicPost[] = [];
    for (let i = 0; i < ids.length; i += 100) {
      if (signal.aborted) throw new Error('导出已取消');
      const batchIds = ids.slice(i, i + 100);
      progress({
        message: '正在获取帖子内容...',
        current: Math.min(i + batchIds.length, ids.length),
        total: ids.length,
        detail: `第 ${Math.floor(i / 100) + 1} 批`,
      });
      const query = batchIds.map(id => `post_ids[]=${encodeURIComponent(String(id))}`).join('&');
      const data = await TopicHelpers.fetchJSON<any>(`/t/${topicId}/posts.json?${query}&include_suggested=false`, signal);
      const batchPosts = data?.post_stream?.posts || [];

      for (const post of batchPosts) {
        const content = await this._processPostHtml(post.cooked || '', this._format !== 'md' && this._embedImages);
        const avatar = this._normalizeAvatarUrl(post.avatar_template);
        posts.push({
          postNumber: Utils.toSafeInt(post.post_number, 0),
          author: {
            username: Utils.sanitize(post.username || '', 80),
            name: Utils.sanitize(post.name || post.display_username || post.username || '', 120),
            avatarUrl: this._format !== 'md' && this._embedImages && avatar
              ? await this._imageToDataUrl(avatar)
              : avatar,
          },
          timestamp: post.created_at || post.updated_at || '',
          content,
          replyTo: post.reply_to_post_number
            ? {
                postNumber: Utils.toSafeInt(post.reply_to_post_number, 0),
                username: Utils.sanitize(post.reply_to_user?.username || '', 80),
              }
            : null,
          likeCount: Utils.toSafeInt((post.actions_summary || []).find((item: any) => item.id === 2)?.count, 0),
        });
      }
    }

    return posts.sort((a, b) => a.postNumber - b.postNumber);
  }

  private async _processPostHtml(html: string, embedImages: boolean): Promise<string> {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    wrapper.querySelectorAll('a.anchor, a[aria-hidden="true"].anchor').forEach(el => el.remove());

    // 移除 lightbox 包装器，只保留图片
    wrapper.querySelectorAll('.lightbox-wrapper').forEach(lightbox => {
      const img = lightbox.querySelector('img');
      if (img) {
        lightbox.replaceWith(img);
      } else {
        lightbox.remove();
      }
    });

    for (const link of wrapper.querySelectorAll<HTMLAnchorElement>('a[href]')) {
      const href = link.getAttribute('href') || '';
      if (!href || href.startsWith('#')) continue;
      link.setAttribute('href', this._normalizeUrl(href));
    }

    for (const img of wrapper.querySelectorAll<HTMLImageElement>('img[src]')) {
      const src = img.getAttribute('src') || '';
      const normalized = this._normalizeUrl(src);
      img.setAttribute('src', embedImages ? await this._imageToDataUrl(normalized) : normalized);
    }

    return wrapper.innerHTML;
  }

  private _normalizeAvatarUrl(template: string | undefined): string {
    if (!template) return '';
    return this._normalizeUrl(template.replace('{size}', '90'));
  }

  private _normalizeUrl(url: string): string {
    if (!url || /^(?:data:|blob:|mailto:|javascript:|tel:)/i.test(url)) return url || '';
    if (/^https?:\/\//i.test(url)) return url;
    if (url.startsWith('//')) return `${window.location.protocol}${url}`;
    try {
      return new URL(url, TopicHelpers.getOrigin()).toString();
    } catch {
      return url;
    }
  }

  private async _imageToDataUrl(url: string): Promise<string> {
    // 先检查缓存
    if (this._imageCache.has(url)) {
      return this._imageCache.get(url)!;
    }

    try {
      const resp = await fetch(url, { credentials: 'include' });
      if (!resp.ok) return url;
      const blob = await resp.blob();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(String(reader.result || url));
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // 缓存结果
      this._imageCache.set(url, dataUrl);
      return dataUrl;
    } catch {
      return url;
    }
  }

  private _formatDate(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('zh-CN');
  }

  private _genFilename(info: TopicInfo, ext: string): string {
    const now = new Date();
    const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const time = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    const title = info.title.replace(/[<>:"/\\|?*\x00-\x1F]/g, '').slice(0, 48) || 'topic';
    return `NLStatusPro_${info.id}_${title}_${date}_${time}.${ext}`;
  }

  private _genMarkdown(data: ExportData): string {
    const { topic, posts, exportDate, postCount, range } = data;
    const sourceUrl = `${TopicHelpers.getOrigin()}/t/topic/${topic.id}`;
    const lines: string[] = [
      `# ${this._oneLine(topic.title) || '未命名话题'}`,
      '',
      `> 话题 ID: ${topic.id}`,
      `> 导出时间: ${this._formatDate(exportDate)}`,
      `> 楼层范围: ${range.start}-${range.end}（共 ${postCount} 楼）`,
    ];

    if (topic.views) lines.push(`> 浏览量: ${Utils.formatNumber(topic.views)}`);
    if (topic.category) lines.push(`> 分类: ${this._oneLine(topic.category)}`);
    if (topic.tags.length) lines.push(`> 标签: ${topic.tags.map(tag => `\`${this._oneLine(tag)}\``).join(' ')}`);
    lines.push(`> 原文链接: ${sourceUrl}`, '', '---', '');

    posts.forEach((post, index) => {
      const username = this._oneLine(post.author.username);
      const name = this._oneLine(post.author.name || username);
      const author = name && username && name !== username ? `${name} (@${username})` : (username ? `@${username}` : name || '未知作者');
      const meta = [
        `> 时间: ${this._formatDate(post.timestamp)}`,
        post.replyTo ? `> 回复: #${post.replyTo.postNumber}${post.replyTo.username ? ` @${this._oneLine(post.replyTo.username)}` : ''}` : '',
        post.likeCount > 0 ? `> 点赞: ${post.likeCount}` : '',
        `> 链接: ${sourceUrl}/${post.postNumber}`,
      ].filter(Boolean);

      lines.push(`## #${post.postNumber} ${author}`, '', meta.join('\n'), '');
      lines.push(this._htmlToMarkdown(post.content) || '_（无内容）_');
      if (index !== posts.length - 1) lines.push('', '---', '');
    });

    return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
  }

  private _genHTML(data: ExportData): string {
    const { topic, posts, exportDate, postCount, range } = data;
    const sourceUrl = `${TopicHelpers.getOrigin()}/t/topic/${topic.id}`;
    const tagsHtml = [
      topic.category ? `<span class="topic-tag">${Utils.escapeHtml(topic.category)}</span>` : '',
      ...topic.tags.map(tag => `<span class="topic-tag">${Utils.escapeHtml(tag)}</span>`),
    ].filter(Boolean).join('');
    const postsHtml = posts.map(post => {
      const username = Utils.escapeHtml(post.author.username || 'unknown');
      const name = Utils.escapeHtml(post.author.name || post.author.username || '未知作者');
      const avatar = post.author.avatarUrl
        ? `<img class="avatar" src="${Utils.escapeHtml(post.author.avatarUrl)}" alt="${username}">`
        : '<div class="avatar"></div>';
      const reply = post.replyTo
        ? `<div class="reply-to">回复 <a href="${sourceUrl}/${post.replyTo.postNumber}">#${post.replyTo.postNumber}</a>${post.replyTo.username ? ` @${Utils.escapeHtml(post.replyTo.username)}` : ''}</div>`
        : '';
      const likes = post.likeCount > 0 ? `<div class="post-footer">点赞 ${post.likeCount}</div>` : '';
      return `
        <article class="post" id="post-${post.postNumber}">
          <header class="post-header">
            <div class="author">${avatar}<div><b>${name}</b><span>@${username}</span></div></div>
            <div class="post-meta"><span>${this._formatDate(post.timestamp)}</span><a href="${sourceUrl}/${post.postNumber}">#${post.postNumber}</a></div>
          </header>
          ${reply}
          <div class="post-content">${post.content}</div>
          ${likes}
        </article>
      `;
    }).join('');

    const css = `
      *{box-sizing:border-box}
      body{margin:0;background:#f4f6fb;color:#182033;font:14px/1.7 -apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif}
      a{color:#315ac8;text-decoration:none}
      .container{max-width:920px;margin:0 auto;padding:24px}
      .header{padding:22px 24px;border-radius:16px;background:linear-gradient(135deg,#315ac8,#4f8bf5);color:#fff;margin-bottom:18px}
      h1{font-size:24px;line-height:1.35;margin:0 0 10px}
      .meta{display:flex;gap:8px;flex-wrap:wrap;font-size:12px}
      .meta span,.topic-tag{display:inline-flex;padding:3px 9px;border-radius:999px;background:rgba(255,255,255,.18)}
      .tags{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}
      .post{background:#fff;border:1px solid #e5e9f2;border-radius:14px;padding:16px;margin:0 0 14px;break-inside:avoid}
      .post-header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-bottom:12px;margin-bottom:12px;border-bottom:1px solid #edf0f7}
      .author{display:flex;align-items:center;gap:10px;min-width:0}
      .author span{display:block;color:#697185;font-size:12px}
      .avatar{width:40px;height:40px;border-radius:50%;object-fit:cover;background:#dfe6f3;flex:none}
      .post-meta{display:flex;gap:8px;align-items:center;color:#697185;font-size:12px;flex-wrap:wrap;justify-content:flex-end}
      .reply-to{background:#f6f8fc;border-left:3px solid #4f8bf5;border-radius:0 8px 8px 0;padding:8px 10px;margin-bottom:12px;color:#4b5563}
      .post-content{overflow-wrap:anywhere}
      .post-content img{max-width:100%;height:auto;border-radius:8px}
      .post-content pre{background:#0f172a;color:#e2e8f0;border-radius:8px;padding:12px;overflow:auto}
      .post-content code{background:#eef2f7;border-radius:4px;padding:2px 5px}
      .post-content pre code{background:transparent;padding:0}
      .post-content blockquote,.post-content aside.quote{border-left:3px solid #4f8bf5;background:#f6f8fc;margin:12px 0;padding:10px 12px;color:#4b5563}
      .post-content table{width:100%;border-collapse:collapse;margin:10px 0}
      .post-content th,.post-content td{border:1px solid #e5e9f2;padding:6px 8px}
      .post-footer{margin-top:12px;padding-top:10px;border-top:1px solid #edf0f7;color:#d33}
      .footer{text-align:center;color:#697185;font-size:12px;padding:14px 0}
      @media print{body{background:#fff}.container{padding:0}.header{border-radius:0}.post{box-shadow:none;border-radius:8px;break-inside:auto}.post-header,.reply-to,.post-footer{break-inside:avoid}.post-content img{break-inside:avoid;max-height:180mm}}
    `;

    return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${Utils.escapeHtml(topic.title)} - NLStatusPro 导出</title>
  <style>${css}</style>
</head>
<body>
  <main class="container">
    <section class="header">
      <h1>${Utils.escapeHtml(topic.title)}</h1>
      <div class="meta">
        <span>话题 #${topic.id}</span>
        <span>${postCount} 楼 (${range.start}-${range.end})</span>
        ${topic.views ? `<span>${Utils.formatNumber(topic.views)} 浏览</span>` : ''}
        <span>${this._formatDate(exportDate)}</span>
      </div>
      ${tagsHtml ? `<div class="tags">${tagsHtml}</div>` : ''}
    </section>
    ${postsHtml}
    <div class="footer">由 NLStatusPro 导出 | 来源：<a href="${sourceUrl}">${sourceUrl}</a></div>
  </main>
</body>
</html>`;
  }

  private _htmlToMarkdown(html: string): string {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    wrapper.querySelectorAll('a.anchor, a[aria-hidden="true"].anchor').forEach(el => el.remove());
    return this._childrenToMarkdown(wrapper).replace(/\u00a0/g, ' ').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  }

  private _nodeToMarkdown(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) return node.nodeValue || '';
    if (node.nodeType !== Node.ELEMENT_NODE) return '';
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    if (tag === 'script' || tag === 'style') return '';

    switch (tag) {
      case 'br':
        return '\n';
      case 'p':
        return `${this._childrenToMarkdown(el).trim()}\n\n`;
      case 'strong':
      case 'b':
        return `**${this._childrenToMarkdown(el)}**`;
      case 'em':
      case 'i':
        return `*${this._childrenToMarkdown(el)}*`;
      case 'code':
        return el.closest('pre') ? (el.textContent || '') : `\`${(el.textContent || '').replace(/`/g, '\\`')}\``;
      case 'pre': {
        const codeEl = el.querySelector('code');
        const code = (codeEl?.textContent || el.textContent || '').replace(/\n$/, '');
        const className = codeEl?.className || el.className || '';
        const lang = className.match(/language-([\w-]+)/i)?.[1] || '';
        const fence = code.includes('```') ? '````' : '```';
        return `\n\n${fence}${lang}\n${code}\n${fence}\n\n`;
      }
      case 'a': {
        const href = el.getAttribute('href') || '';
        const text = this._inlineMarkdown(el) || href;
        if (!href || href.startsWith('#') || el.classList.contains('anchor')) return text;
        return `[${text}](${this._normalizeUrl(href)})`;
      }
      case 'img': {
        const src = el.getAttribute('src') || '';
        const alt = this._oneLine(el.getAttribute('alt') || '');
        return src ? `![${alt}](${this._normalizeUrl(src)})` : '';
      }
      case 'ul':
      case 'ol':
        return this._listToMarkdown(el, tag === 'ol');
      case 'blockquote':
      case 'aside': {
        const contentEl = tag === 'aside' && el.classList.contains('quote')
          ? (el.querySelector('blockquote') || el)
          : el;
        const content = this._childrenToMarkdown(contentEl).trim();
        return content ? content.split('\n').map(line => line ? `> ${line}` : '>').join('\n') + '\n\n' : '';
      }
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6': {
        const level = Number(tag.slice(1));
        const text = this._childrenToMarkdown(el).trim();
        return text ? `${'#'.repeat(level)} ${text}\n\n` : '';
      }
      case 'hr':
        return '\n\n---\n\n';
      case 'table':
        return `${this._tableToMarkdown(el)}\n\n`;
      default:
        return this._childrenToMarkdown(el);
    }
  }

  private _childrenToMarkdown(node: Node): string {
    return Array.from(node.childNodes).map(child => this._nodeToMarkdown(child)).join('');
  }

  private _inlineMarkdown(node: Node): string {
    return this._childrenToMarkdown(node).replace(/\n+/g, ' ').trim();
  }

  private _listToMarkdown(listEl: HTMLElement, ordered: boolean): string {
    const items = Array.from(listEl.children).filter(el => el.tagName.toLowerCase() === 'li');
    const lines = items.map((item, index) => {
      const content = this._childrenToMarkdown(item).trim();
      if (!content) return '';
      const prefix = ordered ? `${index + 1}. ` : '- ';
      const [first, ...rest] = content.split('\n');
      const tail = rest.map(line => line ? `  ${line}` : '').join('\n');
      return `${prefix}${first}${tail ? `\n${tail}` : ''}`;
    }).filter(Boolean);
    return lines.join('\n') + '\n\n';
  }

  private _tableToMarkdown(tableEl: HTMLElement): string {
    const rows = Array.from(tableEl.querySelectorAll('tr'));
    if (!rows.length) return '';
    const getCells = (row: HTMLTableRowElement) => Array.from(row.children).filter(cell => /^(th|td)$/i.test(cell.tagName));
    const headerCells = getCells(rows[0]);
    const header = headerCells.map(cell => this._escapeTableCell(this._inlineMarkdown(cell)));
    const bodyRows = headerCells.some(cell => cell.tagName.toLowerCase() === 'th') ? rows.slice(1) : rows;
    const lines = [
      `| ${header.join(' | ')} |`,
      `| ${header.map(() => '---').join(' | ')} |`,
      ...bodyRows.map(row => {
        const cells = getCells(row).map(cell => this._escapeTableCell(this._inlineMarkdown(cell)));
        const padded = [...cells, ...Array(Math.max(0, header.length - cells.length)).fill('')].slice(0, header.length);
        return `| ${padded.join(' | ')} |`;
      }),
    ];
    return lines.join('\n');
  }

  private _escapeTableCell(text: string): string {
    return this._oneLine(text).replace(/\|/g, '\\|');
  }

  private _oneLine(value: string): string {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  private _download(content: string, filename: string, type: string): void {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  private _printPDF(html: string): void {
    const win = window.open('', '_blank');
    if (!win) throw new Error('无法打开打印窗口，请检查弹窗拦截设置');
    win.document.open();
    win.document.write(html);
    win.document.close();

    const waitForImages = async () => {
      const images = Array.from(win.document.images || []);
      await Promise.all(images.map(img => img.complete
        ? Promise.resolve()
        : new Promise<void>(resolve => {
            img.addEventListener('load', () => resolve(), { once: true });
            img.addEventListener('error', () => resolve(), { once: true });
            setTimeout(resolve, 2500);
          })));
    };

    const print = () => {
      void waitForImages().finally(() => {
        try { win.focus(); } catch { /* ignore */ }
        setTimeout(() => {
          try { win.print(); } catch { /* ignore */ }
        }, 300);
      });
    };

    if (win.document.fonts?.ready) win.document.fonts.ready.finally(print);
    else win.onload = print;
  }
}
