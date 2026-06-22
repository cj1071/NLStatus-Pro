import { CURRENT_SITE } from '../site';
import { FollowFetcher } from '../data/followFetcher';
import type { FollowUser } from '../data/followFetcher';
import type { Storage } from '../utils/storage';
import type { PanelElementMap } from './panelTemplate';

interface FollowPanelOptions {
  root: HTMLElement;
  els: PanelElementMap;
  storage: Storage;
  fetcher: FollowFetcher;
  renderFollowList: (users: FollowUser[]) => string;
  bindImageFallbacks: (root: ParentNode) => void;
}

export class FollowPanel {
  private _activeTab = 'following';
  private _followingList: FollowUser[] = [];
  private _followersList: FollowUser[] = [];
  private _officialFollowingCount: number | null = null;
  private _officialFollowersCount: number | null = null;

  constructor(private _options: FollowPanelOptions) {}

  init(): void {
    for (const s of this._options.root.querySelectorAll<HTMLElement>('.nle-follow-stat')) {
      s.addEventListener('click', () => {
        const tab = s.dataset.followTab!;
        this._activeTab = tab;
        for (const fs of this._options.root.querySelectorAll('.nle-follow-stat')) fs.classList.remove('active');
        s.classList.add('active');
        this.renderList();
      });
    }
  }

  setCounts(following: number | null | undefined, followers: number | null | undefined): void {
    this._officialFollowingCount = typeof following === 'number' ? following : null;
    this._officialFollowersCount = typeof followers === 'number' ? followers : null;
  }

  async load(): Promise<void> {
    const username = await this._options.storage.resolveUser();
    if (!username) return;

    try {
      const [following, followers] = await Promise.all([
        this._options.fetcher.fetchFollowing(username),
        this._options.fetcher.fetchFollowers(username),
      ]);

      this._followingList = following;
      this._followersList = followers;

      this._options.els.followingCount.textContent = String(this._officialFollowingCount ?? following.length);
      this._options.els.followersCount.textContent = String(this._officialFollowersCount ?? followers.length);
      this.renderList();
    } catch {
      // ignore
    }
  }

  renderList(): void {
    const users = this._activeTab === 'following' ? this._followingList : this._followersList;
    this._options.els.followList.innerHTML = this._options.renderFollowList(users || []);
    this._options.bindImageFallbacks(this._options.els.followList);

    for (const item of this._options.els.followList.querySelectorAll<HTMLElement>('.nle-follow-item')) {
      item.addEventListener('click', () => {
        const uname = item.dataset.username;
        if (uname && CURRENT_SITE) window.open(`${CURRENT_SITE.origin}/u/${uname}`, '_blank');
      });
    }
  }

  destroy(): void {
    // 事件监听器绑定在 _options.root 内的元素上
    // 当 root 被移除时会自动清理
    // 此方法用于保持一致性和未来扩展
  }
}
