/**
 * AI 总结类型定义
 */

export type SummaryMode = 'brief' | 'detailed';

export interface AISummaryConfig {
  apiUrl: string;
  apiKey: string;
  model: string;
  promptBrief: string;
  promptDetailed: string;
}

export interface TopicInfo {
  id: number;
  title: string;
  postsCount: number;
  views: number;
  likeCount: number;
}

export interface HistoryRecord {
  topicId: number;
  title: string;
  summary: string;
  mode: SummaryMode;
  range: {
    start: number;
    end: number;
  };
  timestamp: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ViewerPayload {
  title: string;
  summary: string;
  mode: SummaryMode;
  topicId: number;
  range?: {
    start: number;
    end: number;
  };
  timestamp?: number;
  streaming?: boolean;
}

export const CONFIG_KEY = 'aiTopicSummaryConfig';
export const HISTORY_KEY = 'aiTopicSummaryHistory';
export const DEFAULT_MODEL = 'gpt-4o-mini';
export const DEFAULT_API_URL = 'https://api.openai.com/v1/chat/completions';
export const PROMPT_BRIEF = '用简洁的方式总结以下论坛讨论，提炼核心观点、争议点和结论，控制在 200 字以内。';
export const PROMPT_DETAILED = '详细分析和总结以下论坛讨论，按主题脉络、主要观点、分歧、有效信息和结论建议组织内容。';
