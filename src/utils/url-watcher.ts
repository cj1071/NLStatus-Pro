/**
 * URL 变化监听工具
 * 用于 SPA 应用中检测页面导航
 */

export type UrlChangeCallback = (newUrl: string, oldUrl: string) => void;

export class UrlWatcher {
  private _lastUrl: string;
  private _timer: ReturnType<typeof setInterval> | null = null;
  private _callback: UrlChangeCallback;
  private _interval: number;

  /**
   * @param callback URL 变化时的回调函数
   * @param interval 检测间隔（毫秒），默认 800ms
   */
  constructor(callback: UrlChangeCallback, interval = 800) {
    this._lastUrl = location.href;
    this._callback = callback;
    this._interval = interval;
  }

  /**
   * 开始监听 URL 变化
   */
  start(): void {
    if (this._timer) return;

    this._lastUrl = location.href;
    this._timer = setInterval(() => {
      const currentUrl = location.href;
      if (this._lastUrl !== currentUrl) {
        const oldUrl = this._lastUrl;
        this._lastUrl = currentUrl;
        this._callback(currentUrl, oldUrl);
      }
    }, this._interval);
  }

  /**
   * 停止监听
   */
  stop(): void {
    if (!this._timer) return;
    clearInterval(this._timer);
    this._timer = null;
  }

  /**
   * 更新当前记录的 URL（不触发回调）
   * 用于手动同步 URL 状态
   */
  syncUrl(): void {
    this._lastUrl = location.href;
  }

  /**
   * 获取当前记录的 URL
   */
  getLastUrl(): string {
    return this._lastUrl;
  }

  /**
   * 检查是否正在监听
   */
  isWatching(): boolean {
    return this._timer !== null;
  }

  /**
   * 销毁监听器，释放资源
   */
  destroy(): void {
    this.stop();
  }
}
