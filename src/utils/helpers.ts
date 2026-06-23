import { CONFIG } from '../config';

const _htmlEntities: Record<string, string> = {
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;',
};

export const Utils = {
  escapeHtml(str: string): string {
    if (!str) return '';
    return str.replace(/[&<>"']/g, c => _htmlEntities[c] || c);
  },

  sanitize(str: string, maxLen = 100): string {
    if (!str) return '';
    return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').substring(0, maxLen).trim();
  },

  toSafeNumber(val: unknown, defaultVal = 0): number {
    const num = Number(val);
    return Number.isFinite(num) ? num : defaultVal;
  },

  toSafeInt(val: unknown, defaultVal = 0): number {
    const num = parseInt(String(val), 10);
    return Number.isFinite(num) ? num : defaultVal;
  },

  getTodayKey(): string { return new Date().toDateString(); },

  formatDate(ts: number, format: 'short' | 'full' = 'short'): string {
    const d = new Date(ts);
    const m = d.getMonth() + 1;
    const day = d.getDate();
    if (format === 'short') return `${m}/${day}`;
    return `${m}月${day}日`;
  },

  formatReadingTime(minutes: number): string {
    if (minutes < 1) return '< 1分钟';
    if (minutes < 60) return `${Math.round(minutes)}分钟`;
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return m > 0 ? `${h}小时${m}分` : `${h}小时`;
  },

  getReadingLevel(minutes: number) {
    const levels = CONFIG.READING_LEVELS;
    for (let i = levels.length - 1; i >= 0; i--) {
      if (minutes >= levels[i].min) return levels[i];
    }
    return levels[0];
  },

  getHeatmapLevel(minutes: number): number {
    if (minutes < 1) return 0;
    if (minutes < 60) return 1;
    if (minutes < 180) return 2;
    if (minutes < 300) return 3;
    return 4;
  },

  throttle<T extends (...args: unknown[]) => void>(fn: T, limit: number): T {
    let lastTime = 0;
    return function (this: unknown, ...args: unknown[]) {
      const now = Date.now();
      if (now - lastTime >= limit) { lastTime = now; fn.apply(this, args); }
    } as T;
  },

  debounce<T extends (...args: unknown[]) => void>(fn: T, wait: number): T & { cancel: () => void } {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const debounced = function (this: unknown, ...args: unknown[]) {
      if (timer !== null) clearTimeout(timer);
      timer = setTimeout(() => { timer = null; fn.apply(this, args); }, wait);
    } as T & { cancel: () => void };
    debounced.cancel = () => { if (timer !== null) { clearTimeout(timer); timer = null; } };
    return debounced;
  },

  safeCall<T>(fn: () => T, fallback: T): T {
    try { return fn(); } catch { return fallback; }
  },

  formatRelativeTime(utcStr: string): string {
    if (!utcStr) return '';
    const d = new Date(utcStr);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / 1000;
    if (diff < 60) return '刚刚';
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)}天前`;
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  },

  formatNumber(n: number): string {
    if (!Number.isFinite(n)) return '--';
    return n.toLocaleString('zh-CN');
  },

  daysSince(utcStr: string): number {
    if (!utcStr) return 0;
    const d = new Date(utcStr);
    if (Number.isNaN(d.getTime())) return 0;
    return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000));
  },

  buildLetterAvatar(seed: string, size = 40): string {
    const text = Utils.sanitize(String(seed || ''), 100) || '?';
    const char = (Array.from(text)[0] || '?').toUpperCase();
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash) + text.charCodeAt(i); hash |= 0;
    }
    const hue = Math.abs(hash) % 360;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100"><rect width="100" height="100" rx="50" fill="hsl(${hue} 55% 50%)"/><text x="50" y="50" dy="0.02em" text-anchor="middle" dominant-baseline="middle" font-size="46" font-weight="700" fill="#fff">${char}</text></svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  },

  formatError(e: unknown): string {
    if (e instanceof Error) return e.message;
    return '未知错误';
  },

  formatErrorWithIcon(e: unknown): string {
    const msg = Utils.formatError(e);
    if (msg.includes('登录')) return '🔒 ' + msg;
    if (msg.includes('频繁')) return '⏳ ' + msg;
    if (msg.includes('超时')) return '⏰ ' + msg;
    return '⚠️ ' + msg;
  },
};
