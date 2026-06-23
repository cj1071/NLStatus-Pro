/**
 * 帖子导出主类
 */

import { TopicDataFetcher } from './fetcher';
import { ExportFormatter } from './formatters';
import { ExportUI } from './ui';
import type { ExportFormat, TopicInfo, ExportData } from './types';
import { Network } from '../../utils/network';
import { Utils } from '../../utils/helpers';

export class TopicExporter {
  private _fetcher: TopicDataFetcher;
  private _formatter: ExportFormatter;
  private _ui: ExportUI;
  private _format: ExportFormat = 'html';
  private _embedImages = false;
  private _hierarchical = false;
  private _cache: TopicInfo | null = null;
  private _abort: AbortController | null = null;

  constructor(
    private _root: HTMLElement,
    private _showToast: (msg: string) => void,
  ) {
    this._fetcher = new TopicDataFetcher();
    this._formatter = new ExportFormatter();
    this._ui = new ExportUI(
      this._root,
      () => this.hide(),
      () => this._renderHome(true),
    );
  }

  show(): void {
    this._ui.show();
    void this._renderHome(false);
  }

  hide(): void {
    this._abort?.abort();
    this._abort = null;
    this._ui.hide();
  }

  destroy(): void {
    this.hide();
    this._fetcher.clearImageCache();
    this._ui.remove();
  }

  private async _getTopicInfo(refresh = false): Promise<TopicInfo | null> {
    const topicId = Network.getTopicId();
    if (!topicId) return null;
    if (!refresh && this._cache?.id === topicId) return this._cache;

    this._cache = await this._fetcher.fetchTopicInfo(topicId);
    return this._cache;
  }

  private async _renderHome(refresh = false): Promise<void> {
    const topicId = Network.getTopicId();
    if (!topicId) {
      this._ui.showNotTopic();
      return;
    }

    this._ui.showLoading();

    try {
      const info = await this._getTopicInfo(refresh);
      if (!info) throw new Error('获取话题信息失败');

      this._ui.renderHome(
        info,
        this._format,
        this._embedImages,
        this._hierarchical,
        (format) => {
          this._format = format;
          this._ui.syncEmbedImagesControl(format);
        },
        (embed) => {
          this._embedImages = embed;
        },
        (hierarchical) => {
          this._hierarchical = hierarchical;
        },
        (start, end) => this._doExport(info, start, end),
      );

      this._ui.syncEmbedImagesControl(this._format);
    } catch (e) {
      this._ui.showError((e as Error).message || '获取话题信息失败');
    }
  }

  private async _doExport(info: TopicInfo, start: number, end: number): Promise<void> {
    start = Math.max(1, Math.min(start, info.postsCount));
    end = Math.max(1, Math.min(end, info.postsCount));

    if (start > end) {
      this._showToast('起始楼层不能大于结束楼层');
      return;
    }

    this._abort = new AbortController();
    this._ui.showCancelButton(() => this._abort?.abort());
    this._ui.setStatus({ message: '正在获取帖子列表...', current: 0, total: end - start + 1 });

    try {
      const posts = await this._fetcher.fetchPosts(
        info.id,
        start,
        end,
        this._format,
        this._embedImages,
        (status) => this._ui.setStatus(status),
        this._abort.signal,
      );

      if (this._abort.signal.aborted) throw new Error('导出已取消');
      if (!posts.length) throw new Error('没有获取到帖子内容');

      const data: ExportData = {
        topic: info,
        posts,
        exportDate: new Date().toISOString(),
        postCount: posts.length,
        range: { start, end },
        hierarchical: this._hierarchical,
      };

      this._ui.setStatus({ message: '正在生成文件...', current: posts.length, total: posts.length });

      if (this._format === 'md') {
        const content = this._formatter.toMarkdown(data);
        const filename = this._formatter.generateFilename(info, 'md');
        this._formatter.download(content, filename, 'text/markdown;charset=utf-8');
      } else {
        const html = this._formatter.toHTML(data);
        if (this._format === 'html') {
          const filename = this._formatter.generateFilename(info, 'html');
          this._formatter.download(html, filename, 'text/html;charset=utf-8');
        } else {
          this._formatter.toPDF(html);
        }
      }

      this._ui.setStatus({ icon: '✓', message: '导出成功' });
      this._showToast('导出成功');
    } catch (e) {
      const msg = (e as Error).message === '导出已取消' ? '导出已取消' : ((e as Error).message || '导出失败');
      this._ui.setStatus({ message: msg });
      if (msg !== '导出已取消') this._showToast(msg);
    } finally {
      this._abort = null;
      this._ui.replaceExportButton((s, e) => this._doExport(info, s, e), info);
    }
  }
}
