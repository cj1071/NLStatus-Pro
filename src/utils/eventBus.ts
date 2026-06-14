type Listener = (...args: unknown[]) => void;

const _listeners: Record<string, Listener[]> = {};

export const EventBus = {
  on(event: string, fn: Listener): () => void {
    (_listeners[event] = _listeners[event] || []).push(fn);
    return () => this.off(event, fn);
  },

  off(event: string, fn: Listener): void {
    const list = _listeners[event];
    if (list) {
      const i = list.indexOf(fn);
      if (i >= 0) list.splice(i, 1);
    }
  },

  emit(event: string, ...args: unknown[]): void {
    const list = _listeners[event];
    if (list) {
      list.slice().forEach(fn => {
        try { fn(...args); } catch (e) { console.warn('[NLE] EventBus error:', e); }
      });
    }
  },

  clear(): void { for (const k of Object.keys(_listeners)) delete _listeners[k]; },
};
