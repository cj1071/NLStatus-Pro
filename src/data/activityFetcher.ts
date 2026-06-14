import { CURRENT_SITE } from '../site';
import { Network } from '../utils/network';

export interface ActivityItem {
  topic_id?: number;
  title?: string;
  excerpt?: string;
  topic_title?: string;
  created_at?: string;
  updated_at?: string;
  action_type?: number;
  notification_type?: number;
}

export class ActivityFetcher {
  constructor(private _network: Network) {}

  async fetchBookmarks(username: string, page = 0): Promise<{ bookmarks: any[]; more: boolean }> {
    if (!CURRENT_SITE) return { bookmarks: [], more: false };
    try {
      const url = `${CURRENT_SITE.origin}/u/${encodeURIComponent(username)}/bookmarks.json?page=${page}`;
      const data = await this._network.fetchJSON<any>(url);
      return {
        bookmarks: data?.user_bookmark_list?.bookmarks || [],
        more: data?.user_bookmark_list?.more_bookmarks_url != null,
      };
    } catch { return { bookmarks: [], more: false }; }
  }

  async fetchNotifications(_username: string): Promise<any[]> {
    if (!CURRENT_SITE) return [];
    try {
      const url = `${CURRENT_SITE.origin}/notifications.json?recent=true&limit=30`;
      const data = await this._network.fetchJSON<any>(url);
      return data?.notifications || [];
    } catch { return []; }
  }

  async fetchActivity(username: string, offset = 0): Promise<{ actions: any[]; more: boolean }> {
    if (!CURRENT_SITE) return { actions: [], more: false };
    try {
      const url = `${CURRENT_SITE.origin}/u/${encodeURIComponent(username)}/activity.json?offset=${offset}&limit=30`;
      const data = await this._network.fetchJSON<any>(url);
      return {
        actions: data?.user_actions || [],
        more: (data?.user_actions || []).length >= 30,
      };
    } catch { return { actions: [], more: false }; }
  }
}
