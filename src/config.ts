export interface TrustRequirementDefinition {
  key: string;
  required?: number;
  label?: string;
  unit?: string;
  mode?: 'min' | 'max' | 'info';
  countsTowardProgress?: boolean;
  note?: string;
}

export const CONFIG = {
  INTERVALS: {
    REFRESH: 300000,
    READING_TRACK: 10000,
    READING_SAVE: 30000,
    READING_IDLE: 60000,
    READING_UPDATE: 2000,
    ENERGY_REFRESH: 30000,
  },
  CACHE: {
    MAX_HISTORY_DAYS: 365,
    LRU_SIZE: 50,
    VALUE_TTL: 5000,
    LEADERBOARD_TTL: 600000,
  },
  NETWORK: {
    RETRY_COUNT: 3,
    RETRY_DELAY: 1000,
    TIMEOUT: 15000,
    MIN_REQUEST_INTERVAL: 300,
  },
  TRUST_LEVEL_NAMES: ['青铜', '白银', '黄金', '钻石', '王者'],
  TRUST_LEVEL_COLORS: ['#94a3b8', '#60a5fa', '#34d399', '#fbbf24', '#ef4444'],
  TRUST_LEVEL_REQUIREMENTS: {
    1: [
      { key: 'topics_entered', required: 10, label: '进入主题数量' },
      { key: 'posts_read_count', required: 100, label: '阅读帖子数量' },
      { key: 'time_read', required: 600 * 60, label: '花费时间', unit: '分钟' },
    ],
    2: [
      { key: 'topics_entered', required: 50, label: '进入主题数量' },
      { key: 'posts_read_count', required: 500, label: '阅读帖子数量' },
      { key: 'time_read', required: 3000 * 60, label: '花费时间', unit: '分钟' },
      { key: 'days_visited', required: 30, label: '访问天数', unit: '天' },
      { key: 'likes_received', required: 10, label: '收到的赞' },
      { key: 'likes_given', required: 10, label: '给出的赞' },
      { key: 'post_count', required: 100, label: '主题回复数' },
    ],
    3: [
      { key: 'topics_entered', required: 2000, label: '查看主题总数（历史）' },
      { key: 'posts_read_count', required: 50000, label: '阅读帖子总数（历史）' },
      { key: 'tl3_recent_days', label: '近100天访问天数', mode: 'info', note: '需后续解析论坛升级接口' },
      { key: 'tl3_recent_replied_topics', label: '近100天回复主题数', mode: 'info', note: '需后续解析论坛升级接口' },
      { key: 'tl3_recent_topics_viewed', label: '近100天查看主题数', mode: 'info', note: '要求25个，上限500' },
      { key: 'tl3_recent_posts_read', label: '近100天阅读帖子数', mode: 'info', note: '要求25个，上限20000' },
      { key: 'tl3_recent_likes_given', label: '近100天给出的赞', mode: 'info', note: '要求30个' },
      { key: 'tl3_recent_likes_received', label: '近100天收到的赞', mode: 'info', note: '要求20个' },
      { key: 'tl3_flags', label: '最大举报数', mode: 'info', note: '不能超过5个' },
      { key: 'tl3_promotion_gap', label: '最短晋升间隔', mode: 'info', note: '14天' },
    ],
    4: null as null,
  } as Record<number, TrustRequirementDefinition[] | null>,
  READING_LEVELS: [
    { min: 0, label: '初来乍到', icon: '🌱', color: '#94a3b8', bg: 'rgba(148,163,184,0.15)' },
    { min: 30, label: '渐入佳境', icon: '📖', color: '#60a5fa', bg: 'rgba(96,165,250,0.15)' },
    { min: 90, label: '乐在其中', icon: '📚', color: '#34d399', bg: 'rgba(52,211,153,0.15)' },
    { min: 180, label: '沉浸阅读', icon: '🔥', color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' },
    { min: 300, label: '深度学习', icon: '⚡', color: '#f97316', bg: 'rgba(249,115,22,0.15)' },
    { min: 450, label: 'NL达人', icon: '🏆', color: '#a855f7', bg: 'rgba(168,85,247,0.15)' },
    { min: 600, label: '超级水怪', icon: '👑', color: '#ec4899', bg: 'rgba(236,72,153,0.15)' },
  ],
  WEEKDAYS: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
} as const;

export const PATTERNS = {
  USERNAME: /\/u\/([^/]+)/,
  AVATAR_SIZE: /\{size\}/g,
  NUMBER: /(\d+)/,
  TRUST_LEVEL_HDR: /信任级别|Trust Level/i,
} as const;
