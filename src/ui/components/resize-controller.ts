import { Utils } from '../../utils/helpers';

interface ResizeControllerOptions {
  onResize: () => void;
}

export class ResizeController {
  private _handler!: (() => void) & { cancel?: () => void };

  constructor(private _options: ResizeControllerOptions) {}

  init(): void {
    this._handler = Utils.debounce(() => this._options.onResize(), 300);
    window.addEventListener('resize', this._handler);
    window.addEventListener('orientationchange', this._handler);
  }

  destroy(): void {
    if (this._handler?.cancel) this._handler.cancel();
    window.removeEventListener('resize', this._handler);
    window.removeEventListener('orientationchange', this._handler);
  }
}
