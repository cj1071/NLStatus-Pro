import { CONFIG, PATTERNS } from '../config';
import { CURRENT_SITE } from '../site';
import { Network } from '../utils/network';
import { Utils } from '../utils/helpers';
import type { TrustRequirementDefinition } from '../config';

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
  not_silenced: number;
  not_suspended: number;
}

export interface UserProfile {
  trust_level: number;
  gamification_score: number;
  avatar: string;
  title: string;
  name: string;
  username: string;
  next_level_name?: string;
  upgrade_message?: string;
  leader_upgrade_needed?: boolean;
  max_level_reached?: boolean;
}

export interface RequirementItem {
  key: string;
  name: string;
  current: number;
  required: number | null;
  isSuccess: boolean;
  progress: number;
  unit?: string;
  note?: string;
  isInfo?: boolean;
  countsTowardProgress: boolean;
}

export interface UpgradeProgress {
  met_conditions: string[];
  unmet_conditions: string[];
  next_level_name?: string;
  max_level_reached: boolean;
  leader_upgrade_needed: boolean;
  message?: string;
}

const labelMap: Record<string, string> = {
  not_silenced: '未被禁言',
  not_suspended: '未被封禁',
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

  private _parseNumber(value: string): number {
    const num = Number(value.replace(/,/g, ''));
    return Number.isFinite(num) ? num : 0;
  }

  private _conditionText(condition: unknown): string {
    if (typeof condition === 'string') {
      return Utils.sanitize(condition.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' '), 180);
    }
    if (condition && typeof condition === 'object') {
      const obj = condition as Record<string, unknown>;
      const val = obj.text || obj.name || obj.title || obj.label || obj.message;
      if (typeof val === 'string') return this._conditionText(val);
    }
    return '';
  }

  private _buildOfficialCondition(condition: string, isSuccess: boolean, index: number): RequirementItem {
    const match = condition.match(/^(.+?)[：:]\s*([\d,.]+)\s*\/\s*([\d,.]+)\s*$/);
    if (match) {
      const current = this._parseNumber(match[2]);
      const required = this._parseNumber(match[3]);
      return {
        key: `official_${isSuccess ? 'met' : 'unmet'}_${index}`,
        name: Utils.sanitize(match[1].trim(), 120),
        current,
        required,
        isSuccess,
        progress: required > 0 ? Math.min(1, current / required) : (isSuccess ? 1 : 0),
        countsTowardProgress: true,
      };
    }

    return {
      key: `official_${isSuccess ? 'met' : 'unmet'}_${index}`,
      name: condition,
      current: isSuccess ? 1 : 0,
      required: null,
      isSuccess,
      progress: isSuccess ? 1 : 0,
      countsTowardProgress: true,
    };
  }

  private _conditionList(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value
      .map((condition) => this._conditionText(condition))
      .filter((condition) => condition.length > 0);
  }

  private _isRestricted(user: Record<string, unknown>, keys: string[]): boolean {
    return keys.some((key) => {
      const val = user[key];
      if (typeof val === 'boolean') return val;
      if (typeof val === 'number') return val > 0;
      if (typeof val === 'string') return val.length > 0;
      return val != null;
    });
  }

  async fetchCurrentStats(username: string): Promise<UserStats | null> {
    if (!CURRENT_SITE) return null;
    try {
      const [summaryData, profileData] = await Promise.all([
        this._network.fetchJSON<any>(`${CURRENT_SITE.origin}/u/${encodeURIComponent(username)}/summary.json`, { cacheTtl: 300000 }),
        this._network.fetchJSON<any>(`${CURRENT_SITE.origin}/u/${encodeURIComponent(username)}.json`, { cacheTtl: 300000 }),
      ]);
      const summary = summaryData?.user_summary;
      if (!summary) throw new Error('无法获取用户统计');
      const user = profileData?.user || {};
      const isSilenced = this._isRestricted(user, ['silenced', 'silenced_till', 'silence_reason']);
      const isSuspended = this._isRestricted(user, ['suspended', 'suspended_till', 'suspended_at', 'suspend_reason']);
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
        not_silenced: isSilenced ? 0 : 1,
        not_suspended: isSuspended ? 0 : 1,
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

  async fetchUpgradeProgress(username: string): Promise<UpgradeProgress | null> {
    if (!CURRENT_SITE) return null;
    try {
      const url = `${CURRENT_SITE.origin}/u/${encodeURIComponent(username)}/upgrade-progress.json`;
      const data = await this._network.fetchJSON<any>(url);
      if (Array.isArray(data?.errors) || data?.error_type) throw new Error('无法获取升级进度');

      const hasProgressShape = Array.isArray(data?.met_conditions)
        || Array.isArray(data?.unmet_conditions)
        || typeof data?.max_level_reached === 'boolean'
        || typeof data?.leader_upgrade_needed === 'boolean';
      if (!hasProgressShape) return null;

      return {
        met_conditions: this._conditionList(data.met_conditions),
        unmet_conditions: this._conditionList(data.unmet_conditions),
        next_level_name: typeof data.next_level_name === 'string' ? Utils.sanitize(data.next_level_name, 60) : undefined,
        max_level_reached: data.max_level_reached === true,
        leader_upgrade_needed: data.leader_upgrade_needed === true,
        message: typeof data.message === 'string' ? this._conditionText(data.message) : undefined,
      };
    } catch (e) {
      console.warn('[NLE] Failed to fetch upgrade progress:', (e as Error).message);
      return null;
    }
  }

  getRequirements(currentLevel: number): TrustRequirementDefinition[] | null {
    if (currentLevel >= 4) return null;
    return CONFIG.TRUST_LEVEL_REQUIREMENTS[currentLevel + 1] || null;
  }

  buildRequirementItems(currentStats: UserStats | null, currentLevel: number): RequirementItem[] {
    const reqs = this.getRequirements(currentLevel);
    if (!reqs) return [];
    if (!currentStats) return [];

    return reqs.map((req) => {
      const key = req.key;
      const required = req.required ?? 0;
      const isInfo = req.mode === 'info' || req.required == null;
      const current = (currentStats as any)[key] || 0;
      const isStatus = key === 'not_silenced' || key === 'not_suspended';
      let display = current;
      if (key === 'time_read') display = Math.floor(current / 60);
      else if (isStatus) display = current >= required ? 1 : 0;
      const requirementDisplay = key === 'time_read' ? Math.floor(required / 60) : required;
      const isReverse = req.mode === 'max';
      const isSuccess = !isInfo && (isReverse ? current <= required : current >= required);
      const rawProgress = isReverse
        ? (current <= required ? 1 : required / Math.max(current, 1))
        : (required > 0 ? current / required : 0);
      return {
        key,
        name: req.label || labelMap[key] || key,
        current: display,
        required: isInfo ? null : requirementDisplay,
        isSuccess,
        progress: isInfo ? 0 : Math.min(1, rawProgress),
        unit: req.unit,
        note: req.note,
        isInfo,
        countsTowardProgress: req.countsTowardProgress !== false && !isInfo,
      };
    });
  }

  buildOfficialRequirementItems(progress: UpgradeProgress): RequirementItem[] {
    const items: RequirementItem[] = [];

    if (progress.leader_upgrade_needed) {
      items.push({
        key: 'official_leader_upgrade_needed',
        name: '已满足升级条件，等待管理员审核',
        current: 0,
        required: null,
        isSuccess: false,
        progress: 1,
        isInfo: true,
        countsTowardProgress: false,
      });
    }

    progress.unmet_conditions.forEach((condition, index) => {
      items.push(this._buildOfficialCondition(condition, false, index));
    });

    progress.met_conditions.forEach((condition, index) => {
      items.push(this._buildOfficialCondition(condition, true, index));
    });

    if (progress.max_level_reached && progress.message && items.length === 0) {
      items.push({
        key: 'official_max_level_reached',
        name: progress.message,
        current: 1,
        required: null,
        isSuccess: true,
        progress: 1,
        isInfo: true,
        countsTowardProgress: false,
      });
    }

    return items;
  }

  getCompletionPercent(items: RequirementItem[]): number {
    const progressItems = items.filter(item => item.countsTowardProgress);
    if (!progressItems.length) return 100;
    const totalProgress = progressItems.reduce((sum, item) => sum + Math.max(0, Math.min(1, item.progress)), 0);
    return Math.round((totalProgress / progressItems.length) * 1000) / 10;
  }
}
