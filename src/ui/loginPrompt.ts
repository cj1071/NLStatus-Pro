import { CURRENT_SITE } from '../site';
import { Storage } from '../utils/storage';
import type { PanelElementMap } from './panelTemplate';

interface LoginPromptOptions {
  els: PanelElementMap;
  storage: Storage;
  isDestroyed: () => boolean;
  onLoginResolved: () => void;
}

export class LoginPrompt {
  private _retryTimer: ReturnType<typeof setTimeout> | null = null;
  private _retryCount = 0;

  constructor(private _options: LoginPromptOptions) {}

  show(): void {
    this._options.els.profileCard.style.display = 'none';
    this._options.els.trustRing.innerHTML = '';
    this._options.els.trustBadge.textContent = '未登录';
    this._options.els.trustUser.textContent = '';
    this._options.els.reqList.innerHTML = `
      <div class="nle-empty">🔒 请先登录 NodeLoc 论坛</div>
      <div style="text-align:center;margin-top:8px">
        <button class="nle-profile-btn" id="nle-btn-login" style="flex:none;padding:6px 24px">⏻ 登录</button>
      </div>
    `;
    this._options.els.reqList.querySelector('#nle-btn-login')?.addEventListener('click', () => this._login());
    this._options.els.readingToday.textContent = '--';
    this._options.els.readingLevel.textContent = '';
  }

  scheduleRetry(): void {
    if (this._options.isDestroyed() || this._retryTimer) return;
    if (this._retryCount >= 8) return;

    const delay = 500 + this._retryCount * 500;
    this._retryTimer = setTimeout(async () => {
      this._retryTimer = null;
      if (this._options.isDestroyed()) return;

      const username = await this._options.storage.resolveUser();
      if (username) {
        this._retryCount = 0;
        this._options.onLoginResolved();
        return;
      }

      this._retryCount++;
      this.scheduleRetry();
    }, delay);
  }

  clear(): void {
    this._retryCount = 0;
    if (!this._retryTimer) return;
    clearTimeout(this._retryTimer);
    this._retryTimer = null;
  }

  destroy(): void {
    this.clear();
  }

  private _login(): void {
    if (!CURRENT_SITE) return;
    const ret = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `${CURRENT_SITE.origin}/login?return_path=${ret}`;
  }
}
