import { CONFIG } from '../config';
import { PATTERNS } from '../config';
import { CURRENT_SITE } from '../site';
import { Utils } from './helpers';

// GM API fallback for dev mode (vite dev server runs ESM without Tampermonkey sandbox)
const _getValue = typeof GM_getValue === 'function'
  ? (k: string, d: string | null = null): string | null => GM_getValue(k, d)
  : (k: string, d: string | null = null): string | null => localStorage.getItem(k) ?? d;

const _setValue = typeof GM_setValue === 'function'
  ? (k: string, v: string): void => { GM_setValue(k, v); }
  : (k: string, v: string): void => { localStorage.setItem(k, v); };

interface CurrentSessionResponse {
  current_user?: {
    username?: string;
    username_lower?: string;
  } | null;
  user?: {
    username?: string;
  } | null;
  username?: string;
}

export class Storage {
  private _user: string | null = null;
  private _userResolved = false;
  private _sessionUserPromise: Promise<string | null> | null = null;
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
    const raw = _getValue(k, null);
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
        _setValue(key, typeof value === 'string' ? value : JSON.stringify(value));
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

  private _getUserFromDiscourse(): string | null {
    return this._normalizeUsername(
      Utils.safeCall(() => (window as any).Discourse?.User?.current?.()?.username, null)
    );
  }

  private _getUserFromDom(): string | null {
    // 仅从 header 区域匹配当前登录用户，避免匹配到帖子中的其他用户
    const headerSelectors = [
      '.d-header .current-user a[href^="/u/"]',
      '.d-header .header-dropdown-toggle.current-user[href^="/u/"]',
      '.d-header .user-menu button[data-user-card]',
      '.d-header .user-menu-wrapper a[href^="/u/"]',
      '.d-header .h-user-wrapper a[href^="/u/"]',
    ];
    for (const sel of headerSelectors) {
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

  private _isAnon(): boolean {
    const cls = document.documentElement.classList;
    return cls?.contains('anon') ?? false;
  }

  private _getLiveUser(): string | null {
    return this._getUserFromDiscourse() || this._getUserFromDom();
  }

  private _setResolvedUser(username: string): string {
    this._user = username;
    this._userResolved = true;
    _setValue(this._globalKey('currentUser'), username);
    return username;
  }

  private async _getUserFromSession(): Promise<string | null> {
    if (!CURRENT_SITE) return null;
    if (this._sessionUserPromise) return this._sessionUserPromise;

    this._sessionUserPromise = (async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      try {
        const resp = await fetch(`${CURRENT_SITE.origin}/session/current.json`, {
          credentials: 'include',
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'Discourse-Present': 'true',
          },
        });
        if (!resp.ok) return null;
        const data = await resp.json() as CurrentSessionResponse;
        return this._normalizeUsername(
          data.current_user?.username
          || data.current_user?.username_lower
          || data.user?.username
          || data.username
          || null
        );
      } catch {
        return null;
      } finally {
        clearTimeout(timer);
        this._sessionUserPromise = null;
      }
    })();

    return this._sessionUserPromise;
  }

  getUser(): string | null {
    if (this._userResolved) return this._user;
    const live = this._getLiveUser();
    if (live) return this._setResolvedUser(live);
    if (this._isAnon()) {
      this._user = null;
      return null;
    }
    const cached = this._normalizeUsername(_getValue(this._globalKey('currentUser'), null));
    if (cached) { this._user = cached; return cached; }
    this._user = null;
    return null;
  }

  async resolveUser(): Promise<string | null> {
    if (this._userResolved && this._user) return this._user;

    const live = this._getLiveUser();
    if (live) return this._setResolvedUser(live);

    const sessionUser = await this._getUserFromSession();
    if (sessionUser) return this._setResolvedUser(sessionUser);

    if (this._isAnon()) {
      this._user = null;
      this._userResolved = false;
      return null;
    }

    const cached = this._normalizeUsername(_getValue(this._globalKey('currentUser'), null));
    if (cached) {
      this._user = cached;
      return cached;
    }

    this._user = null;
    this._userResolved = false;
    return null;
  }

  setUser(username: string): void {
    const name = this._normalizeUsername(username);
    if (name) this._setResolvedUser(name);
  }
}
