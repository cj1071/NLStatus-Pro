import { CURRENT_SITE } from '../site';
import { Utils } from './helpers';
import { Network } from './network';

/**
 * 话题相关工具函数
 * 用于提取话题 ID、获取站点信息、发起 API 请求
 */
export const TopicHelpers = {
  /**
   * 从当前 URL 中提取话题 ID
   * 支持格式：/t/topic/123, /t/slug/123, /t/123
   */
  getTopicId(): number | null {
    const path = window.location.pathname;
    const match = path.match(/^\/t\/topic\/(\d+)(?:\/|$)/)
      || path.match(/^\/t\/[^/]+\/(\d+)(?:\/|$)/)
      || path.match(/^\/t\/(\d+)(?:\/|$)/);
    const id = Utils.toSafeInt(match?.[1] || '', 0);
    return id > 0 ? id : null;
  },

  /**
   * 获取当前站点的 origin
   */
  getOrigin(): string {
    return CURRENT_SITE?.origin || window.location.origin;
  },

  /**
   * 使用认证头从 Discourse API 获取 JSON
   * @param path API 路径（可以是相对路径或完整 URL）
   * @param signal 可选的 AbortSignal 用于取消请求
   */
  async fetchJSON<T>(path: string, signal?: AbortSignal): Promise<T> {
    const url = path.startsWith('http') ? path : `${TopicHelpers.getOrigin()}${path}`;
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
  },
};
