/**
 * AI 配置管理器
 */

import { Storage } from '../../utils/storage';
import type { AISummaryConfig } from './types';
import { CONFIG_KEY, DEFAULT_MODEL, DEFAULT_API_URL } from './types';

export class AIConfigManager {
  constructor(private _storage: Storage) {}

  get(): AISummaryConfig {
    const defaults: AISummaryConfig = {
      apiUrl: DEFAULT_API_URL,
      apiKey: '',
      model: DEFAULT_MODEL,
      promptBrief: '',
      promptDetailed: '',
    };

    const saved = this._storage.get(CONFIG_KEY, null);
    return saved && typeof saved === 'object' ? { ...defaults, ...(saved as Partial<AISummaryConfig>) } : defaults;
  }

  set(config: AISummaryConfig): void {
    this._storage.setNow(CONFIG_KEY, config);
  }

  reset(): void {
    this._storage.setNow(CONFIG_KEY, {
      apiUrl: DEFAULT_API_URL,
      apiKey: '',
      model: DEFAULT_MODEL,
      promptBrief: '',
      promptDetailed: '',
    });
  }
}
