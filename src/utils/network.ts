import { CONFIG } from '../config';
import { CURRENT_SITE } from '../site';
import { Utils } from './helpers';

interface QueueItem {
  requestFn: () => Promise<unknown>;
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
}

interface FetchOptions {
  timeout?: number;
  headers?: Record<string, string>;
  cacheTtl?: number;
}

export class Network {
  private _apiCache = new Map<string, unknown>();
  private _apiCacheTime = new Map<string, number>();

  private static _requestQueue: QueueItem[] = [];
  private static _isProcessing = false;
  private static _lastRequestTime = 0;
  private static _rateLimitedAt = 0;

  static queueRequest(requestFn: () => Promise<unknown>): Promise<unknown> {
    return new Promise((resolve, reject) => {
      Network._requestQueue.push({ requestFn, resolve, reject });
      Network._processQueue();
    });
  }

  private static async _processQueue(): Promise<void> {
    if (Network._isProcessing || Network._requestQueue.length === 0) return;
    Network._isProcessing = true;
    while (Network._requestQueue.length > 0) {
      const { requestFn, resolve, reject } = Network._requestQueue.shift()!;
      const elapsed = Date.now() - Network._lastRequestTime;
      if (elapsed < CONFIG.NETWORK.MIN_REQUEST_INTERVAL) {
        await new Promise(r => setTimeout(r, CONFIG.NETWORK.MIN_REQUEST_INTERVAL - elapsed));
      }
      Network._lastRequestTime = Date.now();
      try { resolve(await requestFn()); } catch (e) { reject(e as Error); }
    }
    Network._isProcessing = false;
  }

  static isRateLimited(): boolean {
    if (!Network._rateLimitedAt) return false;
    if (Date.now() - Network._rateLimitedAt >= 120000) { Network._rateLimitedAt = 0; return false; }
    return true;
  }

  static recordRateLimit(): void { Network._rateLimitedAt = Date.now(); }

  static buildAuthHeaders(url: string): Record<string, string> {
    const headers: Record<string, string> = {};
    try {
      const u = new URL(url, location.href);
      if (u.hostname.includes('nodeloc')) {
        headers['X-Requested-With'] = 'XMLHttpRequest';
        headers['Discourse-Logged-In'] = 'true';
        headers['Discourse-Present'] = 'true';
        const csrf = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content;
        if (csrf) headers['X-CSRF-Token'] = csrf;
      }
    } catch { /* ignore */ }
    return headers;
  }

  async fetchJSON<T = unknown>(url: string, options: FetchOptions = {}): Promise<T> {
    const { timeout = CONFIG.NETWORK.TIMEOUT, headers: extraHeaders = {}, cacheTtl = 0 } = options;
    const cacheKey = `${url}`;

    if (cacheTtl > 0 && this._apiCache.has(cacheKey)) {
      if (Date.now() - (this._apiCacheTime.get(cacheKey) || 0) < cacheTtl) {
        return this._apiCache.get(cacheKey) as T;
      }
    }

    if (Network.isRateLimited()) {
      throw new Error('请求过于频繁，请稍后重试');
    }

    return Network.queueRequest(async () => {
      const headers: Record<string, string> = {
        'Accept': 'application/json',
        ...Network.buildAuthHeaders(url),
        ...extraHeaders,
      };

      if (!CURRENT_SITE) throw new Error('站点未识别');

      try {
        const controller = new AbortController();
        const t = setTimeout(() => controller.abort(), timeout);
        const resp = await fetch(url, {
          headers,
          credentials: 'include',
          signal: controller.signal,
        });
        clearTimeout(t);

        if (resp.status === 429) { Network.recordRateLimit(); throw new Error('请求过于频繁'); }
        if (resp.status === 403) throw new Error('需要登录后查看');
        if (!resp.ok) throw new Error(`请求失败 (${resp.status})`);

        const data = await resp.json() as T;
        if (cacheTtl > 0) {
          this._apiCache.set(cacheKey, data);
          this._apiCacheTime.set(cacheKey, Date.now());
        }
        return data;
      } catch (e: unknown) {
        if (e instanceof DOMException && e.name === 'AbortError') throw new Error('请求超时');
        throw e;
      }
    }) as Promise<T>;
  }

  clearCache(): void { this._apiCache.clear(); this._apiCacheTime.clear(); }

  /**
   * 从当前 URL 中提取话题 ID
   * 支持格式：/t/topic/123, /t/slug/123, /t/123
   */
  static getTopicId(): number | null {
    const path = window.location.pathname;
    const match = path.match(/^\/t\/topic\/(\d+)(?:\/|$)/)
      || path.match(/^\/t\/[^/]+\/(\d+)(?:\/|$)/)
      || path.match(/^\/t\/(\d+)(?:\/|$)/);
    const id = Utils.toSafeInt(match?.[1] || '', 0);
    return id > 0 ? id : null;
  }

  /**
   * 获取当前站点的 origin
   */
  static getOrigin(): string {
    return CURRENT_SITE?.origin || window.location.origin;
  }

  /**
   * 简化的 fetch 方法，不使用请求队列和缓存
   * 适用于需要直接控制请求的场景（如 aiTopicSummary 和 topicExporter）
   * @param path API 路径（可以是相对路径或完整 URL）
   * @param signal 可选的 AbortSignal 用于取消请求
   */
  static async fetchJSONDirect<T>(path: string, signal?: AbortSignal): Promise<T> {
    const url = path.startsWith('http') ? path : `${Network.getOrigin()}${path}`;
    const resp = await fetch(url, {
      credentials: 'include',
      signal,
      headers: {
        'Accept': 'application/json',
        ...Network.buildAuthHeaders(url),
      },
    });
    if (resp.status === 429) throw new Error('请求过于频繁，请稍后重试');
    if (resp.status === 403) throw new Error('需要登录后查看');
    if (!resp.ok) throw new Error(`请求失败 (${resp.status})`);
    return resp.json() as Promise<T>;
  }
}
