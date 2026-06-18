import { Storage } from '../utils/storage';

type ThemeMode = 'auto' | 'dark' | 'light';

interface ThemeControllerOptions {
  root: HTMLElement;
  storage: Storage;
  showToast: (msg: string) => void;
}

export class ThemeController {
  private _mode: ThemeMode = 'auto';
  private _mediaListener!: (e: MediaQueryListEvent) => void;

  constructor(private _options: ThemeControllerOptions) {}

  init(): void {
    const saved = this._options.storage.get('nle_themeMode', null) as ThemeMode | null;
    this._applyTheme(saved || 'auto');

    this._options.root.querySelector('#nle-btn-theme')!.addEventListener('click', () => {
      const modes: ThemeMode[] = ['auto', 'dark', 'light'];
      const idx = modes.indexOf(this._mode);
      this._applyTheme(modes[(idx + 1) % modes.length]);
      const label = this._mode === 'auto' ? '跟随系统' : this._mode === 'dark' ? '深色' : '浅色';
      this._options.showToast(`主题: ${label}`);
    });

    this._mediaListener = (e) => {
      if (this._mode === 'auto') {
        document.documentElement.classList.toggle('nle-theme-light', !e.matches);
      }
    };
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', this._mediaListener);
  }

  destroy(): void {
    if (!this._mediaListener) return;
    window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', this._mediaListener);
  }

  private _applyTheme(mode: ThemeMode): void {
    this._mode = mode;
    this._options.storage.set('nle_themeMode', mode);
    const isDark = mode === 'auto'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : mode === 'dark';
    document.documentElement.classList.toggle('nle-theme-light', !isDark);
  }
}
