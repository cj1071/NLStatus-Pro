import { CURRENT_SITE } from '../site';
import { Network } from '../utils/network';
import { Utils } from '../utils/helpers';

export type ActivityType = 'read' | 'bookmarks' | 'replies' | 'likes' | 'topics' | 'reactions' | 'notifications';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  topic_id?: number;
  post_number?: number;
  title: string;
  excerpt?: string;
  created_at?: string;
  updated_at?: string;
  url?: string;
  author?: string;
  avatar?: string;
  meta?: string;
  reaction?: string;
}

export interface ActivityPage {
  items: ActivityItem[];
  more: boolean;
  nextPage?: number;
  nextOffset?: number;
  nextBeforeId?: number | null;
  unavailable?: boolean;
}

function cleanText(value: unknown, maxLen = 160): string {
  if (typeof value !== 'string') return '';
  const text = value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
  return Utils.sanitize(text, maxLen);
}

export class ActivityFetcher {
  constructor(private _network: Network) {}

  private _topicUrl(topicId?: number, postNumber?: number): string | undefined {
    if (!CURRENT_SITE || !topicId) return undefined;
    const suffix = postNumber ? `/${postNumber}` : '';
    return `${CURRENT_SITE.origin}/t/topic/${topicId}${suffix}`;
  }

  private _absoluteUrl(path?: string): string | undefined {
    if (!CURRENT_SITE || !path) return undefined;
    return path.startsWith('http') ? path : `${CURRENT_SITE.origin}${path}`;
  }

