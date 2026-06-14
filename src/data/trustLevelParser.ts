import { PATTERNS } from '../config';
import { CURRENT_SITE } from '../site';
import { Network } from '../utils/network';
import { Utils } from '../utils/helpers';

export interface UserProfile {
  trust_level: number;
  gamification_score: number;
  avatar: string;
  title: string;
  name: string;
  username: string;
  created_at?: string;
  total_following: number;
  total_followers: number;
  days_visited?: number;
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
        created_at: typeof user.created_at === 'string' ? user.created_at : undefined,
        total_following: Utils.toSafeInt(user.total_following),
        total_followers: Utils.toSafeInt(user.total_followers),
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
