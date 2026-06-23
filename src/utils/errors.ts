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

/**
 * 错误处理装饰器
 * 自动捕获异步方法的错误并返回 fallback 值
 * @param fallback 发生错误时返回的默认值
 */
export function handleErrors<T = any>(fallback?: T) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        console.error(`[${target.constructor.name}.${propertyKey}]`, error);
        return fallback;
      }
    };
    return descriptor;
  };
}

