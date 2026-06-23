/**
 * 帖子数据获取模块
 */

import type { TopicInfo, TopicPost, ExportStatus } from './types';
import { Network } from '../../utils/network';
import { Utils } from '../../utils/helpers';

export class TopicDataFetcher {
  private _imageCache = new Map<string, string>();

  async fetchTopicInfo(topicId: number): Promise<TopicInfo> {
    const data = await Network.fetchJSONDirect<any>(`/t/topic/${topicId}.json`);
    const tags = (data?.tags || [])
      .map((tag: unknown) => typeof tag === 'string' ? tag : (tag as { name?: string })?.name || '')
      .filter(Boolean);
    const category = document.querySelector('.badge-category__name, .category-name')?.textContent?.trim() || '';
    const categoryStyle = document.querySelector('.badge-category')?.getAttribute('style') || '';

    return {
      id: topicId,
      title: Utils.sanitize(data?.title || data?.fancy_title || '当前话题', 160),
      postsCount: Math.max(1, Utils.toSafeInt(data?.posts_count, 1)),
      views: Utils.toSafeInt(data?.views, 0),
      category,
      categoryColor: categoryStyle.match(/background-color:\s*#([0-9a-fA-F]+)/)?.[1] || '',
      tags,
    };
  }

  async fetchPosts(
    topicId: number,
    start: number,
    end: number,
    format: 'md' | 'html' | 'pdf',
    embedImages: boolean,
    progress: (state: ExportStatus) => void,
    signal: AbortSignal,
  ): Promise<TopicPost[]> {
    // 获取所有帖子 ID
    const idData = await Network.fetchJSONDirect<{ post_ids?: number[] }>(
      `/t/${topicId}/post_ids.json?post_number=0&limit=99999`,
      signal,
    );
    const allIds = [...(idData.post_ids || [])];

    // 获取话题数据，确保第一个帖子 ID 在列表中
    const topicData = await Network.fetchJSONDirect<any>(`/t/${topicId}.json`, signal);
    const firstId = Utils.toSafeInt(topicData?.post_stream?.posts?.[0]?.id, 0);
    if (firstId && !allIds.includes(firstId)) allIds.unshift(firstId);

    const ids = allIds.slice(start - 1, end);
    if (!ids.length) throw new Error('没有找到帖子内容');

    const posts: TopicPost[] = [];

    // 分批获取帖子（每批 100 个）
    for (let i = 0; i < ids.length; i += 100) {
      if (signal.aborted) throw new Error('导出已取消');

      const batchIds = ids.slice(i, i + 100);
      progress({
        message: '正在获取帖子内容...',
        current: Math.min(i + batchIds.length, ids.length),
        total: ids.length,
        detail: `第 ${Math.floor(i / 100) + 1} 批`,
      });

      const query = batchIds.map(id => `post_ids[]=${encodeURIComponent(String(id))}`).join('&');
      const data = await Network.fetchJSONDirect<any>(`/t/${topicId}/posts.json?${query}&include_suggested=false`, signal);
      const batchPosts = data?.post_stream?.posts || [];

      for (const post of batchPosts) {
        const content = await this._processPostHtml(post.cooked || '', format !== 'md' && embedImages);
        const avatar = this._normalizeAvatarUrl(post.avatar_template);

        posts.push({
          postNumber: Utils.toSafeInt(post.post_number, 0),
          author: {
            username: Utils.sanitize(post.username || '', 80),
            name: Utils.sanitize(post.name || post.display_username || post.username || '', 120),
            avatarUrl: format !== 'md' && embedImages && avatar
              ? await this._imageToDataUrl(avatar)
              : avatar,
          },
          timestamp: post.created_at || post.updated_at || '',
          content,
          replyTo: post.reply_to_post_number
            ? {
                postNumber: Utils.toSafeInt(post.reply_to_post_number, 0),
                username: Utils.sanitize(post.reply_to_user?.username || '', 80),
              }
            : null,
          likeCount: Utils.toSafeInt((post.actions_summary || []).find((item: any) => item.id === 2)?.count, 0),
        });
      }
    }

    return posts.sort((a, b) => a.postNumber - b.postNumber);
  }

  clearImageCache(): void {
    this._imageCache.clear();
  }

  private async _processPostHtml(html: string, embedImages: boolean): Promise<string> {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;

    // 移除锚点
    wrapper.querySelectorAll('a.anchor, a[aria-hidden="true"].anchor').forEach(el => el.remove());

    // 移除 lightbox 包装器，只保留图片
    wrapper.querySelectorAll('.lightbox-wrapper').forEach(lightbox => {
      const img = lightbox.querySelector('img');
      if (img) {
        lightbox.replaceWith(img);
      } else {
        lightbox.remove();
      }
    });

    // 规范化链接
    for (const link of wrapper.querySelectorAll<HTMLAnchorElement>('a[href]')) {
      const href = link.getAttribute('href') || '';
      if (!href || href.startsWith('#')) continue;
      link.setAttribute('href', this._normalizeUrl(href));
    }

    // 处理图片
    for (const img of wrapper.querySelectorAll<HTMLImageElement>('img[src]')) {
      const src = img.getAttribute('src') || '';
      const normalized = this._normalizeUrl(src);
      img.setAttribute('src', embedImages ? await this._imageToDataUrl(normalized) : normalized);
    }

    return wrapper.innerHTML;
  }

  private _normalizeAvatarUrl(template: string | undefined): string {
    if (!template) return '';
    return this._normalizeUrl(template.replace('{size}', '90'));
  }

  private _normalizeUrl(url: string): string {
    if (!url || /^(?:data:|blob:|mailto:|javascript:|tel:)/i.test(url)) return url || '';
    if (/^https?:\/\//i.test(url)) return url;
    if (url.startsWith('//')) return `${window.location.protocol}${url}`;
    try {
      return new URL(url, Network.getOrigin()).toString();
    } catch {
      return url;
    }
  }

  private async _imageToDataUrl(url: string): Promise<string> {
    if (this._imageCache.has(url)) {
      return this._imageCache.get(url)!;
    }

    try {
      const resp = await fetch(url, { credentials: 'include' });
      if (!resp.ok) return url;
      const blob = await resp.blob();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(String(reader.result || url));
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      this._imageCache.set(url, dataUrl);
      return dataUrl;
    } catch {
      return url;
    }
  }
}
