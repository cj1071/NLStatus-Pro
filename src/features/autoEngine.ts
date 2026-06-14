import { CONFIG } from '../config';
import { CURRENT_SITE } from '../site';
import { Storage } from '../utils/storage';

export interface AutoConfig {
  autoRead: boolean;
  autoLike: boolean;
}

const A = CONFIG.AUTO;

interface LatestTopic {
  id: number;
  title: string;
  slug: string;
  bumped_at: string;
}

/**
 * 自动阅读 / 自动点赞引擎。
 *
 * - 自动阅读：在当前帖子内模拟真人滚动浏览，滚到底后自动跳转到最新未读话题
 * - 自动点赞：浏览时按概率点击原生点赞按钮，带每小时上限
 * - 防重复：已完整阅读过的话题 ID 持久化在 storage，不会再次进入
 * - 防挖坟：只选取 NAVIGATE_MAX_DAYS 天内活跃的帖子
 * - 最低阅读时间：进入话题后至少停留 MIN_READ_SECONDS 秒才允许跳转
 * - 等待内容加载：导航后确认页面有帖子内容才开始滚动
 */
export class AutoEngine {
  private _config: AutoConfig;
  private _running = false;
  private _timer: ReturnType<typeof setTimeout> | null = null;
  private _likeCount = 0;
  private _likeHourStart = Date.now();
  private _onStatus: ((active: boolean) => void) | null = null;
  private _visitedKey = 'auto_visited';
  /** 当前正在阅读的话题 ID */
  private _currentTopicId = 0;
  /** 进入当前话题的时间戳（用于判断最低阅读时长） */
  private _enterTime = 0;

  constructor(private _storage: Storage) {
    this._config = {
      autoRead: !!this._storage.get('nle_autoRead', false),
      autoLike: !!this._storage.get('nle_autoLike', false),
    };
    this._updateTopicId();
  }

  getConfig(): AutoConfig {
    return { ...this._config };
  }

  onStatusChange(cb: (active: boolean) => void): void {
    this._onStatus = cb;
  }

  setConfig(patch: Partial<AutoConfig>): void {
    Object.assign(this._config, patch);
    if (patch.autoRead !== undefined) this._storage.set('nle_autoRead', patch.autoRead);
    if (patch.autoLike !== undefined) this._storage.set('nle_autoLike', patch.autoLike);
    this._evaluate();
  }

  start(): void {
    this._evaluate();
  }

  stop(): void {
    this._armed = false;
    this._pageReady = false;
    if (this._timer) { clearTimeout(this._timer); this._timer = null; }
    this._setRunning(false);
  }

  /* ─── internals ─── */

  private _armed = false;
  /** 当前帖子内容是否已渲染完成 */
  private _pageReady = false;

  private _isTopicPage(): boolean {
    return /\/t\//.test(location.pathname);
  }

  /** 从 URL 提取 topic id，如果发生变化则重置计时 */
  private _updateTopicId(): void {
    const m = location.pathname.match(/\/t\/(?:[^/]+\/)?(\d+)/);
    const newId = m ? parseInt(m[1], 10) : 0;
    if (newId !== this._currentTopicId) {
      this._currentTopicId = newId;
      this._enterTime = Date.now();
      this._pageReady = false;
    }
  }

  /** 判断页面内容是否已加载完成（帖子容器 + 首屏帖子可见） */
  private _checkPageReady(): boolean {
    if (this._pageReady) return true;
    const posts = document.querySelectorAll('.topic-post, .post-stream article');
    if (posts.length > 0) {
      this._pageReady = true;
      return true;
    }
    return false;
  }

  private _enabled(): boolean {
    return this._config.autoRead || this._config.autoLike;
  }

  private _evaluate(): void {
    if (this._enabled()) {
      if (!this._armed) {
        this._armed = true;
        this._updateTopicId();
        // 刚开启且不在帖子页，主动跳转一篇最新话题
        if (!this._isTopicPage() && this._config.autoRead) {
          this._pickTopic().then(topic => {
            if (!this._armed || !topic) return;
            this._timer = setTimeout(() => this._loop(), A.IDLE_RECHECK);
            this._navigateTo(topic);
          });
        } else {
          this._loop();
        }
      }
    } else {
      this.stop();
    }
  }

  private _setRunning(active: boolean): void {
    if (this._running === active) return;
    this._running = active;
    this._onStatus?.(active);
  }

  private _rand(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }

  private _atBottom(): boolean {
    return window.innerHeight + window.scrollY >= document.body.scrollHeight - 6;
  }

  /** 是否已满足最低阅读时长 */
  private _hasReadEnough(): boolean {
    if (!this._enterTime) return false;
    return (Date.now() - this._enterTime) / 1000 >= A.MIN_READ_SECONDS;
  }

  /** 标记当前话题已读完 */
  private _markVisited(topicId: number): void {
    if (!topicId) return;
    const visited = this._getVisited();
    visited.add(topicId);
    this._saveVisited(visited);
  }

  private _getVisited(): Set<number> {
    const raw = this._storage.get(this._visitedKey, []) as number[];
    return new Set(raw);
  }

  private _saveVisited(s: Set<number>): void {
    const arr = Array.from(s).sort((a, b) => b - a).slice(0, 2000);
    this._storage.set(this._visitedKey, arr);
  }

