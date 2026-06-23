/**
 * Markdown 渲染器
 */

import { Utils } from '../../utils/helpers';

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

export function renderMarkdown(md: string): string {
  if (!md) return '';

  const codeBlocks: string[] = [];
  const inlineCodes: string[] = [];
  let html = md.replace(/\r\n/g, '\n');

  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, lang, code) => {
    const placeholder = `NLECB${codeBlocks.length}`;
    const language = Utils.escapeHtml(String(lang || '').trim());
    codeBlocks.push(
      `<pre class="nle-ai-md-codeblock"${language ? ` data-lang="${language}"` : ''}><code>${Utils.escapeHtml(String(code).trim())}</code></pre>`,
    );
    return placeholder;
  });

  html = html.replace(/`([^`\n]+)`/g, (_match, code) => {
    const placeholder = `NLEIC${inlineCodes.length}`;
    inlineCodes.push(`<code class="nle-ai-md-inline-code">${Utils.escapeHtml(String(code))}</code>`);
    return placeholder;
  });

  html = Utils.escapeHtml(html);
  html = renderMarkdownBlocks(html);

  codeBlocks.forEach((block, i) => {
    html = html.split(`NLECB${i}`).join(block);
  });
  inlineCodes.forEach((code, i) => {
    html = html.split(`NLEIC${i}`).join(code);
  });

  return `<div class="nle-ai-markdown">${html}</div>`;
}

function renderMarkdownBlocks(html: string): string {
  const blocks: string[] = [];
  const paragraph: string[] = [];
  const rootLists: MarkdownListNode[] = [];
  const listStack: MarkdownListNode[] = [];
  let listHadBlankLine = false;

  const renderInline = (text: string) => renderMarkdownInline(text.trim());
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

function renderMarkdownInline(text: string): string {
  let html = text;
  html = html.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__([^_]+?)__/g, '<strong>$1</strong>');
  html = html.replace(/(^|[^\*])\*([^*\n]+?)\*(?!\*)/g, '$1<em>$2</em>');
  html = html.replace(/(^|[^_])_([^_\n]+?)_(?!_)/g, '$1<em>$2</em>');
  html = html.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="nle-ai-md-link">$1</a>');
  return html;
}
