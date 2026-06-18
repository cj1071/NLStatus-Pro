import { CURRENT_SITE } from '../site';
import { Storage } from '../utils/storage';
import { ActivityFetcher } from '../data/activityFetcher';
import type { ActivityItem, ActivityPage, ActivityType } from '../data/activityFetcher';
import type { PanelElementMap } from './panelTemplate';

interface ActivityPanelOptions {
  root: HTMLElement;
  els: PanelElementMap;
  storage: Storage;
  fetcher: ActivityFetcher;
  getActiveTab: () => string;
  renderActivity: (items: ActivityItem[], emptyMsg?: string) => string;
}

export class ActivityPanel {
  private _activityType: ActivityType = 'read';
  private _activityOffset = 0;
  private _activityBeforeId: number | null = null;
  private _activityList: ActivityItem[] = [];
  private _activitySearchTerm = '';
  private _activityLoading = false;
  private _activityHasMore = false;
  private _searchTimer: ReturnType<typeof setTimeout> | null = null;
  private _scrollHandler!: () => void;

  constructor(private _options: ActivityPanelOptions) {}

  init(): void {
    for (const t of this._options.root.querySelectorAll<HTMLElement>('[data-activity-type]')) {
      t.addEventListener('click', () => {
        for (const b of t.parentElement!.querySelectorAll('[data-activity-type]')) b.classList.remove('active');
        t.classList.add('active');
        this._activityType = t.dataset.activityType as ActivityType;
        this._activityOffset = 0;
        this._activityBeforeId = null;
        this._activitySearchTerm = '';
        this._activityHasMore = false;
        if (this._searchTimer) clearTimeout(this._searchTimer);
        (this._options.els.activitySearch as HTMLInputElement).value = '';
        this._options.els.activityStats.textContent = '已加载 0 条';
        this.load();
      });
    }

    this._options.els.activitySearch.addEventListener('input', () => {
      if (this._searchTimer) clearTimeout(this._searchTimer);
      this._searchTimer = setTimeout(() => {
        this._activitySearchTerm = (this._options.els.activitySearch as HTMLInputElement).value.trim();
        this._applyFilterAndRender();
        this._updateEndState();
        this._maybeAutoFill();
      }, 600);
    });

    const scrollEl = this._options.els.activityScroll;
    this._scrollHandler = () => {
      if (this._activitySearchTerm) return;
      if (this._activityLoading) return;
      if (!this._activityHasMore) return;
      if (scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight < 120) {
        this.load(true);
      }
    };
    scrollEl.addEventListener('scroll', this._scrollHandler, { passive: true });
  }

  async load(loadMore = false): Promise<void> {
    if (this._activityLoading) return;

    if (!loadMore) {
      this._activityOffset = 0;
      this._activityBeforeId = null;
    }
    const username = await this._options.storage.resolveUser();
    if (!username) return;

    const type = this._activityType || 'read';

    this._activityLoading = true;
    if (loadMore) {
      this._options.els.activityStatus.textContent = '加载中...';
      this._options.els.activityStatus.style.display = '';
      this._options.els.activityEnd.style.display = 'none';
    }
    try {
      const result = await this._fetchPage(username, type);
      const items = result.items;

      if (loadMore) {
        this._activityList = [...this._activityList, ...items];
      } else {
        this._activityList = items;
      }

      this._activityHasMore = result.more;

      if (typeof result.nextPage === 'number') this._activityOffset = result.nextPage;
      else if (typeof result.nextOffset === 'number') this._activityOffset = result.nextOffset;
      if ('nextBeforeId' in result) this._activityBeforeId = result.nextBeforeId ?? null;

      this._applyFilterAndRender();
      this._updateEndState();
    } catch {
      // ignore
    } finally {
      this._activityLoading = false;
      this._options.els.activityStatus.style.display = 'none';
    }
    this._maybeAutoFill();
  }

  destroy(): void {
    if (this._searchTimer) clearTimeout(this._searchTimer);
    this._options.els.activityScroll?.removeEventListener('scroll', this._scrollHandler);
  }

  private async _fetchPage(username: string, type: ActivityType): Promise<ActivityPage> {
    if (type === 'read') return this._options.fetcher.fetchRead(this._activityOffset);
    if (type === 'bookmarks') return this._options.fetcher.fetchBookmarks(username, this._activityOffset);
    if (type === 'replies') return this._options.fetcher.fetchReplies(username, this._activityOffset);
    if (type === 'likes') return this._options.fetcher.fetchLikes(username, this._activityOffset);
    if (type === 'topics') return this._options.fetcher.fetchTopics(username, this._activityOffset);
    if (type === 'reactions') return this._options.fetcher.fetchReactions(username, this._activityBeforeId);
    return this._options.fetcher.fetchNotifications(username);
  }

  private _maybeAutoFill(): void {
    if (this._options.getActiveTab() !== 'activity') return;
    if (this._activitySearchTerm) return;
    if (this._activityLoading) return;
    if (!this._activityHasMore) return;
    const scrollEl = this._options.els.activityScroll;
    if (!scrollEl) return;
    if (scrollEl.scrollHeight - scrollEl.clientHeight < 8) {
      this.load(true);
    }
  }

  private _applyFilterAndRender(): void {
    const search = this._activitySearchTerm.toLowerCase();
    const filtered = search
      ? this._activityList.filter((item) => {
          const haystack = `${item.title} ${item.excerpt || ''}`.toLowerCase();
          return haystack.includes(search);
        })
      : this._activityList;

    const total = this._activityList.length;
    let statsText = `已加载 ${total} 条`;
    if (search) statsText += ` · 匹配 ${filtered.length} 条`;
    this._options.els.activityStats.textContent = statsText;

    const emptyMsg = search && filtered.length === 0
      ? `🔍 未找到"${this._activitySearchTerm}"的相关记录`
      : undefined;
    this._options.els.activityList.innerHTML = this._options.renderActivity(filtered, emptyMsg);

    for (const item of this._options.els.activityList.querySelectorAll<HTMLElement>('.nle-activity-item')) {
      item.addEventListener('click', () => {
        const url = item.dataset.url;
        if (url) {
          window.open(url, '_blank');
          return;
        }
        const tid = item.dataset.topicId;
        if (tid && CURRENT_SITE) window.open(`${CURRENT_SITE.origin}/t/topic/${tid}`, '_blank');
      });
    }
  }

  private _updateEndState(): void {
    const hasItems = this._activityList.length > 0;
    const showEnd = !this._activitySearchTerm && hasItems && !this._activityHasMore;
    this._options.els.activityEnd.style.display = showEnd ? '' : 'none';
  }
}
