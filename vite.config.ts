import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify('1.0.0'),
  },
  plugins: [
    monkey({
      entry: 'src/main.ts',
      userscript: {
        name: 'NodeLoc Enhance',
        namespace: 'https://www.nodeloc.com/',
        version: '1.0.0',
        description: '信任级别追踪 · 阅读统计 · 能量值显示 · 排行榜 · 我的活动 · 关注粉丝',
        author: 'NL Enhance Team',
        license: 'MIT',
        match: [
          'https://www.nodeloc.com/*',
          'https://nodeloc.com/*',
          'https://nodeloc.cc/*',
        ],
        'run-at': 'document-start',
        grant: [
          'GM_xmlhttpRequest',
          'GM_setValue',
          'GM_getValue',
          'GM_addStyle',
          'GM_notification',
        ],
        connect: [
          'www.nodeloc.com',
          'nodeloc.com',
          'nodeloc.cc',
        ],
        icon: 'data:image/png;base64,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',
      },
    }),
  ],
  build: {
    minify: false, // Greasy Fork 规则不允许混淆/压缩
  },
});
