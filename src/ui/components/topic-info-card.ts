/**
 * 统一的话题信息卡片组件
 * 在 AI 总结和导出功能中复用
 */

import { Utils } from '../../utils/helpers';

export interface TopicCardInfo {
  id: number;
  title: string;
  category?: string;
  categoryColor?: string;
  tags?: string[];
  postsCount: number;
  views?: number;
  likeCount?: number;
}

export class TopicInfoCard {
  /**
   * 渲染话题信息卡片
   * @param info 话题信息
   * @param options 可选配置
   */
  static render(info: TopicCardInfo, options: {
    showTopicId?: boolean;
    showTags?: boolean;
    compact?: boolean;
  } = {}): string {
    const { showTopicId = false, showTags = true, compact = false } = options;

    // 标签
    const tagHtml = showTags && info.tags?.length
      ? info.tags.map(tag => `<span class="nle-topic-tag">${Utils.escapeHtml(tag)}</span>`).join('')
      : '';

    // 分类
    const categoryHtml = showTags && info.category
      ? `<span class="nle-topic-category" ${info.categoryColor ? `style="background: #${info.categoryColor}"` : ''}>${Utils.escapeHtml(info.category)}</span>`
      : '';

    // 紧凑模式：卡片式布局（AI 总结）
    if (compact) {
      return `
        <div class="nle-topic-card">
          <div class="nle-topic-card-title">${Utils.escapeHtml(info.title)}</div>
          ${categoryHtml || tagHtml ? `<div class="nle-topic-card-tags">${categoryHtml}${tagHtml}</div>` : ''}
          <div class="nle-topic-card-stats">
            <div><span>楼层</span><b>${Utils.formatNumber(info.postsCount)}</b></div>
            ${info.views ? `<div><span>浏览</span><b>${Utils.formatNumber(info.views)}</b></div>` : ''}
            ${info.likeCount ? `<div><span>点赞</span><b>${Utils.formatNumber(info.likeCount)}</b></div>` : ''}
          </div>
        </div>
      `;
    }

    // 详细模式：列表式布局（导出）
    return `
      <div class="nle-topic-info">
        <div class="nle-topic-info-title">${Utils.escapeHtml(info.title)}</div>
        ${categoryHtml || tagHtml ? `<div class="nle-topic-info-tags">${categoryHtml}${tagHtml}</div>` : ''}
        ${showTopicId ? `<div class="nle-topic-info-row"><span>话题 ID</span><b>${info.id}</b></div>` : ''}
        <div class="nle-topic-info-row"><span>楼层数</span><b>${info.postsCount}</b></div>
        ${info.views ? `<div class="nle-topic-info-row"><span>浏览量</span><b>${Utils.formatNumber(info.views)}</b></div>` : ''}
      </div>
    `;
  }
}
