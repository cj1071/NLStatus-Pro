import './styles.css';
import { CONFIG } from '../config';
import { CURRENT_SITE } from '../site';
import { EventBus } from '../utils/eventBus';
import { TabLeader } from '../utils/tabLeader';
import { Utils } from '../utils/helpers';
import { Storage } from '../utils/storage';
import { Network } from '../utils/network';
import { Screen } from '../utils/screen';
import { ErrorFormatter } from '../utils/errors';
import { TrustLevelParser } from '../data/trustLevelParser';
import { LeaderboardFetcher } from '../data/leaderboardFetcher';
import { ActivityFetcher } from '../data/activityFetcher';
import { FollowFetcher } from '../data/followFetcher';
import { ReadingTracker } from '../tracking/readingTracker';
import { Notifier } from '../tracking/notifier';
import { Renderer } from './renderer';
import { NavBarEnergy } from './navBarEnergy';

import type { UserProfile, RequirementItem } from '../data/trustLevelParser';
import type { FollowUser } from '../data/followFetcher';

const DRAG_THRESHOLD = 5;

export default class Panel {
  /* dependencies */
  storage: Storage;
  private _network: Network;
  private _trustParser: TrustLevelParser;
  private _lbFetcher: LeaderboardFetcher;
  private _activityFetcher: ActivityFetcher;
  private _followFetcher: FollowFetcher;
  tracker: ReadingTracker;
  private _notifier: Notifier;
  private _renderer: Renderer;
  private _navEnergy: NavBarEnergy;

  /* DOM */
  private _el!: HTMLElement;
  _els: Record<string, HTMLElement> = {};

  /* state */
  private _destroyed = false;
  private _loading = false;
  private _activeTab = 'trust';
  private _activeLbType = 'energy';
  private _activeFollowTab = 'following';
  private _user: UserProfile | null = null;
  private _reqItems: RequirementItem[] = [];
  private _lastPct = 0;
  private _collapsed = false;
  private _themeMode = 'auto';

  /* data caches */
  private _energyLoaded = false;
  private _postingLoaded = false;
  private _activityType = 'bookmarks';
  private _activityOffset = 0;
  private _activityList: unknown[] = [];
  private _followingList: FollowUser[] = [];
  private _followersList: FollowUser[] = [];

  /* timers */
  private _refreshTimer: ReturnType<typeof setInterval> | null = null;
  private _readingTimer: ReturnType<typeof setInterval> | null = null;
  private _themeMediaListener!: (e: MediaQueryListEvent) => void;
  private _resizeHandler!: (() => void) & { cancel?: () => void };

  /* drag */
  private _dragging = false;
  private _moved = false;
  private _ox = 0;
  private _oy = 0;
  private _sx = 0;
  private _sy = 0;
  private _dragStartStyles: { left: string; right: string; top: string } | null = null;
  private _onDragStart!: (e: MouseEvent | TouchEvent) => void;
  private _onDragMove!: (e: MouseEvent | TouchEvent) => void;
  private _onDragEnd!: () => void;
  private _onTouchEnd!: () => void;

  get $(): Record<string, HTMLElement> {
    return this._els;
  }

  constructor() {
    this.storage = new Storage();
    this._network = new Network();
    this._trustParser = new TrustLevelParser(this._network);
    this._lbFetcher = new LeaderboardFetcher(this._network);
    this._activityFetcher = new ActivityFetcher(this._network);
    this._followFetcher = new FollowFetcher(this._network);
    this.tracker = new ReadingTracker(this.storage);
    this._notifier = new Notifier(this.storage);
    this._renderer = new Renderer(this);
    this._navEnergy = new NavBarEnergy(this._network);

    this._initDOM();
    this._initTheme();
    this._bindEvents();
    this._initTimers();

    if (this.storage.get('nle_collapsed')) {
      this._toggleCollapse(true);
    }
    requestAnimationFrame(() => {
      this._restorePosition();
    });

    this.fetch();
  }

  /* ─── DOM ─── */

