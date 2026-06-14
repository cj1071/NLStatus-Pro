import { CONFIG } from '../config';
import { PATTERNS } from '../config';
import { Utils } from './helpers';

export class Storage {
  private _user: string | null = null;
  private _keyCache = new Map<string, { v: unknown; _t: number }>();
  private _writeQueue = new Map<string, unknown>();
  private _flushTimer: ReturnType<typeof setTimeout> | null = null;

  private _globalKey(key: string): string {
    return `nle_${key}`;
  }

  private _userKey(key: string): string {
    const user = this.getUser();
    return user ? `nle_u_${user}_${key}` : this._globalKey(key);
  }

  get(key: string, defaultVal: unknown = null): unknown {
    const k = this._userKey(key);
    if (this._keyCache.has(k) && (Date.now() - this._keyCache.get(k)!._t) < CONFIG.CACHE.VALUE_TTL) {
      return this._keyCache.get(k)!.v;
    }
    const raw = GM_getValue(k, null);
    if (raw === null) return defaultVal;
    try {
      const parsed = JSON.parse(raw);
      this._keyCache.set(k, { v: parsed, _t: Date.now() });
      return parsed;
    } catch {
      return raw;
    }
  }

  set(key: string, value: unknown): void {
    const k = this._userKey(key);
    this._keyCache.set(k, { v: value, _t: Date.now() });
    this._writeQueue.set(k, value);
    this._scheduleFlush();
  }

  setNow(key: string, value: unknown): void {
    this.set(key, value);
    this._flushNow();
  }

  private _scheduleFlush(): void {
    if (this._flushTimer) return;
    this._flushTimer = setTimeout(() => this._flushNow(), 1000);
  }

  private _flushNow(): void {
    if (this._flushTimer) { clearTimeout(this._flushTimer); this._flushTimer = null; }
    this._writeQueue.forEach((value, key) => {
      try {
        GM_setValue(key, typeof value === 'string' ? value : JSON.stringify(value));
      } catch (e) { console.warn('[NLE] Storage flush error:', e); }
    });
    this._writeQueue.clear();
  }

  flush(): void { this._flushNow(); }

  private _normalizeUsername(username: string | null): string | null {
    if (typeof username !== 'string') return null;
    const cleaned = username.trim();
    if (!cleaned || cleaned.length > 60) return null;
    if (/[<>"'&]/.test(cleaned)) return null;
    return cleaned;
  }

  private _getUserFromDom(): string | null {
    const selectors = [
      '.current-user a[href^="/u/"]',
      '.d-header-icons .current-user a[href^="/u/"]',
      '.header-dropdown-toggle.current-user[href^="/u/"]',
      '.user-menu-wrapper a[href^="/u/"]',
      '.d-header .user-menu button[data-user-card]',
      '[data-user-card]',
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (!el) continue;
      const card = el.getAttribute('data-user-card');
      const name = this._normalizeUsername(card);
      if (name) return name;
      const href = el.getAttribute('href') || '';
      const match = href.match(PATTERNS.USERNAME);
      const fromHref = this._normalizeUsername(match?.[1] || '');
      if (fromHref) return fromHref;
    }
    return null;
  }

  private _getUserFromDiscourse(): string | null {
    return this._normalizeUsername(
      Utils.safeCall(() => (window as any).Discourse?.User?.current?.()?.username, null)
    );
  }

  private _isAnon(): boolean {
    const cls = document.documentElement.classList || (document.body?.classList);
    return cls?.contains('anon') ?? false;
  }

  getUser(): string | null {
    const live = this._getUserFromDom() || this._getUserFromDiscourse();
    if (live) { this._user = live; return live; }
    if (this._isAnon()) { this._user = null; return null; }
    const cached = this._normalizeUsername(GM_getValue(this._globalKey('currentUser'), null));
    this._user = cached;
    return cached;
  }

  setUser(username: string): void {
    const name = this._normalizeUsername(username);
    this._user = name;
    if (name) GM_setValue(this._globalKey('currentUser'), name);
  }
}
