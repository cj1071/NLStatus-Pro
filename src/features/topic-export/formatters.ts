/**
 * 导出格式转换模块
 */

import type { ExportData, TopicInfo } from './types';
import { Network } from '../../utils/network';
import { Utils } from '../../utils/helpers';

export class ExportFormatter {
  toMarkdown(data: ExportData): string {
    const { topic, posts, exportDate, postCount, range } = data;
    const sourceUrl = `${Network.getOrigin()}/t/topic/${topic.id}`;
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

  toHTML(data: ExportData): string {
    const { topic, posts, exportDate, postCount, range } = data;
    const sourceUrl = `${Network.getOrigin()}/t/topic/${topic.id}`;
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

  toPDF(html: string): void {
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

  download(content: string, filename: string, type: string): void {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  generateFilename(info: TopicInfo, ext: string): string {
    const now = new Date();
    const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const time = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    const title = info.title.replace(/[<>:"/\\|?*\x00-\x1F]/g, '').slice(0, 48) || 'topic';
    return `NLStatusPro_${info.id}_${title}_${date}_${time}.${ext}`;
  }

  private _formatDate(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('zh-CN');
  }

  private _htmlToMarkdown(html: string): string {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    wrapper.querySelectorAll('a.anchor, a[aria-hidden="true"].anchor').forEach(el => el.remove());
    return this._childrenToMarkdown(wrapper).replace(/ /g, ' ').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
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
        return `[${text}](${href})`;
      }
      case 'img': {
        const src = el.getAttribute('src') || '';
        const alt = this._oneLine(el.getAttribute('alt') || '');
        return src ? `![${alt}](${src})` : '';
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
}
