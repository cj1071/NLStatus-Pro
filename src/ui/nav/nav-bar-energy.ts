import { CONFIG } from '../../config';
import { CURRENT_SITE } from '../../site';
import { Network } from '../../utils/network';
import { Utils } from '../../utils/helpers';

export class NavBarEnergy {
  private _network: Network;
  private _el: HTMLElement | null = null;
  private _valueEl: HTMLElement | null = null;
  private _timer: ReturnType<typeof setInterval> | null = null;

  constructor(network: Network) {
    this._network = network;
  }

  inject(): void {
    const navBar = document.querySelector('ul.d-header-icons');
    if (!navBar || this._el) return;

    const li = document.createElement('li');
    li.id = 'nle-nav-energy';
    li.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
        <path d="M31 4H16L10 27H18L14 44L40 16H28L31 4Z" fill="none" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M21 11L19 19" stroke-width="4" stroke-linecap="round"/>
      </svg>
      <span class="nle-nav-energy-value">--</span>
    `;
    navBar.insertBefore(li, navBar.firstChild);
    this._el = li;
    this._valueEl = li.querySelector('.nle-nav-energy-value');
  }

  async update(): Promise<void> {
    if (!this._valueEl || !CURRENT_SITE) return;
    try {
      const data = await this._network.fetchJSON<any>(
        `${CURRENT_SITE.origin}/leaderboard/2.json`,
        { cacheTtl: 30000 },
      );
      const score = data?.personal?.user?.total_score;
      if (score !== undefined && score !== null) {
        this._valueEl.textContent = Utils.formatNumber(score);
      }
    } catch {
      this._valueEl.textContent = '--';
    }
  }

  startAutoRefresh(): void {
    this.update();
    this._timer = setInterval(() => this.update(), CONFIG.INTERVALS.ENERGY_REFRESH);
  }

  stop(): void {
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
  }
}