  private _initDOM(): void {
    if (!CURRENT_SITE) return;
    this._el = document.createElement('div');
    this._el.id = 'nle-panel';
    this._el.setAttribute('role', 'complementary');
    this._el.innerHTML = `
      <div class="nle-hdr">
        <div class="nle-hdr-info">
          <img src="${CURRENT_SITE.icon}" alt="NL" class="nle-hdr-logo">
          <div>
            <div class="nle-hdr-title">NodeLoc</div>
            <div class="nle-hdr-ver">v${__APP_VERSION__}</div>
          </div>
        </div>
        <div class="nle-hdr-btns">
          <button id="nle-btn-refresh" title="刷新">🔄</button>
          <button id="nle-btn-theme" title="切换主题">🌓</button>
          <button class="nle-toggle" id="nle-btn-toggle" title="折叠面板">
            <span class="nle-toggle-arrow">◀</span>
            <img class="nle-toggle-logo" src="${CURRENT_SITE.icon}" alt="NL" draggable="false">
          </button>
        </div>
      </div>
      <div class="nle-tab-nav">
        <button class="nle-tab active" data-tab="trust">📊 信任</button>
        <button class="nle-tab" data-tab="leaderboard">🏆 排行</button>
        <button class="nle-tab" data-tab="activity">📋 活动</button>
        <button class="nle-tab" data-tab="follows">👥 关注</button>
      </div>
      <div class="nle-body">
        <div class="nle-section active" id="nle-sec-trust">
          <div class="nle-trust-ring-wrap" id="nle-trustRing"></div>
          <div id="nle-trustBadge" class="nle-trust-level-badge" style="text-align:center">--</div>
          <div id="nle-trustUser" class="nle-trust-user" style="text-align:center"></div>
          <div class="nle-reading-card">
            <div class="nle-reading-today" id="nle-readingToday">0分钟</div>
            <div class="nle-reading-level" id="nle-readingLevel">--</div>
            <div class="nle-reading-active off" id="nle-readingActive">○ 未活动</div>
            <div class="nle-heatmap" id="nle-heatmapGrid"></div>
            <div class="nle-heatmap-labels" id="nle-heatmapLabels"></div>
            <div class="nle-heatmap-bar" id="nle-readingGoalBar" style="display:none"></div>
          </div>
          <div class="nle-req-list" id="nle-reqList"></div>
        </div>
        <div class="nle-section" id="nle-sec-leaderboard">
          <div class="nle-lb-subtabs">
            <button class="nle-lb-subtab active" data-lb-tab="energy">⚡ 能量榜</button>
            <button class="nle-lb-subtab" data-lb-tab="posting">💧 水王榜</button>
          </div>
          <div id="nle-energyLb"></div>
          <div id="nle-postingLb" style="display:none"></div>
        </div>
        <div class="nle-section" id="nle-sec-activity">
          <div class="nle-lb-subtabs">
            <button class="nle-lb-subtab active" data-activity-type="bookmarks">🔖 书签</button>
            <button class="nle-lb-subtab" data-activity-type="notifications">🔔 通知</button>
            <button class="nle-lb-subtab" data-activity-type="all">📋 全部</button>
          </div>
          <div id="nle-activityList"></div>
          <div id="nle-activityMore" style="text-align:center;padding:10px;display:none">
            <button id="nle-activityLoadmore" style="border:1px solid var(--nle-border);background:var(--nle-bg-card);color:var(--nle-txt);padding:4px 16px;border-radius:12px;cursor:pointer;font-size:12px">加载更多</button>
          </div>
        </div>
        <div class="nle-section" id="nle-sec-follows">
          <div class="nle-follow-stats">
            <div class="nle-follow-stat active" data-follow-tab="following">
              <div class="nle-follow-num" id="nle-followingCount">--</div>
              <div class="nle-follow-label">关注</div>
            </div>
            <div class="nle-follow-stat" data-follow-tab="followers">
              <div class="nle-follow-num" id="nle-followersCount">--</div>
              <div class="nle-follow-label">粉丝</div>
            </div>
          </div>
          <div id="nle-followList"></div>
        </div>
      </div>
    `;
    document.body.appendChild(this._el);

    const ids = [
      'trustRing', 'trustBadge', 'trustUser', 'reqList',
      'readingToday', 'readingLevel', 'readingActive',
      'heatmapGrid', 'heatmapLabels', 'readingGoalBar',
      'energyLb', 'postingLb', 'activityList', 'activityMore',
      'followingCount', 'followersCount', 'followList',
    ];
    for (const id of ids) {
      this._els[id] = this._el.querySelector(`#nle-${id}`)!;
    }
  }

  /* ─── Theme ─── */

  private _initTheme(): void {
    const saved = this.storage.get('nle_themeMode', null) as string | null;
    this._applyTheme(saved || 'auto');
  }

