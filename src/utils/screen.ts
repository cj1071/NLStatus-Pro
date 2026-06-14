interface PanelConfig {
  width: number;
  fontSize: number;
  ringSize: number;
}

export const Screen = {
  _cache: null as number | null,
  _cacheTime: 0,

  getWidth(): number {
    const now = Date.now();
    if (this._cache !== null && (now - this._cacheTime) < 200) return this._cache;
    this._cache = window.visualViewport?.width || window.innerWidth;
    this._cacheTime = now;
    return this._cache;
  },

  isMobile(): boolean { return this.getWidth() <= 600; },
  isTablet(): boolean { return this.getWidth() <= 900 && this.getWidth() > 600; },

  getPanelConfig(): PanelConfig {
    const w = this.getWidth();
    if (w <= 480) return { width: 260, fontSize: 12, ringSize: 72 };
    if (w <= 768) return { width: 280, fontSize: 13, ringSize: 84 };
    if (w >= 1920) return { width: 340, fontSize: 15, ringSize: 108 };
    return { width: 300, fontSize: 14, ringSize: 92 };
  },
};
