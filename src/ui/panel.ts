import './styles.css';
import { CONFIG } from '../config';
import { EventBus } from '../utils/eventBus';
import { TabLeader } from '../utils/tabLeader';
import { Storage } from '../utils/storage';
import { Network } from '../utils/network';
import { TrustLevelParser } from '../data/trustLevelParser';
import { LeaderboardFetcher } from '../data/leaderboardFetcher';
import { ActivityFetcher } from '../data/activityFetcher';
import { FollowFetcher } from '../data/followFetcher';
import { ReadingTracker } from '../tracking/readingTracker';
import { Notifier } from '../tracking/notifier';
import { Renderer } from './renderer';
import { NavBarEnergy } from './navBarEnergy';
import { createPanelTemplate } from './panelTemplate';
import { PanelChrome } from './panelChrome';
import { ActivityPanel } from './activityPanel';
import { FollowPanel } from './followPanel';
import { LeaderboardPanel } from './leaderboardPanel';
import { ProfileActions } from './profileActions';
import { ThemeController } from './themeController';
import { LoginPrompt } from './loginPrompt';
import { TrustPanel } from './trustPanel';
import { TabController } from './tabController';
import { ResizeController } from './resizeController';

import type { PanelElementMap } from './panelTemplate';

const TRUST_LEVEL_GUIDE_URL = 'https://www.nodeloc.com/t/topic/55183';

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
  private _chrome!: PanelChrome;
  private _activityPanel!: ActivityPanel;
  private _followPanel!: FollowPanel;
  private _leaderboardPanel!: LeaderboardPanel;
  private _profileActions!: ProfileActions;
  private _theme!: ThemeController;
  private _loginPrompt!: LoginPrompt;
  private _trustPanel!: TrustPanel;
  private _tabs!: TabController;
  private _resize!: ResizeController;

  /* DOM */
  private _el!: HTMLElement;
  _els!: PanelElementMap;

  /* state */
  private _destroyed = false;

  /* timers */
  private _refreshTimer: ReturnType<typeof setInterval> | null = null;
  private _readingTimer: ReturnType<typeof setInterval> | null = null;

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

    this._initDOM();
    this._chrome = new PanelChrome({ el: this._el, storage: this.storage });
    this._chrome.init();
    this._activityPanel = new ActivityPanel({
      root: this._el,
      els: this._els,
      storage: this.storage,
      fetcher: this._activityFetcher,
      getActiveTab: () => this._tabs.getActiveTab(),
      renderActivity: (items, emptyMsg) => this._renderer.renderActivity(items, emptyMsg),
    });
    this._activityPanel.init();
    this._followPanel = new FollowPanel({
      root: this._el,
      els: this._els,
      storage: this.storage,
      fetcher: this._followFetcher,
      renderFollowList: (users) => this._renderer.renderFollowList(users),
      bindImageFallbacks: (root) => this._renderer.bindImageFallbacks(root),
    });
    this._followPanel.init();
    this._leaderboardPanel = new LeaderboardPanel({
      root: this._el,
      els: this._els,
      fetcher: this._lbFetcher,
      renderLeaderboard: (data, type) => this._renderer.renderLeaderboard(data, type),
    });
    this._leaderboardPanel.init();
    this._profileActions = new ProfileActions({
      root: this._el,
      storage: this.storage,
      showToast: (msg) => this._renderer.showToast(msg),
    });
    this._profileActions.init();
    this._theme = new ThemeController({
      root: this._el,
      storage: this.storage,
      showToast: (msg) => this._renderer.showToast(msg),
    });
    this._theme.init();
    this._loginPrompt = new LoginPrompt({
      els: this._els,
      storage: this.storage,
      isDestroyed: () => this._destroyed,
      onLoginResolved: () => void this.fetch(true),
    });
    this._trustPanel = new TrustPanel({
      els: this._els,
      storage: this.storage,
      network: this._network,
      parser: this._trustParser,
      tracker: this.tracker,
      notifier: this._notifier,
      loginPrompt: this._loginPrompt,
      renderTrustLevel: (profile, err, reqItems, pct) => this._renderer.renderTrustLevel(profile, err, reqItems, pct),
      setFollowCounts: (following, followers) => this._followPanel.setCounts(following, followers),
      showToast: (msg) => this._renderer.showToast(msg),
    });
    this._tabs = new TabController({
      root: this._el,
      onTabChange: (tab) => this._handleTabChange(tab),
    });
    this._tabs.init();
    this._resize = new ResizeController({
      onResize: () => {
        this._chrome.applyMaxHeight();
        this._trustPanel.rerender();
      },
    });
    this._resize.init();
    this._bindEvents();
    this._initTimers();

    if (this.storage.get('nle_collapsed')) {
      this._chrome.toggleCollapse(true);
    }
    requestAnimationFrame(() => {
      this._chrome.restorePosition();
    });

    this.fetch();
  }

  /* ─── DOM ─── */

  private _initDOM(): void {
    const panel = createPanelTemplate();
    if (!panel) return;
    this._el = panel.el;
    this._els = panel.els;
    document.body.appendChild(this._el);
  }

  /* ─── Events ─── */

  private _bindEvents(): void {
    this._el.querySelector('#nle-btn-refresh')!.addEventListener('click', () => this.fetch(true));
    this._el.querySelector('#nle-btn-toggle')!.addEventListener('click', (e) => {
      e.stopPropagation();
      this._chrome.toggleCollapse();
    });
    this._el.querySelector('#nle-trustGuide')!.addEventListener('click', () => {
      window.open(TRUST_LEVEL_GUIDE_URL, '_blank', 'noopener,noreferrer');
    });
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

  private _handleTabChange(tab: string): void {
    if (tab === 'leaderboard') this._leaderboardPanel.load();
    else if (tab === 'activity') this._activityPanel.load();
    else if (tab === 'follows') this._followPanel.load();
  }

  /* ─── Data Fetching ─── */

  async fetch(force = false): Promise<void> {
    await this._trustPanel.fetch(force);
  }

  /* ─── Cleanup ─── */

  destroy(): void {
    if (this._destroyed) return;
    this._destroyed = true;

    // 清理定时器
    if (this._refreshTimer) clearInterval(this._refreshTimer);
    if (this._readingTimer) clearInterval(this._readingTimer);

    // 清理追踪器和工具
    this.tracker?.destroy();
    this._navEnergy?.stop();
    this._profileActions?.destroy();
    this.storage?.flush();

    // 清理 UI 控制器（顺序重要：chrome 最后）
    this._resize?.destroy();
    this._theme?.destroy();
    this._tabs?.destroy();
    this._followPanel?.destroy();
    this._leaderboardPanel?.destroy();
    this._trustPanel?.destroy();
    this._activityPanel?.destroy();
    this._loginPrompt?.destroy();
    this._chrome?.destroy();

    // 清理全局状态
    EventBus.clear();
    this._el?.remove();
  }
}
