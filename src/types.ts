// GM API type declarations for vite-plugin-monkey
// These are injected by the plugin at build time

declare function GM_xmlhttpRequest(details: GMXHRDetails): void;
declare function GM_setValue(key: string, value: string): void;
declare function GM_getValue(key: string, defaultValue?: string | null): string | null;
declare function GM_addStyle(css: string): HTMLStyleElement;
declare function GM_notification(details: { title: string; text: string; timeout?: number }): void;

interface GMXHRDetails {
  url: string;
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  data?: string;
  timeout?: number;
  onload?: (response: GMXHRResponse) => void;
  onerror?: (error: Error) => void;
}

interface GMXHRResponse {
  status: number;
  responseText: string;
  response: unknown;
}

interface GMInfo {
  script?: {
    version: string;
  };
}

declare const GM_info: GMInfo | undefined;
declare const __APP_VERSION__: string;

interface MonkeyWindow {
  unsafeWindow: Window;
  GM_xmlhttpRequest: typeof GM_xmlhttpRequest;
  GM_setValue: typeof GM_setValue;
  GM_getValue: typeof GM_getValue;
  GM_addStyle: typeof GM_addStyle;
  GM_notification: typeof GM_notification;
}
