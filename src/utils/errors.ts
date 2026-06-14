export class NetworkError extends Error {
  code: string;
  status: number;

  constructor(message: string, code = 'UNKNOWN', status = 0) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export const ErrorFormatter = {
  format(e: unknown): string {
    if (e instanceof NetworkError) return e.message;
    if (e instanceof Error) return e.message;
    return '未知错误';
  },

  withIcon(e: unknown): string {
    const msg = this.format(e);
    if (msg.includes('登录')) return '🔒 ' + msg;
    if (msg.includes('频繁')) return '⏳ ' + msg;
    if (msg.includes('超时')) return '⏰ ' + msg;
    return '⚠️ ' + msg;
  },
};
