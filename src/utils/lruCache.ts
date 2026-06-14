import { CONFIG } from '../config';

export class LRUCache<T> {
  private _max: number;
  private _m = new Map<string, T>();

  constructor(max = CONFIG.CACHE.LRU_SIZE) {
    this._max = max;
  }

  get(k: string): T | undefined {
    if (!this._m.has(k)) return undefined;
    const v = this._m.get(k)!;
    this._m.delete(k);
    this._m.set(k, v);
    return v;
  }

  set(k: string, v: T): void {
    if (this._m.has(k)) this._m.delete(k);
    else if (this._m.size >= this._max) {
      const first = this._m.keys().next().value;
      if (first !== undefined) this._m.delete(first);
    }
    this._m.set(k, v);
  }

  has(k: string): boolean { return this._m.has(k); }
  clear(): void { this._m.clear(); }
}
