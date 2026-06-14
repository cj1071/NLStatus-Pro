import { Logger } from './logger';
import { EventBus } from './eventBus';

const _id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const _key = 'nle_tab_leader';
let _isLeader = false;
let _heartbeatId: ReturnType<typeof setInterval> | null = null;

function tryBecomeLeader(): void {
  const now = Date.now();
  let current: { id?: string; heartbeat?: number } = {};
  try {
    const raw = localStorage.getItem(_key);
    if (raw) current = JSON.parse(raw);
  } catch { /* ignore */ }

  const isExpired = !current.id || (now - (current.heartbeat || 0)) > 15000;
  const isSelf = current.id === _id;

  if (isExpired || isSelf) {
    const wasLeader = _isLeader;
    _isLeader = true;
    localStorage.setItem(_key, JSON.stringify({ id: _id, heartbeat: now }));
    if (!wasLeader) {
      Logger.log('Tab became leader:', _id);
      EventBus.emit('leader:changed', true);
    }
  } else if (_isLeader) {
    _isLeader = false;
    Logger.log('Tab lost leadership');
    EventBus.emit('leader:changed', false);
  }
}

function heartbeat(): void {
  if (_isLeader) {
    localStorage.setItem(_key, JSON.stringify({ id: _id, heartbeat: Date.now() }));
  }
}

function onUnload(): void {
  if (_isLeader) localStorage.removeItem(_key);
  if (_heartbeatId !== null) clearInterval(_heartbeatId);
}

export const TabLeader = {
  init() {
    tryBecomeLeader();
    _heartbeatId = setInterval(heartbeat, 5000);
    window.addEventListener('beforeunload', onUnload);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) tryBecomeLeader();
    });
    window.addEventListener('storage', (e) => {
      if (e.key === _key) tryBecomeLeader();
    });
    return this;
  },

  isLeader(): boolean { return _isLeader; },
};
