import { CONFIG } from '../config';
import { CURRENT_SITE } from '../site';
import { Network } from '../utils/network';

export interface LeaderboardUser {
  username: string;
  name?: string;
  avatar_template?: string;
  total_score: number;
  position: number;
}

export interface LeaderboardData {
  personal: LeaderboardUser | null;
  users: LeaderboardUser[];
}

export class LeaderboardFetcher {
  constructor(private _network: Network) {}

  async fetchEnergyLeaderboard(): Promise<LeaderboardData> {
    if (!CURRENT_SITE) return { personal: null, users: [] };
    try {
      const url = `${CURRENT_SITE.origin}/leaderboard/2.json`;
      const data = await this._network.fetchJSON<any>(url, { cacheTtl: CONFIG.CACHE.LEADERBOARD_TTL });
      return {
        personal: data?.personal?.user || data?.personal || null,
        users: (data?.users || []).slice(0, 50),
      };
    } catch {
      return { personal: null, users: [] };
    }
  }

  async fetchPostingLeaderboard(): Promise<LeaderboardData> {
    if (!CURRENT_SITE) return { personal: null, users: [] };
    try {
      const url = `${CURRENT_SITE.origin}/leaderboard/3.json`;
      const data = await this._network.fetchJSON<any>(url, { cacheTtl: CONFIG.CACHE.LEADERBOARD_TTL });
      return {
        personal: data?.personal?.user || data?.personal || null,
        users: (data?.users || []).slice(0, 50),
      };
    } catch {
      return { personal: null, users: [] };
    }
  }
}
