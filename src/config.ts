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
    1: {
      not_silenced: 1, not_suspended: 1,
      topics_entered: 10, posts_read_count: 100, time_read: 600 * 60,
    },
    2: {
      not_silenced: 1, not_suspended: 1,
      topics_entered: 50, posts_read_count: 500, time_read: 3000 * 60,
      days_visited: 30, post_count: 10, likes_given: 10, likes_received: 10,
    },
    3: {
      not_silenced: 1, not_suspended: 1,
      days_visited: 60, topic_count: 100, topics_entered: 500,
      posts_read_count: 20000, likes_given: 30, likes_received: 20,
    },
    4: null as null,
  } as Record<number, Record<string, number> | null>,
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
