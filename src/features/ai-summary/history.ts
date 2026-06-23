/**
 * 总结历史记录管理器
 */

import { Storage } from '../../utils/storage';
import type { HistoryRecord } from './types';
import { HISTORY_KEY } from './types';

export class SummaryHistoryManager {
  private _history: HistoryRecord[];

  constructor(private _storage: Storage) {
    this._history = this._load();
  }

  getAll(): HistoryRecord[] {
    return this._history;
  }

  add(record: HistoryRecord): void {
    const key = `${record.topicId}_${record.mode}_${record.range.start}_${record.range.end}`;
    const idx = this._history.findIndex(item =>
      `${item.topicId}_${item.mode}_${item.range?.start}_${item.range?.end}` === key
    );

    if (idx >= 0) {
      this._history[idx] = record;
    } else {
      this._history.unshift(record);
    }

    this._history = this._history.slice(0, 100);
    this._save();
  }

  delete(topicId: number, mode?: string, start?: number, end?: number): void {
    if (mode !== undefined && start !== undefined && end !== undefined) {
      const key = `${topicId}_${mode}_${start}_${end}`;
      const idx = this._history.findIndex(item =>
        `${item.topicId}_${item.mode}_${item.range?.start}_${item.range?.end}` === key
      );
      if (idx >= 0) {
        this._history.splice(idx, 1);
        this._save();
      }
    } else {
      this._history = this._history.filter(item => item.topicId !== topicId);
      this._save();
    }
  }

  clear(): void {
    this._history = [];
    this._save();
  }

  private _load(): HistoryRecord[] {
    const saved = this._storage.get(HISTORY_KEY, []);
    return Array.isArray(saved) ? saved.filter(this._isHistoryRecord) : [];
  }

  private _save(): void {
    this._storage.setNow(HISTORY_KEY, this._history);
  }

  private _isHistoryRecord(value: unknown): value is HistoryRecord {
    if (!value || typeof value !== 'object') return false;
    const record = value as Partial<HistoryRecord>;
    return typeof record.topicId === 'number'
      && typeof record.title === 'string'
      && typeof record.summary === 'string'
      && (record.mode === 'brief' || record.mode === 'detailed')
      && typeof record.timestamp === 'number';
  }
}
