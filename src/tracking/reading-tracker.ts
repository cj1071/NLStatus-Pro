import { CONFIG } from '../config';
import { Utils } from '../utils/helpers';
import { TabLeader } from '../utils/tabLeader';
import { Storage } from '../utils/storage';

interface DayData {
  totalMinutes: number;
}

interface StoredReading {
  dailyData: Record<string, DayData>;
  monthlyCache: Record<string, number>;
  yearlyCache: Record<string, number>;
}

interface WeekDay {
  date: string;
  label: string;
  day: string;
  minutes: number;
  isToday: boolean;
}

export class ReadingTracker {
  isActive = true;
  private _lastActivity = Date.now();
  private _lastSave = Date.now();
  private _intervals: ReturnType<typeof setInterval>[] = [];
  private _tracking = false;
  private _initialized = false;
  private _yearCache: Map<string, number> | null = null;
  private _yearCacheTime = 0;

  private _activityHandler!: (...args: unknown[]) => void;
  private _highFreqHandler!: (...args: unknown[]) => void;
  private _visibilityHandler!: () => void;
  private _pageShowHandler!: () => void;
  private _pageHideHandler!: () => void;
  private _focusHandler!: () => void;
  private _blurHandler!: () => void;
  private _beforeUnloadHandler!: () => void;

  constructor(private _storage: Storage) {}

  init(username: string): void {
    if (this._initialized) return;
    this._bindEvents();
    this._startTracking();
    this._initialized = true;
    console.log('[NLE] ReadingTracker initialized for:', username || 'anonymous');
  }

  private _bindEvents(): void {
    this._activityHandler = Utils.throttle(() => this._onActivity(), 1000);
    this._highFreqHandler = Utils.throttle(() => this._onActivity(), 3000);

    for (const e of ['mousedown', 'keydown', 'click', 'touchstart', 'pointerdown']) {
      document.addEventListener(e, this._activityHandler, { passive: true, capture: true });
    }
    for (const e of ['mousemove', 'scroll', 'wheel', 'touchmove', 'pointermove']) {
      document.addEventListener(e, this._highFreqHandler, { passive: true, capture: true });
    }

    this._visibilityHandler = () => {
      if (document.hidden) { this.save(); this.isActive = false; }
      else { this._lastActivity = Date.now(); this.isActive = true; }
    };
    document.addEventListener('visibilitychange', this._visibilityHandler);

    this._pageShowHandler = () => { this._lastActivity = Date.now(); this.isActive = true; };
    this._pageHideHandler = () => { this.save(); this.isActive = false; };
    window.addEventListener('pageshow', this._pageShowHandler);
    window.addEventListener('pagehide', this._pageHideHandler);

    this._focusHandler = () => { this._lastActivity = Date.now(); this.isActive = true; };
    this._blurHandler = () => { this.save(); };
    window.addEventListener('focus', this._focusHandler);
    window.addEventListener('blur', this._blurHandler);
    document.addEventListener('focus', this._focusHandler);

    this._beforeUnloadHandler = () => this.save();
    window.addEventListener('beforeunload', this._beforeUnloadHandler);
  }

  private _onActivity(): void {
    if (!this.isActive) this.isActive = true;
    this._lastActivity = Date.now();
  }

  private _startTracking(): void {
    if (this._tracking) return;
    this._tracking = true;
    let lastCheck = Date.now();

    this._intervals.push(
      setInterval(() => {
        const now = Date.now();
        const gap = now - lastCheck;
        if (gap > CONFIG.INTERVALS.READING_TRACK * 3) {
          this.isActive = false;
          this._lastActivity = now;
          this._lastSave = now;
          lastCheck = now;
          return;
        }
        lastCheck = now;
        const idle = now - this._lastActivity;
        if (this.isActive && idle > CONFIG.INTERVALS.READING_IDLE) {
          this.isActive = false;
        }
      }, CONFIG.INTERVALS.READING_TRACK),
      setInterval(() => this.save(), CONFIG.INTERVALS.READING_SAVE),
    );
  }

