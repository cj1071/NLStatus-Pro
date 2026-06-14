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
import { AutoEngine } from '../features/autoEngine';
import { Renderer } from './renderer';
import { NavBarEnergy } from './navBarEnergy';

import type { UserProfile, RequirementItem } from '../data/trustLevelParser';
import type { ActivityItem, ActivityPage, ActivityType } from '../data/activityFetcher';
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
  private _autoEngine: AutoEngine;

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
  private _activityType: ActivityType = 'read';
  private _activityOffset = 0;
  private _activityBeforeId: number | null = null;
  private _activityList: ActivityItem[] = [];
  private _activitySearchTerm = '';
  private _activityLoading = false;
  private _activityHasMore = false;
  private _searchTimer: ReturnType<typeof setTimeout> | null = null;
  private _scrollHandler!: () => void;
  private _followingList: FollowUser[] = [];
  private _followersList: FollowUser[] = [];

  /* timers */
  private _refreshTimer: ReturnType<typeof setInterval> | null = null;
  private _readingTimer: ReturnType<typeof setInterval> | null = null;
  private _themeMediaListener!: (e: MediaQueryListEvent) => void;
  private _resizeHandler!: (() => void) & { cancel?: () => void };
  private _settingsOutsideHandler: ((e: MouseEvent) => void) | null = null;

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

  isMounted(): boolean {
    return !!this._el && document.body.contains(this._el);
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
    this._autoEngine = new AutoEngine(this.storage);

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
    this._autoEngine.start();
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
          <button id="nle-btn-settings" title="设置">⚙️</button>
          <button id="nle-btn-theme" title="切换主题">🌓</button>
          <button class="nle-toggle" id="nle-btn-toggle" title="折叠面板">
            <span class="nle-toggle-arrow">◀</span>
            <img class="nle-toggle-logo" src="${CURRENT_SITE.icon}" alt="NL" draggable="false">
          </button>
        </div>
      </div>
      <div class="nle-progress" id="nle-progress"></div>
      <div class="nle-settings" id="nle-settings" style="display:none">
        <div class="nle-settings-title">⚙️ 设置</div>
        <label class="nle-setting-row">
          <span class="nle-setting-label">自动阅读
            <span class="nle-setting-desc">模拟真人滚动浏览当前帖子</span>
          </span>
          <span class="nle-switch"><input type="checkbox" id="nle-set-autoRead"><span class="nle-switch-slider"></span></span>
        </label>
        <label class="nle-setting-row">
          <span class="nle-setting-label">自动点赞
            <span class="nle-setting-desc">浏览时按概率点赞，每小时上限 ${CONFIG.AUTO.LIKE_HOURLY_CAP}</span>
          </span>
          <span class="nle-switch"><input type="checkbox" id="nle-set-autoLike"><span class="nle-switch-slider"></span></span>
        </label>
        <div class="nle-setting-row">
          <span class="nle-setting-label">阅读速度</span>
          <div class="nle-speed-btns">
            <button class="nle-speed-btn" data-speed="slow">慢</button>
            <button class="nle-speed-btn active" data-speed="normal">适中</button>
            <button class="nle-speed-btn" data-speed="fast">快</button>
          </div>
        </div>
        <div class="nle-settings-status" id="nle-autoStatus">未运行</div>
      </div>
      <div class="nle-profile-card" id="nle-profileCard">
        <div class="nle-profile-head">
          <img class="nle-profile-avatar" id="nle-profileAvatar" alt="">
          <div class="nle-profile-main">
            <div class="nle-profile-name" id="nle-profileName">--</div>
            <div class="nle-profile-username" id="nle-profileUsername"></div>
            <div class="nle-profile-meta" id="nle-profileMeta"></div>
          </div>
        </div>
        <div class="nle-profile-actions" id="nle-profileActions">
          <button class="nle-profile-btn" data-action="logout" title="注销登录">⏻ 注销</button>
          <button class="nle-profile-btn" data-action="summary" title="查看个人总结">📊 总结</button>
          <button class="nle-profile-btn" data-action="export" title="导出数据">📤 导出</button>
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
            <button class="nle-lb-subtab active" data-lb-tab="energy">⚡ 财富榜</button>
            <button class="nle-lb-subtab" data-lb-tab="posting">💧 水王榜</button>
          </div>
          <div id="nle-energyLb"></div>
          <div id="nle-postingLb" style="display:none"></div>
        </div>
        <div class="nle-section" id="nle-sec-activity">
          <div class="nle-lb-subtabs nle-activity-subtabs">
            <button class="nle-lb-subtab active" data-activity-type="read">👁️ 已读</button>
            <button class="nle-lb-subtab" data-activity-type="bookmarks">🔖 收藏</button>
            <button class="nle-lb-subtab" data-activity-type="replies">💬 回复</button>
            <button class="nle-lb-subtab" data-activity-type="likes">❤️ 点赞</button>
            <button class="nle-lb-subtab" data-activity-type="topics">✏️ 话题</button>
            <button class="nle-lb-subtab" data-activity-type="reactions">⚡ 互动</button>
            <button class="nle-lb-subtab" data-activity-type="notifications">🔔 通知</button>
          </div>
          <div class="nle-activity-toolbar">
            <div class="nle-activity-search-wrap">
              <span class="nle-activity-search-icon">🔍</span>
              <input type="text" id="nle-activitySearch" class="nle-activity-search-input" placeholder="搜索标题...">
            </div>
            <div class="nle-activity-stats" id="nle-activityStats">已加载 0 条</div>
          </div>
          <div class="nle-activity-scroll" id="nle-activityScroll">
            <div id="nle-activityList"></div>
            <div class="nle-activity-status" id="nle-activityStatus" style="display:none"></div>
            <div class="nle-activity-status nle-activity-end" id="nle-activityEnd" style="display:none">— 没有更多了 —</div>
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
      'progress', 'settings', 'autoStatus',
      'profileCard', 'profileAvatar', 'profileName', 'profileUsername', 'profileMeta', 'profileActions',
      'trustRing', 'trustBadge', 'trustUser', 'reqList',
      'readingToday', 'readingLevel', 'readingActive',
      'heatmapGrid', 'heatmapLabels', 'readingGoalBar',
      'energyLb', 'postingLb',
      'activitySearch', 'activityStats', 'activityScroll', 'activityList', 'activityStatus', 'activityEnd',
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
    this._el.querySelector('#nle-btn-refresh')!.addEventListener('click', () => this.fetch(true));
    this._el.querySelector('#nle-btn-settings')!.addEventListener('click', (e) => {
      e.stopPropagation();
      this._toggleSettings();
    });
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
    for (const t of this._el.querySelectorAll<HTMLElement>('[data-lb-tab]')) {
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
        this._activityType = t.dataset.activityType as ActivityType;
        this._activityOffset = 0;
        this._activityBeforeId = null;
        this._activitySearchTerm = '';
        this._activityHasMore = false;
        if (this._searchTimer) clearTimeout(this._searchTimer);
        (this._els.activitySearch as HTMLInputElement).value = '';
        this._els.activityStats.textContent = '已加载 0 条';
        this._loadActivity();
      });
    }

    // activity search
    this._el.querySelector<HTMLInputElement>('#nle-activitySearch')!.addEventListener('input', () => {
      if (this._searchTimer) clearTimeout(this._searchTimer);
      this._searchTimer = setTimeout(() => {
        this._activitySearchTerm = (this._els.activitySearch as HTMLInputElement).value.trim();
        this._applyActivityFilterAndRender();
        this._updateActivityEndState();
        this._maybeAutoFill();
      }, 600);
    });

    // scroll-to-load more (lazy load) — only the activity list scrolls
    const scrollEl = this._els.activityScroll;
    this._scrollHandler = () => {
      if (this._activitySearchTerm) return;
      if (this._activityLoading) return;
      if (!this._activityHasMore) return;
      if (scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight < 120) {
        this._loadActivity(true);
      }
    };
    scrollEl.addEventListener('scroll', this._scrollHandler, { passive: true });

    // profile action buttons
    for (const b of this._el.querySelectorAll<HTMLElement>('.nle-profile-btn')) {
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        this._handleProfileAction(b.dataset.action!);
      });
    }

    // settings toggles
    const cfg = this._autoEngine.getConfig();
    const readBox = this._el.querySelector<HTMLInputElement>('#nle-set-autoRead')!;
    const likeBox = this._el.querySelector<HTMLInputElement>('#nle-set-autoLike')!;
    readBox.checked = cfg.autoRead;
    likeBox.checked = cfg.autoLike;
    readBox.addEventListener('change', () => this._autoEngine.setConfig({ autoRead: readBox.checked }));
    likeBox.addEventListener('change', () => this._autoEngine.setConfig({ autoLike: likeBox.checked }));

    for (const btn of this._el.querySelectorAll<HTMLElement>('.nle-speed-btn')) {
      btn.classList.toggle('active', btn.dataset.speed === cfg.speed);
      btn.addEventListener('click', () => {
        this._el.querySelectorAll('.nle-speed-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._autoEngine.setConfig({ speed: btn.dataset.speed as 'slow' | 'normal' | 'fast' });
      });
    }

    this._autoEngine.onStatusChange((active) => {
      this._els.autoStatus.textContent = active ? '● 运行中（仅帖子页）' : '○ 未运行';
      this._els.autoStatus.classList.toggle('on', active);
    });

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
      this._applyMaxHeight();
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

    if (!this._collapsed) this._applyMaxHeight();

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
    this._applyMaxHeight();
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
    this._applyMaxHeight();
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

  private _applyMaxHeight(): void {
    if (this._el.classList.contains('nle-collapsed')) return;
    const margin = 12;
    const top = this._el.getBoundingClientRect().top;
    const available = window.innerHeight - top - margin;
    const cap = Math.round(window.innerHeight * 0.6);
    const maxH = Math.max(120, Math.min(available, cap));
    this._el.style.maxHeight = maxH + 'px';
  }

  private _restorePosition(): void {
    const pos = this.storage.get('nle_panelPosition', null) as { anchorX?: number; alignRight?: boolean; topRatio?: number } | null;
    if (!pos) {
      this._applyMaxHeight();
      return;
    }

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

    this._applyMaxHeight();
  }

  /* ─── Data Fetching ─── */

  async fetch(force = false): Promise<void> {
    if (this._loading) return;
    this._loading = true;
    this._showProgress();
    if (force) this._network.clearCache();

    const username = this.storage.getUser();
    if (!username) {
      this._showLoginPrompt();
      this._loading = false;
      this._hideProgress();
      return;
    }
    this.storage.setUser(username);

    try {
      const [profile, officialProgress] = await Promise.all([
        this._trustParser.fetchUserProfile(username),
        this._trustParser.fetchUpgradeProgress(username),
      ]);

      if (!profile) {
        this._showLoginPrompt();
        this._loading = false;
        this._hideProgress();
        return;
      }

      let renderProfile = profile;
      let reqItems: RequirementItem[] = [];
      let pct = 0;

      if (officialProgress) {
        renderProfile = {
          ...profile,
          next_level_name: officialProgress.next_level_name,
          upgrade_message: officialProgress.message,
          leader_upgrade_needed: officialProgress.leader_upgrade_needed,
          max_level_reached: officialProgress.max_level_reached,
        };
        reqItems = this._trustParser.buildOfficialRequirementItems(officialProgress);
        pct = this._trustParser.getCompletionPercent(reqItems);

        const visitItem = reqItems.find(it => it.name.includes('访问'));
        if (visitItem) renderProfile = { ...renderProfile, days_visited: visitItem.current };
      }

      this._user = renderProfile;
      this._reqItems = reqItems;
      this._lastPct = pct;

      this._renderer.renderTrustLevel(renderProfile, null, reqItems, pct);
      this.tracker.init(username);
      this._notifier.checkMilestones(reqItems);
    } catch (e) {
      console.warn('[NLE] Fetch error:', (e as Error).message);
      this._showError(ErrorFormatter.withIcon(e));
    } finally {
      this._loading = false;
      this._hideProgress();
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

  private async _fetchActivityPage(username: string, type: ActivityType): Promise<ActivityPage> {
    if (type === 'read') return this._activityFetcher.fetchRead(this._activityOffset);
    if (type === 'bookmarks') return this._activityFetcher.fetchBookmarks(username, this._activityOffset);
    if (type === 'replies') return this._activityFetcher.fetchReplies(username, this._activityOffset);
    if (type === 'likes') return this._activityFetcher.fetchLikes(username, this._activityOffset);
    if (type === 'topics') return this._activityFetcher.fetchTopics(username, this._activityOffset);
    if (type === 'reactions') return this._activityFetcher.fetchReactions(username, this._activityBeforeId);
    return this._activityFetcher.fetchNotifications(username);
  }

  private async _loadActivity(loadMore = false): Promise<void> {
    if (this._activityLoading) return;

    if (!loadMore) {
      this._activityOffset = 0;
      this._activityBeforeId = null;
    }
    const username = this.storage.getUser();
    if (!username) return;

    const type = this._activityType || 'read';

    this._activityLoading = true;
    if (loadMore) {
      this._els.activityStatus.textContent = '加载中...';
      this._els.activityStatus.style.display = '';
      this._els.activityEnd.style.display = 'none';
    }
    try {
      const result = await this._fetchActivityPage(username, type);
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

      this._applyActivityFilterAndRender();
      this._updateActivityEndState();
    } catch {
      // ignore
    } finally {
      this._activityLoading = false;
      this._els.activityStatus.style.display = 'none';
    }
    this._maybeAutoFill();
  }

  /** 内容不足以滚动时，继续加载下一页直到撑满或无更多 */
  private _maybeAutoFill(): void {
    if (this._activeTab !== 'activity') return;
    if (this._activitySearchTerm) return;
    if (this._activityLoading) return;
    if (!this._activityHasMore) return;
    const scrollEl = this._els.activityScroll;
    if (!scrollEl) return;
    if (scrollEl.scrollHeight - scrollEl.clientHeight < 8) {
      this._loadActivity(true);
    }
  }

  private _applyActivityFilterAndRender(): void {
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
    this._els.activityStats.textContent = statsText;

    const emptyMsg = search && filtered.length === 0
      ? `🔍 未找到"${this._activitySearchTerm}"的相关记录`
      : undefined;
    this._els.activityList.innerHTML = this._renderer.renderActivity(filtered, emptyMsg);

    for (const item of this._els.activityList.querySelectorAll<HTMLElement>('.nle-activity-item')) {
      item.addEventListener('click', () => {
        const url = item.dataset.url;
        if (url) { window.open(url, '_blank'); return; }
        const tid = item.dataset.topicId;
        if (tid && CURRENT_SITE) window.open(`${CURRENT_SITE.origin}/t/topic/${tid}`, '_blank');
      });
    }
  }

  private _updateActivityEndState(): void {
    const hasItems = this._activityList.length > 0;
    const showEnd = !this._activitySearchTerm && hasItems && !this._activityHasMore;
    this._els.activityEnd.style.display = showEnd ? '' : 'none';
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

      this._els.followingCount.textContent = String(this._user?.total_following ?? following.length);
      this._els.followersCount.textContent = String(this._user?.total_followers ?? followers.length);
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

  /* ─── Profile Actions ─── */

  private _handleProfileAction(action: string): void {
    const username = this.storage.getUser();
    if (action === 'summary') {
      if (username && CURRENT_SITE) window.open(`${CURRENT_SITE.origin}/u/${encodeURIComponent(username)}/summary`, '_blank');
      return;
    }
    if (action === 'export') {
      this._renderer.showToast('导出功能开发中');
      return;
    }
    if (action === 'logout') {
      this._logout(username);
      return;
    }
  }

  private _toggleSettings(force?: boolean): void {
    const el = this._els.settings;
    const show = force ?? el.style.display === 'none';
    el.style.display = show ? '' : 'none';
    if (show) {
      if (!this._settingsOutsideHandler) {
        this._settingsOutsideHandler = (e: MouseEvent) => {
          const t = e.target as Node;
          const gear = this._el.querySelector('#nle-btn-settings')!;
          if (!el.contains(t) && !gear.contains(t)) this._toggleSettings(false);
        };
        document.addEventListener('mousedown', this._settingsOutsideHandler);
      }
    } else if (this._settingsOutsideHandler) {
      document.removeEventListener('mousedown', this._settingsOutsideHandler);
      this._settingsOutsideHandler = null;
    }
  }

  private _showProgress(): void {
    this._els.progress.classList.add('active');
  }

  private _hideProgress(): void {
    this._els.progress.classList.remove('active');
  }

  private async _logout(username: string | null): Promise<void> {
    if (!username || !CURRENT_SITE) return;
    if (!window.confirm('确定要注销登录吗？')) return;
    try {
      const csrf = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content || '';
      const resp = await fetch(`${CURRENT_SITE.origin}/session/${encodeURIComponent(username)}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'X-CSRF-Token': csrf,
          'X-Requested-With': 'XMLHttpRequest',
          'Discourse-Logged-In': 'true',
        },
      });
      const data = await resp.json().catch(() => null);
      const redirect = data?.redirect_url || `${CURRENT_SITE.origin}/`;
      window.location.href = redirect;
    } catch {
      this._renderer.showToast('注销失败，请手动退出');
    }
  }

  /* ─── States ─── */

  private _showLoginPrompt(): void {
    this._els.profileCard.style.display = 'none';
    this._els.trustRing.innerHTML = '';
    this._els.trustBadge.textContent = '未登录';
    this._els.trustUser.textContent = '';
    this._els.reqList.innerHTML = `
      <div class="nle-empty">🔒 请先登录 NodeLoc 论坛</div>
      <div style="text-align:center;margin-top:8px">
        <button class="nle-profile-btn" id="nle-btn-login" style="flex:none;padding:6px 24px">⏻ 登录</button>
      </div>
    `;
    this._els.reqList.querySelector('#nle-btn-login')?.addEventListener('click', () => this._login());
    this._els.readingToday.textContent = '--';
    this._els.readingLevel.textContent = '';
  }

  private _login(): void {
    if (!CURRENT_SITE) return;
    const ret = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `${CURRENT_SITE.origin}/login?return_path=${ret}`;
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
    this._autoEngine?.stop();
    this.storage?.flush();

    if (this._resizeHandler?.cancel) this._resizeHandler.cancel();
    window.removeEventListener('resize', this._resizeHandler);
    window.removeEventListener('orientationchange', this._resizeHandler);
    if (this._settingsOutsideHandler) {
      document.removeEventListener('mousedown', this._settingsOutsideHandler);
      this._settingsOutsideHandler = null;
    }
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

    if (this._searchTimer) clearTimeout(this._searchTimer);
    this._els.activityScroll?.removeEventListener('scroll', this._scrollHandler);

    EventBus.clear();
    this._el?.remove();
  }
}
