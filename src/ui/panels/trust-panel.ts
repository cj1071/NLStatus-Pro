import { Utils } from '../../utils/helpers';
import { Storage } from '../../utils/storage';
import { Network } from '../../utils/network';
import { TrustLevelParser } from '../../data/trust-level/parser';
import { ReadingTracker } from '../../tracking/reading-tracker';
import { Notifier } from '../../tracking/notifier';
import { LoginPrompt } from '../components/login-prompt';
import type { RequirementItem, UserProfile } from '../../data/trust-level/parser';
import type { PanelElementMap } from '../panel/template';

interface TrustPanelOptions {
  els: PanelElementMap;
  storage: Storage;
  network: Network;
  parser: TrustLevelParser;
  tracker: ReadingTracker;
  notifier: Notifier;
  loginPrompt: LoginPrompt;
  renderTrustLevel: (profile: UserProfile, err: string | null, reqItems: RequirementItem[], pct: number) => void;
  setFollowCounts: (following: number | null | undefined, followers: number | null | undefined) => void;
  showToast: (msg: string) => void;
}

export class TrustPanel {
  private _loading = false;
  private _user: UserProfile | null = null;
  private _reqItems: RequirementItem[] = [];
  private _lastPct = 0;

  constructor(private _options: TrustPanelOptions) {}

  async fetch(force = false): Promise<void> {
    if (this._loading) return;
    this._loading = true;
    this._showProgress();
    if (force) this._options.network.clearCache();

    const username = await this._options.storage.resolveUser();
    if (!username) {
      this._options.loginPrompt.show();
      this._options.loginPrompt.scheduleRetry();
      this._loading = false;
      this._hideProgress();
      return;
    }
    this._options.loginPrompt.clear();
    this._options.storage.setUser(username);

    try {
      const [profile, officialProgress] = await Promise.all([
        this._options.parser.fetchUserProfile(username),
        this._options.parser.fetchUpgradeProgress(username),
      ]);

      if (!profile) {
        this._options.loginPrompt.show();
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
        reqItems = this._options.parser.buildOfficialRequirementItems(officialProgress);
        pct = this._options.parser.getCompletionPercent(reqItems);

        const visitItem = reqItems.find(it => it.name.includes('访问'));
        if (visitItem) renderProfile = { ...renderProfile, days_visited: visitItem.current };
      }

      this._user = renderProfile;
      this._reqItems = reqItems;
      this._lastPct = pct;
      this._options.setFollowCounts(renderProfile.total_following, renderProfile.total_followers);

      this._options.renderTrustLevel(renderProfile, null, reqItems, pct);
      this._options.tracker.init(username);
      this._options.notifier.checkMilestones(reqItems);
    } catch (e) {
      console.warn('[NLE] Fetch error:', (e as Error).message);
      this._showError(Utils.formatErrorWithIcon(e));
    } finally {
      this._loading = false;
      this._hideProgress();
    }
  }

  rerender(): void {
    if (this._user && this._reqItems.length > 0) {
      this._options.renderTrustLevel(this._user, null, this._reqItems, this._lastPct);
    }
  }

  private _showProgress(): void {
    this._options.els.progress.classList.add('active');
  }

  private _hideProgress(): void {
    this._options.els.progress.classList.remove('active');
  }

  private _showError(msg: string): void {
    if (this._options.els.reqList) {
      this._options.els.reqList.innerHTML = `<div class="nle-empty">${Utils.escapeHtml(msg)}</div>`;
    }
    this._options.showToast(msg);
  }

  destroy(): void {
    // 事件监听器绑定在 _options.root 内的元素上
    // 当 root 被移除时会自动清理
    // 此方法用于保持一致性和未来扩展
  }
}