  private _avatarUrl(template?: string, size = 40): string | undefined {
    if (!CURRENT_SITE || !template) return undefined;
    const path = template.replace(/\{size\}|\/\d+\//g, (match) => match === '{size}' ? String(size) : `/${size}/`);
    return path.startsWith('http') ? path : `${CURRENT_SITE.origin}${path}`;
  }

  private _mapTopic(topic: any, type: ActivityType): ActivityItem {
    const topicId = Utils.toSafeInt(topic.id || topic.topic_id);
    const lastPoster = Array.isArray(topic.postersInfo)
      ? topic.postersInfo[0]
      : (Array.isArray(topic.posters) ? topic.posters[0] : null);
    return {
      id: `${type}-${topicId}`,
      type,
      topic_id: topicId,
      title: cleanText(topic.title || topic.fancy_title || '未命名话题', 100),
      excerpt: cleanText(topic.excerpt || topic.blurb || '', 160),
      created_at: topic.created_at,
      updated_at: topic.last_posted_at || topic.bumped_at || topic.updated_at,
      url: this._topicUrl(topicId),
      author: lastPoster?.username || topic.last_poster_username || topic.username,
      avatar: this._avatarUrl(lastPoster?.avatar_template),
      meta: topic.posts_count ? `${Utils.formatNumber(Utils.toSafeInt(topic.posts_count))} 帖` : undefined,
    };
  }

  private _mapUserAction(action: any, type: ActivityType): ActivityItem {
    const topicId = Utils.toSafeInt(action.topic_id);
    const postNumber = Utils.toSafeInt(action.post_number);
    return {
      id: `${type}-${action.post_id || action.id || topicId}-${postNumber}`,
      type,
      topic_id: topicId,
      post_number: postNumber,
      title: cleanText(action.title || action.topic_title || action.excerpt || '活动记录', 100),
      excerpt: cleanText(action.excerpt || '', 160),
      created_at: action.created_at,
      updated_at: action.updated_at,
      url: this._topicUrl(topicId, postNumber),
      author: action.username || action.target_name,
      avatar: this._avatarUrl(action.avatar_template),
    };
  }

  private _mapBookmark(bookmark: any): ActivityItem {
    const topicId = Utils.toSafeInt(bookmark.topic_id);
    const postNumber = Utils.toSafeInt(bookmark.linked_post_number || bookmark.post_number);
    return {
      id: `bookmarks-${bookmark.id || topicId}-${postNumber}`,
      type: 'bookmarks',
      topic_id: topicId,
      post_number: postNumber,
      title: cleanText(bookmark.title || bookmark.name || '书签', 100),
      excerpt: cleanText(bookmark.excerpt || '', 160),
      created_at: bookmark.created_at,
      updated_at: bookmark.updated_at,
      url: bookmark.bookmarkable_url
        ? this._absoluteUrl(bookmark.bookmarkable_url)
        : this._topicUrl(topicId, postNumber),
      meta: bookmark.name ? cleanText(bookmark.name, 40) : undefined,
    };
  }

  private _mapNotification(notification: any): ActivityItem {
    const topicId = Utils.toSafeInt(notification.topic_id);
    const postNumber = Utils.toSafeInt(notification.post_number);
    return {
      id: `notifications-${notification.id || topicId}-${postNumber}`,
      type: 'notifications',
      topic_id: topicId,
      post_number: postNumber,
      title: cleanText(notification.fancy_title || notification.topic_title || notification.data?.topic_title || '通知', 100),
      excerpt: cleanText(notification.data?.display_username || notification.data?.original_post_id || '', 120),
      created_at: notification.created_at,
      updated_at: notification.read_at,
      url: this._topicUrl(topicId, postNumber),
      meta: '通知',
    };
  }

  private _mapReaction(reaction: any): ActivityItem {
    const post = reaction.post || reaction;
    const topicId = Utils.toSafeInt(post.topic_id || reaction.topic_id);
    const postNumber = Utils.toSafeInt(post.post_number || reaction.post_number);
    const reactionValue = String(reaction.reaction_value || reaction.reaction || reaction.emoji || '').trim();
    return {
      id: `reactions-${reaction.id || topicId}-${postNumber}-${reactionValue}`,
      type: 'reactions',
      topic_id: topicId,
      post_number: postNumber,
      title: cleanText(post.topic_title || reaction.topic_title || post.title || '互动记录', 100),
      excerpt: cleanText(post.excerpt || reaction.excerpt || post.cooked || '', 160),
      created_at: reaction.created_at || post.created_at,
      updated_at: reaction.updated_at,
      url: this._topicUrl(topicId, postNumber),
      author: post.username || reaction.username,
      avatar: this._avatarUrl(post.avatar_template || reaction.avatar_template),
      reaction: reactionValue || 'reaction',
      meta: reactionValue ? `回应: ${reactionValue}` : '互动',
    };
  }

  async fetchRead(page = 0): Promise<ActivityPage> {
    if (!CURRENT_SITE) return { items: [], more: false };
    try {
      const url = page > 0 ? `${CURRENT_SITE.origin}/read.json?page=${page}` : `${CURRENT_SITE.origin}/read.json`;
      const data = await this._network.fetchJSON<any>(url, { cacheTtl: 60000 });
      const topics = data?.topic_list?.topics || [];
      return {
        items: topics.map((topic: any) => this._mapTopic(topic, 'read')),
        more: data?.topic_list?.more_topics_url != null,
        nextPage: page + 1,
      };
    } catch {
      return { items: [], more: false };
    }
  }

  async fetchBookmarks(username: string, page = 0): Promise<ActivityPage> {
    if (!CURRENT_SITE) return { items: [], more: false };
    try {
      const url = `${CURRENT_SITE.origin}/u/${encodeURIComponent(username)}/bookmarks.json?page=${page}`;
      const data = await this._network.fetchJSON<any>(url, { cacheTtl: 60000 });
      const bookmarks = data?.user_bookmark_list?.bookmarks || [];
      return {
        items: bookmarks.map((bookmark: any) => this._mapBookmark(bookmark)),
        more: data?.user_bookmark_list?.more_bookmarks_url != null,
        nextPage: page + 1,
      };
    } catch {
      return { items: [], more: false };
    }
  }

  async fetchReplies(username: string, offset = 0): Promise<ActivityPage> {
    return this._fetchUserActions(username, 'replies', 5, offset);
  }

  async fetchLikes(username: string, offset = 0): Promise<ActivityPage> {
    return this._fetchUserActions(username, 'likes', 1, offset);
  }

  private async _fetchUserActions(username: string, type: ActivityType, filter: number, offset = 0): Promise<ActivityPage> {
    if (!CURRENT_SITE) return { items: [], more: false };
    try {
      const url = `${CURRENT_SITE.origin}/user_actions.json?offset=${offset}&username=${encodeURIComponent(username)}&filter=${filter}`;
      const data = await this._network.fetchJSON<any>(url, { cacheTtl: 60000 });
      const actions = data?.user_actions || [];
      return {
        items: actions.map((action: any) => this._mapUserAction(action, type)),
        more: actions.length >= 30,
        nextOffset: offset + actions.length,
      };
    } catch {
      return { items: [], more: false };
    }
  }

  async fetchTopics(username: string, page = 0): Promise<ActivityPage> {
    if (!CURRENT_SITE) return { items: [], more: false };
    try {
      const url = page > 0
        ? `${CURRENT_SITE.origin}/topics/created-by/${encodeURIComponent(username)}.json?page=${page}`
        : `${CURRENT_SITE.origin}/topics/created-by/${encodeURIComponent(username)}.json`;
      const data = await this._network.fetchJSON<any>(url, { cacheTtl: 60000 });
      const topics = data?.topic_list?.topics || [];
      return {
        items: topics.map((topic: any) => this._mapTopic(topic, 'topics')),
        more: topics.length >= 30 || data?.topic_list?.more_topics_url != null,
        nextPage: page + 1,
      };
    } catch {
      return { items: [], more: false };
    }
  }

  async fetchReactions(username: string, beforeId: number | null = null): Promise<ActivityPage> {
    if (!CURRENT_SITE) return { items: [], more: false };
    try {
      let url = `${CURRENT_SITE.origin}/discourse-reactions/posts/reactions.json?username=${encodeURIComponent(username)}`;
      if (beforeId) url += `&before_reaction_user_id=${beforeId}`;
      const data = await this._network.fetchJSON<any>(url, { cacheTtl: 60000 });
      if (!Array.isArray(data)) return { items: [], more: false, unavailable: true };
      const lastId = data.length ? Utils.toSafeInt(data[data.length - 1]?.id, 0) : null;
      return {
        items: data.map((reaction: any) => this._mapReaction(reaction)),
        more: data.length >= 20 && lastId != null,
        nextBeforeId: lastId,
      };
    } catch {
      return { items: [], more: false, unavailable: true };
    }
  }

  async fetchNotifications(_username: string): Promise<ActivityPage> {
    if (!CURRENT_SITE) return { items: [], more: false };
    try {
      const url = `${CURRENT_SITE.origin}/notifications.json?recent=true&limit=30`;
      const data = await this._network.fetchJSON<any>(url, { cacheTtl: 60000 });
      return {
        items: (data?.notifications || []).map((notification: any) => this._mapNotification(notification)),
        more: false,
      };
    } catch {
      return { items: [], more: false };
    }
  }
}