  save(): void {
    if (!this._storage.getUser()) return;
    const todayKey = Utils.getTodayKey();
    const now = Date.now();
    const elapsed = (now - this._lastSave) / 1000;
    const idle = now - this._lastActivity;

    if (elapsed < 0 || elapsed > 120 || idle < 0) {
      this._lastSave = now;
      this._lastActivity = now;
      this.isActive = false;
      return;
    }

    let toAdd = 0;
    if (elapsed > 0) {
      toAdd = idle <= CONFIG.INTERVALS.READING_IDLE
        ? elapsed
        : Math.max(0, elapsed - (idle - CONFIG.INTERVALS.READING_IDLE) / 1000);
      toAdd = Math.min(toAdd, CONFIG.INTERVALS.READING_SAVE / 1000 * 1.5);
    }

    this._lastSave = now;
    if (!TabLeader.isLeader()) return;

    let stored = this._storage.get('readingTime', null) as StoredReading | null;
    if (!stored?.dailyData) {
      stored = { dailyData: {}, monthlyCache: {}, yearlyCache: {} };
    }

    let today = stored.dailyData[todayKey] || { totalMinutes: 0 };
    const minutes = toAdd / 60;
    if (minutes > 0.05) {
      today.totalMinutes += minutes;
      stored.dailyData[todayKey] = today;
      const d = new Date(todayKey);
      const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const yKey = `${d.getFullYear()}`;
      stored.monthlyCache[mKey] = (stored.monthlyCache[mKey] || 0) + minutes;
      stored.yearlyCache[yKey] = (stored.yearlyCache[yKey] || 0) + minutes;
      this._yearCache = null;
    }

    this._storage.set('readingTime', stored);
  }

  getTodayTime(): number {
    const stored = this._storage.get('readingTime', null) as StoredReading | null;
    const saved = stored?.dailyData?.[Utils.getTodayKey()]?.totalMinutes || 0;
    const now = Date.now();
    const elapsed = (now - this._lastSave) / 1000;
    const idle = now - this._lastActivity;
    let unsaved = 0;
    if (idle <= CONFIG.INTERVALS.READING_IDLE) {
      unsaved = elapsed / 60;
    } else {
      unsaved = Math.max(0, elapsed - (idle - CONFIG.INTERVALS.READING_IDLE) / 1000) / 60;
    }
    return saved + Math.max(0, unsaved);
  }

  getWeekHistory(): WeekDay[] {
    const result: WeekDay[] = [];
    const now = new Date();
    const stored = this._storage.get('readingTime', null) as StoredReading | null;
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toDateString();
      result.push({
        date: key,
        label: Utils.formatDate(d.getTime()),
        day: CONFIG.WEEKDAYS[d.getDay()],
        minutes: i === 0 ? this.getTodayTime() : (stored?.dailyData?.[key]?.totalMinutes || 0),
        isToday: i === 0,
      });
    }
    return result;
  }

  getYearData(): Map<string, number> {
    const now = Date.now();
    if (this._yearCache && (now - this._yearCacheTime) < 5000) return this._yearCache;
    const today = new Date();
    const year = today.getFullYear();
    const stored = this._storage.get('readingTime', null) as StoredReading | null;
    const daily = stored?.dailyData || {};
    const result = new Map<string, number>();
    for (const [key, data] of Object.entries(daily)) {
      if (new Date(key).getFullYear() === year) result.set(key, data.totalMinutes || 0);
    }
    result.set(Utils.getTodayKey(), this.getTodayTime());
    this._yearCache = result;
    this._yearCacheTime = now;
    return result;
  }

  destroy(): void {
    this._intervals.forEach(id => clearInterval(id));
    this._intervals = [];
    this._tracking = false;
    if (this._activityHandler) {
      for (const e of ['mousedown', 'keydown', 'click', 'touchstart', 'pointerdown']) {
        document.removeEventListener(e, this._activityHandler, { passive: true, capture: true } as any);
      }
      for (const e of ['mousemove', 'scroll', 'wheel', 'touchmove', 'pointermove']) {
        document.removeEventListener(e, this._highFreqHandler, { passive: true, capture: true } as any);
      }
    }
    if (this._visibilityHandler) document.removeEventListener('visibilitychange', this._visibilityHandler);
    if (this._pageShowHandler) window.removeEventListener('pageshow', this._pageShowHandler);
    if (this._pageHideHandler) window.removeEventListener('pagehide', this._pageHideHandler);
    if (this._focusHandler) {
      window.removeEventListener('focus', this._focusHandler);
      document.removeEventListener('focus', this._focusHandler);
    }
    if (this._blurHandler) window.removeEventListener('blur', this._blurHandler);
    if (this._beforeUnloadHandler) window.removeEventListener('beforeunload', this._beforeUnloadHandler);
    this.save();
  }
}
