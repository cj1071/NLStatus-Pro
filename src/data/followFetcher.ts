import { CURRENT_SITE } from '../site';
import { Network } from '../utils/network';

export interface FollowUser {
  username: string;
  name?: string;
  avatar_template?: string;
}

export class FollowFetcher {
  constructor(private _network: Network) {}

  async fetchFollowing(username: string): Promise<FollowUser[]> {
    if (!CURRENT_SITE) return [];
    try {
      const url = `${CURRENT_SITE.origin}/u/${encodeURIComponent(username)}/follow/following`;
      const data = await this._network.fetchJSON<any>(url);
      return data?.users || [];
    } catch { return []; }
  }

  async fetchFollowers(username: string): Promise<FollowUser[]> {
    if (!CURRENT_SITE) return [];
    try {
      const url = `${CURRENT_SITE.origin}/u/${encodeURIComponent(username)}/follow/followers`;
      const data = await this._network.fetchJSON<any>(url);
      return data?.users || [];
    } catch { return []; }
  }
}
