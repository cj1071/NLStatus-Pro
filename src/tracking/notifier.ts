import { Storage } from '../utils/storage';

interface Milestones {
  [key: string]: number;
}

export class Notifier {
  constructor(private _storage: Storage) {}

  checkMilestones(reqs: Array<{ key: string; isSuccess: boolean; name: string; current: number }>): void {
    const achieved = this._storage.get('nle_milestones', {}) as Milestones;
    let changed = false;
    for (const r of reqs) {
      if (r.isSuccess && !achieved[r.key]) {
        achieved[r.key] = Date.now();
        changed = true;
        this._notify(`恭喜！「${r.name}」已达标`, `你的${r.name}已经达到${r.current}，满足升级要求`);
      }
    }
    if (changed) this._storage.set('nle_milestones', achieved);
  }

  private _notify(title: string, body: string): void {
    try {
      if (typeof GM_notification === 'function') {
        GM_notification({ title, text: body, timeout: 5000 });
      }
    } catch { /* ignore */ }
  }
}
