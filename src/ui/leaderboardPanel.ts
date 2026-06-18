import { LeaderboardFetcher } from '../data/leaderboardFetcher';
import type { LeaderboardData, PostingPeriod, PostingType } from '../data/leaderboardFetcher';
import type { PanelElementMap } from './panelTemplate';

type LeaderboardType = 'energy' | PostingType;

interface LeaderboardPanelOptions {
  root: HTMLElement;
  els: PanelElementMap;
  fetcher: LeaderboardFetcher;
  renderLeaderboard: (data: LeaderboardData, type: LeaderboardType) => void;
}

export class LeaderboardPanel {
  private _activeType: LeaderboardType = 'energy';
  private _postersPeriod: PostingPeriod = 'current_month';
  private _topicsPeriod: PostingPeriod = 'current_month';
  private _energyLoaded = false;
  private _postersLoaded = false;
  private _topicsLoaded = false;

  constructor(private _options: LeaderboardPanelOptions) {}

  init(): void {
    for (const t of this._options.root.querySelectorAll<HTMLElement>('[data-lb-tab]')) {
      t.addEventListener('click', () => {
        const lbType = t.dataset.lbTab as LeaderboardType;
        this._activeType = lbType;
        for (const b of t.parentElement!.querySelectorAll('.nle-lb-subtab')) b.classList.remove('active');
        t.classList.add('active');

        this._options.els.energyLb.style.display = lbType === 'energy' ? '' : 'none';
        this._options.els.postersLb.style.display = lbType === 'posters' ? '' : 'none';
        this._options.els.topicsLb.style.display = lbType === 'topics' ? '' : 'none';
        this._options.els.postingFilters.style.display = lbType !== 'energy' ? '' : 'none';

        if (lbType !== 'energy') {
          this._syncPeriodButtons(lbType === 'posters' ? this._postersPeriod : this._topicsPeriod);
        }

        if (lbType === 'energy' && !this._energyLoaded) this.load();
        if (lbType === 'posters' && !this._postersLoaded) this._loadPostingLeaderboard('posters');
        if (lbType === 'topics' && !this._topicsLoaded) this._loadPostingLeaderboard('topics');
      });
    }

    for (const t of this._options.root.querySelectorAll<HTMLElement>('[data-posting-period]')) {
      t.addEventListener('click', () => {
        const period = t.dataset.postingPeriod as PostingPeriod;
        if (this._activeType === 'posters') this._postersPeriod = period;
        else if (this._activeType === 'topics') this._topicsPeriod = period;

        for (const b of t.parentElement!.querySelectorAll('.nle-lb-subtab')) b.classList.remove('active');
        t.classList.add('active');

        if (this._activeType === 'posters') this._loadPostingLeaderboard('posters');
        if (this._activeType === 'topics') this._loadPostingLeaderboard('topics');
      });
    }
  }

  async load(): Promise<void> {
    try {
      const data = await this._options.fetcher.fetchEnergyLeaderboard();
      this._options.renderLeaderboard(data, 'energy');
      this._energyLoaded = true;
    } catch {
      // ignore
    }
  }

  private async _loadPostingLeaderboard(type: PostingType): Promise<void> {
    try {
      const period = type === 'posters' ? this._postersPeriod : this._topicsPeriod;
      const data = await this._options.fetcher.fetchPostingLeaderboard(type, period);
      this._options.renderLeaderboard(data, type);
      if (type === 'posters') this._postersLoaded = true;
      else this._topicsLoaded = true;
    } catch {
      // ignore
    }
  }

  private _syncPeriodButtons(period: PostingPeriod): void {
    for (const b of this._options.els.postingFilters.querySelectorAll<HTMLElement>('[data-posting-period]')) {
      b.classList.toggle('active', b.dataset.postingPeriod === period);
    }
  }
}