  private _applyTheme(mode: string): void {
    this._themeMode = mode;
    this.storage.set('nle_themeMode', mode);
    const isDark = mode === 'auto'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : mode === 'dark';
    document.documentElement.classList.toggle('nle-theme-light', !isDark);
  }

  /* ─── Events ─── */

  private _bindEvents(): void {
    this._el.querySelector('#nle-btn-refresh')!.addEventListener('click', () => this.fetch());
    this._el.querySelector('#nle-btn-theme')!.addEventListener('click', () => {
      const modes = ['auto', 'dark', 'light'];
      const idx = modes.indexOf(this._themeMode);
      this._applyTheme(modes[(idx + 1) % modes.length]);
      const label = this._themeMode === 'auto' ? '跟随系统' : this._themeMode === 'dark' ? '深色' : '浅色';
      this._renderer.showToast(`主题: ${label}`);
    });
    this._el.querySelector('#nle-btn-toggle')!.addEventListener('click', (e) => {
      e.stopPropagation();
      this._toggleCollapse();
    });

    // tabs
    for (const t of this._el.querySelectorAll<HTMLElement>('.nle-tab')) {
      t.addEventListener('click', () => this._switchTab(t.dataset.tab!));
    }

    // leaderboard subtabs
    for (const t of this._el.querySelectorAll<HTMLElement>('.nle-lb-subtab')) {
      t.addEventListener('click', () => {
        const lbType = t.dataset.lbTab!;
        this._activeLbType = lbType;
        for (const b of t.parentElement!.querySelectorAll('.nle-lb-subtab')) b.classList.remove('active');
        t.classList.add('active');
        this._els.energyLb.style.display = lbType === 'energy' ? '' : 'none';
        this._els.postingLb.style.display = lbType === 'posting' ? '' : 'none';
        if (lbType === 'posting' && !this._postingLoaded) this._loadPostingLeaderboard();
      });
    }

    // activity type
    for (const t of this._el.querySelectorAll<HTMLElement>('[data-activity-type]')) {
      t.addEventListener('click', () => {
        for (const b of t.parentElement!.querySelectorAll('[data-activity-type]')) b.classList.remove('active');
        t.classList.add('active');
        this._activityType = t.dataset.activityType!;
        this._activityOffset = 0;
        this._loadActivity();
      });
    }

    this._el.querySelector('#nle-activityLoadmore')!.addEventListener('click', () => this._loadActivity(true));

    // follow tabs
    for (const s of this._el.querySelectorAll<HTMLElement>('.nle-follow-stat')) {
      s.addEventListener('click', () => {
        const tab = s.dataset.followTab!;
        this._activeFollowTab = tab;
        for (const fs of this._el.querySelectorAll('.nle-follow-stat')) fs.classList.remove('active');
        s.classList.add('active');
        this._loadFollowList();
      });
    }

    // system theme
    this._themeMediaListener = (e) => {
      if (this._themeMode === 'auto') {
        document.documentElement.classList.toggle('nle-theme-light', !e.matches);
      }
    };
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', this._themeMediaListener);

    // resize
    this._resizeHandler = Utils.debounce(() => {
      if (this._user && this._reqItems.length > 0) {
        this._renderer.renderTrustLevel(this._user, null, this._reqItems, this._lastPct);
      }
    }, 300);
    window.addEventListener('resize', this._resizeHandler);
    window.addEventListener('orientationchange', this._resizeHandler);

    // drag events
    this._onDragStart = (e) => this._startDrag(e);
    this._onDragMove = (e) => this._updateDrag(e);
    this._onDragEnd = () => this._endDrag();

    this._el.querySelector('.nle-hdr')!.addEventListener('mousedown', (e) => {
      if (!this._el.classList.contains('nle-collapsed')) this._startDrag(e as MouseEvent);
    });
    this._el.addEventListener('mousedown', (e) => {
      if (this._el.classList.contains('nle-collapsed')) this._startDrag(e as MouseEvent);
    });
    document.addEventListener('mousemove', this._onDragMove as (e: Event) => void);
    document.addEventListener('mouseup', this._onDragEnd);

    this._onTouchEnd = () => {
      const wasDragging = this._dragging;
      const isCollapsed = this._el.classList.contains('nle-collapsed');
      this._endDrag();
      if (wasDragging && !this._moved && isCollapsed) this._toggleCollapse();
      if (isCollapsed && wasDragging) {
        this._el.classList.add('no-hover-effect');
        setTimeout(() => this._el.classList.remove('no-hover-effect'), 50);
      }
    };

    this._el.querySelector('.nle-hdr')!.addEventListener('touchstart', (e) => {
      if (!this._el.classList.contains('nle-collapsed')) this._startDrag(e as unknown as MouseEvent);
    }, { passive: false });
    this._el.addEventListener('touchstart', (e) => {
      if (this._el.classList.contains('nle-collapsed')) this._startDrag(e as unknown as MouseEvent);
    }, { passive: false });
    document.addEventListener('touchmove', this._onDragMove as (e: Event) => void, { passive: false });
    document.addEventListener('touchend', this._onTouchEnd);
    document.addEventListener('touchcancel', this._onTouchEnd);
  }