  /** 从 /latest.json 拉取最新话题，选一个未读的 */
  private async _pickTopic(): Promise<LatestTopic | null> {
    if (!CURRENT_SITE) return null;
    try {
      const resp = await fetch(`${CURRENT_SITE.origin}/latest.json`, { credentials: 'include' });
      if (!resp.ok) return null;
      const data = await resp.json() as {
        topic_list?: { topics: Array<{ id: number; title: string; slug: string; bumped_at: string }> };
      };
      const topics = data?.topic_list?.topics;
      if (!topics || topics.length === 0) return null;

      const visited = this._getVisited();
      const cutoff = Date.now() - A.NAVIGATE_MAX_DAYS * 86400000;
      const candidates = topics.filter(t => {
        if (visited.has(t.id)) return false;
        if (t.id === this._currentTopicId) return false;
        const bumped = new Date(t.bumped_at).getTime();
        if (Number.isNaN(bumped) || bumped < cutoff) return false;
        return true;
      });

      if (candidates.length === 0) return null;
      return candidates[Math.floor(Math.random() * candidates.length)];
    } catch {
      return null;
    }
  }

  /** 导航到指定话题 */
  private _navigateTo(topic: LatestTopic): void {
    // 标记旧话题已读
    if (this._currentTopicId && this._currentTopicId !== topic.id) {
      this._markVisited(this._currentTopicId);
    }
    this._currentTopicId = topic.id;
    this._enterTime = Date.now();
    this._pageReady = false;

    const app = (window as any).app;
    if (app?.route?.then) {
      app.route(`/t/${topic.slug}/${topic.id}`);
    } else {
      window.location.href = `${CURRENT_SITE!.origin}/t/${topic.slug}/${topic.id}`;
    }
  }

  private _loop(): void {
    if (!this._armed) return;

    // 检测 topic id 变化（捕获 SPA pushState 导航）
    const prevId = this._currentTopicId;
    this._updateTopicId();
    const topicChanged = prevId !== this._currentTopicId;

    if (!this._isTopicPage()) {
      this._setRunning(false);
      this._timer = setTimeout(() => this._loop(), A.IDLE_RECHECK);
      return;
    }

    // 如果才刚导航过来，等待页面内容加载
    if (topicChanged || !this._checkPageReady()) {
      this._setRunning(false);
      this._timer = setTimeout(() => this._loop(), A.IDLE_RECHECK);
      return;
    }

    this._setRunning(true);

    if (this._config.autoLike) this._tryLike();

    if (this._config.autoRead) {
      if (this._atBottom() && this._hasReadEnough()) {
        // 读完 → 去下一篇
        this._markVisited(this._currentTopicId);
        this._setRunning(false);
        this._pickTopic().then(topic => {
          if (!this._armed) return;
          if (topic) {
            const navDelay = this._rand(A.NAVIGATE_DELAY_MIN, A.NAVIGATE_DELAY_MAX);
            this._timer = setTimeout(() => {
              if (!this._armed) return;
              this._navigateTo(topic);
              // 导航后等页面内容加载完再继续
              this._timer = setTimeout(() => this._loop(), A.BOTTOM_READY_WAIT);
            }, navDelay);
          } else {
            this._timer = setTimeout(() => this._loop(), A.BOTTOM_DELAY_MAX);
          }
        });
        return;
      } else if (this._atBottom() && !this._hasReadEnough()) {
        // 到底但还没读够 → 停在底部继续计时，不定时检测一下
        this._timer = setTimeout(() => this._loop(), 1000);
        return;
      }

      // 正常滚动
      const step = this._rand(A.SCROLL_STEP_MIN, A.SCROLL_STEP_MAX);
      window.scrollBy({ top: step, behavior: 'smooth' });
    }

    let delay = this._rand(A.LOOP_DELAY_MIN, A.LOOP_DELAY_MAX);
    if (this._config.autoRead && Math.random() < A.PAUSE_CHANCE) {
      delay += this._rand(A.PAUSE_EXTRA_MIN, A.PAUSE_EXTRA_MAX);
    }

    this._timer = setTimeout(() => this._loop(), delay);
  }

  private _tryLike(): void {
    if (Date.now() - this._likeHourStart > 3600000) {
      this._likeHourStart = Date.now();
      this._likeCount = 0;
    }
    if (this._likeCount >= A.LIKE_HOURLY_CAP) return;
    if (Math.random() > A.LIKE_PROBABILITY) return;

    const btn = this._findLikeButton();
    if (!btn) return;

    this._likeCount++;
    setTimeout(() => {
      if (this._armed) btn.click();
    }, this._rand(A.LIKE_CLICK_DELAY_MIN, A.LIKE_CLICK_DELAY_MAX));
  }

  private _findLikeButton(): HTMLElement | null {
    const selectors = [
      '.discourse-reactions-reaction-button:not(.reacted)',
      '.post-controls button.like:not(.has-like)',
      '.actions button.like:not(.has-like)',
    ];
    const vh = window.innerHeight;
    for (const sel of selectors) {
      const nodes = document.querySelectorAll<HTMLElement>(sel);
      for (const el of nodes) {
        if (el.getAttribute('aria-disabled') === 'true' || (el as HTMLButtonElement).disabled) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top >= 0 && rect.bottom <= vh && rect.height > 0) return el;
      }
    }
    return null;
  }
}
