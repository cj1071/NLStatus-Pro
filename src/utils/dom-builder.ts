/**
 * DOM 构建辅助函数 - 零依赖、类型安全的 HTML 生成
 */

type Attrs = Record<string, string | number | boolean | null | undefined>;
type Child = string | number | HTMLElement | null | undefined;

/**
 * 创建 DOM 元素（类型安全）
 */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs?: Attrs | null,
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);

  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      if (value == null) continue;
      if (key === 'class' || key === 'className') {
        element.className = String(value);
      } else if (key.startsWith('on') && typeof value === 'function') {
        const event = key.slice(2).toLowerCase();
        element.addEventListener(event, value as EventListener);
      } else if (key === 'style' && typeof value === 'object') {
        Object.assign(element.style, value);
      } else {
        element.setAttribute(key, String(value));
      }
    }
  }

  for (const child of children) {
    if (child == null) continue;
    if (typeof child === 'string' || typeof child === 'number') {
      element.appendChild(document.createTextNode(String(child)));
    } else {
      element.appendChild(child);
    }
  }

  return element;
}

/**
 * 快捷方法：常用标签
 */
export const div = (...args: [Attrs?, ...Child[]]) => el('div', ...args);
export const span = (...args: [Attrs?, ...Child[]]) => el('span', ...args);
export const button = (...args: [Attrs?, ...Child[]]) => el('button', ...args);
export const input = (attrs?: Attrs) => el('input', attrs);

/**
 * 从 HTML 字符串创建元素（用于复杂模板）
 */
export function html<T extends HTMLElement = HTMLElement>(template: string): T {
  const div = document.createElement('div');
  div.innerHTML = template.trim();
  return div.firstElementChild as T;
}

/**
 * 批量添加子元素
 */
export function append(parent: HTMLElement, ...children: (HTMLElement | null | undefined)[]): void {
  for (const child of children) {
    if (child) parent.appendChild(child);
  }
}

/**
 * 替换元素内容
 */
export function replace(parent: HTMLElement, ...children: (HTMLElement | null | undefined)[]): void {
  parent.innerHTML = '';
  append(parent, ...children);
}