  /* ─── Timers ─── */

  private _initTimers(): void {
    this._refreshTimer = setInterval(() => {
      if (!this._destroyed && TabLeader.isLeader()) this.fetch();
    }, CONFIG.INTERVALS.REFRESH);

    this._readingTimer = setInterval(() => {
      if (!this._destroyed) {
        const mins = this.tracker.getTodayTime();
        this._renderer.renderReading(mins, this.tracker.isActive);
      }
    }, CONFIG.INTERVALS.READING_UPDATE);
  }

  /* ─── Tabs ─── */

  private _switchTab(tab: string): void {
    this._activeTab = tab;
    for (const t of this._el.querySelectorAll<HTMLElement>('.nle-tab')) {
      t.classList.toggle('active', t.dataset.tab === tab);
    }
    for (const s of this._el.querySelectorAll<HTMLElement>('.nle-section')) {
      s.classList.toggle('active', s.id === `nle-sec-${tab}`);
    }
    if (tab === 'leaderboard') this._loadLeaderboard();
    else if (tab === 'activity') this._loadActivity();
    else if (tab === 'follows') this._loadFollows();
  }

  /* ─── Collapse ─── */

  private _toggleCollapse(initCollapsed = false): void {
    if (!initCollapsed) this._collapsed = !this._collapsed;
    else this._collapsed = true;

    this._el.classList.add('no-trans');
    this._el.classList.toggle('nle-collapsed', this._collapsed);
    this.storage.set('nle_collapsed', this._collapsed);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this._el.classList.remove('no-trans');
      });
    });
  }

  /* ─── Drag ─── */

  private _startDrag(e: MouseEvent | TouchEvent): void {
    const isCollapsed = this._el.classList.contains('nle-collapsed');
    if (!isCollapsed && ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('.nle-tab'))) return;

    const getPos = (ev: MouseEvent | TouchEvent) => {
      const tev = ev as TouchEvent;
      if (tev.touches) return { x: tev.touches[0].clientX, y: tev.touches[0].clientY };
      const mev = ev as MouseEvent;
      return { x: mev.clientX, y: mev.clientY };
    };

    const p = getPos(e);
    this._dragging = true;
    this._moved = false;

    const rect = this._el.getBoundingClientRect();
    this._dragStartStyles = {
      left: this._el.style.left,
      right: this._el.style.right,
      top: this._el.style.top,
    };

    this._el.classList.add('no-trans');
    this._el.style.left = rect.left + 'px';
    this._el.style.right = 'auto';
    this._ox = p.x - rect.left;
    this._oy = p.y - rect.top;
    this._sx = p.x;
    this._sy = p.y;
    e.preventDefault();
  }

  private _updateDrag(e: MouseEvent | TouchEvent): void {
    if (!this._dragging) return;

    const tev = e as TouchEvent;
    const p = tev.touches ? { x: tev.touches[0].clientX, y: tev.touches[0].clientY } : { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };

    if (Math.abs(p.x - this._sx) > DRAG_THRESHOLD || Math.abs(p.y - this._sy) > DRAG_THRESHOLD) {
      this._moved = true;
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const margin = 8;
    const w = this._el.offsetWidth;
    const h = this._el.offsetHeight;
    const maxLeft = Math.max(margin, vw - w - margin);
    const maxTop = Math.max(margin, vh - h - margin);

    this._el.style.left = Math.max(margin, Math.min(p.x - this._ox, maxLeft)) + 'px';
    this._el.style.top = Math.max(margin, Math.min(p.y - this._oy, maxTop)) + 'px';
  }

  private _endDrag(): void {
    if (!this._dragging) return;
    this._dragging = false;
    this._el.classList.remove('no-trans');

    if (!this._moved) {
      if (this._dragStartStyles) {
        this._el.style.left = this._dragStartStyles.left;
        this._el.style.right = this._dragStartStyles.right;
        this._el.style.top = this._dragStartStyles.top;
      }
      this._dragStartStyles = null;
      return;
    }
    this._dragStartStyles = null;

    const rect = this._el.getBoundingClientRect();
    const vw = window.innerWidth;
    const centerX = rect.left + rect.width / 2;
    const alignRight = centerX > vw / 2;

    if (alignRight) {
      this._el.style.right = Math.round(vw - rect.right) + 'px';
      this._el.style.left = 'auto';
    }
    this._savePosition();
  }

  private _savePosition(): void {
    const rect = this._el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const centerX = rect.left + rect.width / 2;
    const alignRight = centerX > vw / 2;

    let anchorX: number;
    if (alignRight) {
      anchorX = Math.round(parseFloat(this._el.style.right) || vw - rect.right);
    } else {
      anchorX = Math.round(parseFloat(this._el.style.left) || rect.left);
    }

    this.storage.set('nle_panelPosition', {
      topRatio: vh > 0 ? Math.max(0, Math.min(1, rect.top / vh)) : 0,
      anchorX,
      alignRight,
    });
  }

  private _restorePosition(): void {
    const pos = this.storage.get('nle_panelPosition', null) as { anchorX?: number; alignRight?: boolean; topRatio?: number } | null;
    if (!pos) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const margin = 8;
    const isCollapsed = this._el.classList.contains('nle-collapsed');
    const panelWidth = isCollapsed ? 48 : this._el.offsetWidth;
    const panelHeight = isCollapsed ? 48 : this._el.offsetHeight;

    let anchorX = pos.anchorX || 16;
    const alignRight = pos.alignRight !== false;

    const maxX = Math.max(margin, vw - panelWidth - margin);
    anchorX = Math.max(margin, Math.min(anchorX, maxX));

    if (pos.topRatio !== undefined) {
      const maxTop = Math.max(margin, vh - panelHeight - margin);
      this._el.style.top = Math.max(margin, Math.min(Math.round(pos.topRatio * vh), maxTop)) + 'px';
    }

    if (alignRight) {
      this._el.style.right = anchorX + 'px';
      this._el.style.left = 'auto';
    } else {
      this._el.style.left = anchorX + 'px';
      this._el.style.right = 'auto';
    }
  }

  /* ─── Data Fetching ─── */

  async fetch(): Promise<void> {
    if (this._loading) return;
    this._loading = true;

    const username = this.storage.getUser();
    if (!username) {
      this._showLoginPrompt();
      this._loading = false;
      return;
    }
    this.storage.setUser(username);

    try {
      const [profile, stats] = await Promise.all([
        this._trustParser.fetchUserProfile(username),
        this._trustParser.fetchCurrentStats(username),
      ]);

      if (!profile) {
        this._showLoginPrompt();
        this._loading = false;
        return;
      }

      this._user = profile;
      const reqItems = this._trustParser.buildRequirementItems(stats, profile.trust_level);
      const pct = this._trustParser.getCompletionPercent(reqItems);
      this._reqItems = reqItems;
      this._lastPct = pct;

      this._renderer.renderTrustLevel(profile, stats, reqItems, pct);
      this.tracker.init(username);
      this._notifier.checkMilestones(reqItems);
    } catch (e) {
      console.warn('[NLE] Fetch error:', (e as Error).message);
      this._showError(ErrorFormatter.withIcon(e));
    } finally {
      this._loading = false;
    }
  }

  private async _loadLeaderboard(): Promise<void> {
    try {
      const data = await this._lbFetcher.fetchEnergyLeaderboard();
      this._renderer.renderLeaderboard(data, 'energy');
      this._energyLoaded = true;
    } catch { /* ignore */ }
  }

  private async _loadPostingLeaderboard(): Promise<void> {
    try {
      const data = await this._lbFetcher.fetchPostingLeaderboard();
      this._renderer.renderLeaderboard(data, 'posting');
      this._postingLoaded = true;
    } catch { /* ignore */ }
  }

  private async _loadActivity(loadMore = false): Promise<void> {
    if (!loadMore) this._activityOffset = 0;
    const username = this.storage.getUser();
    if (!username) return;

    const type = this._activityType || 'bookmarks';
    try {
      let items: unknown[] = [];
      let hasMore = false;

      if (type === 'bookmarks') {
        const result = await this._activityFetcher.fetchBookmarks(username, this._activityOffset);
        items = result.bookmarks.map((b: any) => ({
          topic_id: b.topic_id,
          title: b.title || b.name || '书签',
          excerpt: '',
          created_at: b.updated_at,
          action_type: 9,
        }));
        hasMore = result.more;
      } else if (type === 'notifications') {
        items = await this._activityFetcher.fetchNotifications(username);
      } else {
        const result = await this._activityFetcher.fetchActivity(username, this._activityOffset);
        items = result.actions;
        hasMore = result.more;
      }

      if (loadMore) {
        this._activityList = [...this._activityList, ...items];
      } else {
        this._activityList = items;
      }

      this._els.activityList.innerHTML = this._renderer.renderActivity(this._activityList as any);
      this._els.activityMore.style.display = hasMore ? '' : 'none';

      for (const item of this._els.activityList.querySelectorAll<HTMLElement>('.nle-activity-item')) {
        item.addEventListener('click', () => {
          const tid = item.dataset.topicId;
          if (tid && CURRENT_SITE) window.open(`${CURRENT_SITE.origin}/t/topic/${tid}`, '_blank');
        });
      }

      this._activityOffset++;
    } catch { /* ignore */ }
  }

  private async _loadFollows(): Promise<void> {
    const username = this.storage.getUser();
    if (!username) return;

    try {
      const [following, followers] = await Promise.all([
        this._followFetcher.fetchFollowing(username),
        this._followFetcher.fetchFollowers(username),
      ]);

      this._followingList = following;
      this._followersList = followers;

      this._els.followingCount.textContent = String(following.length);
      this._els.followersCount.textContent = String(followers.length);
      this._loadFollowList();
    } catch { /* ignore */ }
  }

  private _loadFollowList(): void {
    const users = this._activeFollowTab === 'following' ? this._followingList : this._followersList;
    this._els.followList.innerHTML = this._renderer.renderFollowList(users || []);

    for (const item of this._els.followList.querySelectorAll<HTMLElement>('.nle-follow-item')) {
      item.addEventListener('click', () => {
        const uname = item.dataset.username;
        if (uname && CURRENT_SITE) window.open(`${CURRENT_SITE.origin}/u/${uname}`, '_blank');
      });
    }
  }

  /* ─── States ─── */

  private _showLoginPrompt(): void {
    this._els.trustRing.innerHTML = '';
    this._els.trustBadge.textContent = '未登录';
    this._els.trustUser.textContent = '';
    this._els.reqList.innerHTML = '<div class="nle-empty">🔒 请先登录 NodeLoc 论坛</div>';
    this._els.readingToday.textContent = '--';
    this._els.readingLevel.textContent = '';
  }

  private _showError(msg: string): void {
    if (this._els.reqList) {
      this._els.reqList.innerHTML = `<div class="nle-empty">${Utils.escapeHtml(msg)}</div>`;
    }
    this._renderer.showToast(msg);
  }

  /* ─── Cleanup ─── */

  destroy(): void {
    if (this._destroyed) return;
    this._destroyed = true;

    if (this._refreshTimer) clearInterval(this._refreshTimer);
    if (this._readingTimer) clearInterval(this._readingTimer);
    this.tracker?.destroy();
    this._navEnergy?.stop();
    this.storage?.flush();

    if (this._resizeHandler?.cancel) this._resizeHandler.cancel();
    window.removeEventListener('resize', this._resizeHandler);
    window.removeEventListener('orientationchange', this._resizeHandler);
    if (this._themeMediaListener) {
      window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', this._themeMediaListener);
    }
    if (this._onDragMove) {
      document.removeEventListener('mousemove', this._onDragMove as (e: Event) => void);
      document.removeEventListener('mouseup', this._onDragEnd);
      document.removeEventListener('touchmove', this._onDragMove as (e: Event) => void);
      document.removeEventListener('touchend', this._onTouchEnd);
      document.removeEventListener('touchcancel', this._onTouchEnd);
    }

    EventBus.clear();
    this._el?.remove();
  }
}
