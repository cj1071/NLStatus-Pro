import { CONFIG, PATTERNS } from '../config';
import { CURRENT_SITE } from '../site';
import { Network } from '../utils/network';
import { Utils } from '../utils/helpers';

export interface UserStats {
  topics_entered: number;
  posts_read_count: number;
  days_visited: number;
  time_read: number;
  likes_given: number;
  likes_received: number;
  topic_count: number;
  post_count: number;
  recent_time_read: number;
}

export interface UserProfile {
  trust_level: number;
  gamification_score: number;
  avatar: string;
  title: string;
  name: string;
  username: string;
}

export interface RequirementItem {
  key: string;
  name: string;
  current: number;
  required: number;
  isSuccess: boolean;
  progress: number;
}

const labelMap: Record<string, string> = {
  topics_entered: '浏览话题',
  posts_read_count: '阅读帖子',
  time_read: '阅读时长',
  days_visited: '访问天数',
  post_count: '回复帖子',
  topic_count: '回复话题',
  likes_given: '送出点赞',
  likes_received: '收到点赞',
};

export class TrustLevelParser {
  constructor(private _network: Network) {}

  async fetchCurrentStats(username: string): Promise<UserStats | null> {
    if (!CURRENT_SITE) return null;
    try {
      const url = `${CURRENT_SITE.origin}/u/${encodeURIComponent(username)}/summary.json`;
      const data = await this._network.fetchJSON<any>(url, { cacheTtl: 300000 });
      const summary = data?.user_summary;
      if (!summary) throw new Error('无法获取用户统计');
      return {
        topics_entered: Utils.toSafeInt(summary.topics_entered),
        posts_read_count: Utils.toSafeInt(summary.posts_read_count),
        days_visited: Utils.toSafeInt(summary.days_visited),
        time_read: Utils.toSafeInt(summary.time_read),
        likes_given: Utils.toSafeInt(summary.likes_given),
        likes_received: Utils.toSafeInt(summary.likes_received),
        topic_count: Utils.toSafeInt(summary.topic_count),
        post_count: Utils.toSafeInt(summary.post_count),
        recent_time_read: Utils.toSafeInt(summary.recent_time_read),
      };
    } catch (e) {
      console.warn('[NLE] Failed to fetch summary stats:', (e as Error).message);
      return null;
    }
  }

  async fetchUserProfile(username: string): Promise<UserProfile | null> {
    if (!CURRENT_SITE) return null;
    try {
      const url = `${CURRENT_SITE.origin}/u/${encodeURIComponent(username)}.json`;
      const data = await this._network.fetchJSON<any>(url, { cacheTtl: 300000 });
      const user = data?.user;
      if (!user) throw new Error('无法获取用户信息');
      return {
        trust_level: Utils.toSafeInt(user.trust_level),
        gamification_score: Utils.toSafeInt(user.gamification_score),
        avatar: user.avatar_template?.replace(PATTERNS.AVATAR_SIZE, '/120/') || '',
        title: user.title || '',
        name: user.name || '',
        username: user.username || username,
      };
    } catch (e) {
      console.warn('[NLE] Failed to fetch user profile:', (e as Error).message);
      return null;
    }
  }

  getRequirements(currentLevel: number): Record<string, number> | null {
    if (currentLevel >= 4) return null;
    return CONFIG.TRUST_LEVEL_REQUIREMENTS[currentLevel + 1] || null;
  }

  buildRequirementItems(currentStats: UserStats | null, currentLevel: number): RequirementItem[] {
    const reqs = this.getRequirements(currentLevel);
    if (!reqs) return [];
    if (!currentStats) return [];

    return Object.entries(reqs).map(([key, required]) => {
      const current = (currentStats as any)[key] || 0;
      let display = current;
      if (key === 'time_read') display = Math.floor(current / 60);
      const requirementDisplay = key === 'time_read' ? Math.floor(required / 60) : required;
      return {
        key,
        name: labelMap[key] || key,
        current: display,
        required: requirementDisplay,
        isSuccess: current >= required,
        progress: Math.min(1, required > 0 ? current / required : 0),
      };
    });
  }

  getCompletionPercent(items: RequirementItem[]): number {
    if (!items.length) return 100;
    const done = items.filter(i => i.isSuccess).length;
    return Math.round((done / items.length) * 100);
  }
}
