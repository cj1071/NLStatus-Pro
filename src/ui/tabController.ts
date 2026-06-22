interface TabControllerOptions {
  root: HTMLElement;
  onTabChange: (tab: string) => void;
}

export class TabController {
  private _activeTab = 'trust';

  constructor(private _options: TabControllerOptions) {}

  init(): void {
    for (const t of this._options.root.querySelectorAll<HTMLElement>('.nle-tab')) {
      t.addEventListener('click', () => this.switchTo(t.dataset.tab!));
    }
  }

  getActiveTab(): string {
    return this._activeTab;
  }

  switchTo(tab: string): void {
    this._activeTab = tab;
    for (const t of this._options.root.querySelectorAll<HTMLElement>('.nle-tab')) {
      t.classList.toggle('active', t.dataset.tab === tab);
    }
    for (const s of this._options.root.querySelectorAll<HTMLElement>('.nle-section')) {
      s.classList.toggle('active', s.id === `nle-sec-${tab}`);
    }
    this._options.onTabChange(tab);
  }

  destroy(): void {
    // 事件监听器绑定在 _options.root 内的元素上
    // 当 root 被移除时会自动清理
    // 此方法用于保持一致性和未来扩展
  }
}
