/**
 * 帖子导出类型定义
 */

export type ExportFormat = 'md' | 'html' | 'pdf';

export interface TopicInfo {
  id: number;
  title: string;
  postsCount: number;
  views: number;
  category: string;
  categoryColor: string;
  tags: string[];
}

export interface TopicPost {
  postNumber: number;
  author: {
    username: string;
    name: string;
    avatarUrl: string;
  };
  timestamp: string;
  content: string;
  replyTo: {
    postNumber: number;
    username: string;
  } | null;
  likeCount: number;
}

export interface ExportData {
  topic: TopicInfo;
  posts: TopicPost[];
  exportDate: string;
  postCount: number;
  range: {
    start: number;
    end: number;
  };
}

export interface ExportStatus {
  icon?: string;
  message: string;
  detail?: string;
  current?: number;
  total?: number;
}
