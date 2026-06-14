const _enabled = false;
const _prefix = '[NLE]';

export const Logger = {
  enable() { /* _enabled = true */ },
  disable() { /* _enabled = false */ },
  log(...args: unknown[]) { if (_enabled) console.log(_prefix, ...args); },
  warn(...args: unknown[]) { console.warn(_prefix, ...args); },
  error(...args: unknown[]) { console.error(_prefix, ...args); },
};
