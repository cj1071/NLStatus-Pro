/**
 * AI 总结生成器
 */

import { Network } from '../../utils/network';
import { Utils } from '../../utils/helpers';
import type { ChatMessage, TopicInfo, AISummaryConfig } from './types';

export class AISummaryGenerator {
  private static _cleanCookedRegex = {
    lightbox: /<div class="lightbox-wrapper">\s*<a class="lightbox" href="([^"]+)"(?:\s+data-download-href="([^"]+)")?[^>]*title="([^"]*)"[^>]*>[\s\S]*?<\/a>\s*<\/div>/gi,
    attachment: /<a class="attachment" href="([^"]+)"[^>]*>([^<]+)<\/a>/gi,
    emoji: /<img[^>]+class="emoji[^>]*alt="([^"]*)"[^>]*>/gi,
    quote: /<aside class="quote(?:-modified)?[^>]*>[\s\S]*?<blockquote>([\s\S]*?)<\/blockquote>[\s\S]*?<\/aside>/gi,
    br: /<br\s*\/?>/gi,
    closingTags: /<\/p>|<\/li>|<\/div>/gi,
    allTags: /<[^>]+>/g,
    trailingSpaces: /[ \t]+\n/g,
    multipleNewlines: /\n{3,}/g,
    multipleSpaces: /[ \t]{2,}/g,
  };

  constructor(private _config: AISummaryConfig) {}

  async fetchTopicContent(
    topicId: number,
    start: number,
    end: number,
    signal: AbortSignal,
    progress: (text: string) => void,
  ): Promise<string> {
    progress('正在获取帖子列表...');
    const idData = await Network.fetchJSONDirect<{ post_ids?: number[] }>(
      `/t/${topicId}/post_ids.json?post_number=0&limit=99999`,
      signal,
    );
    const ids = [...(idData.post_ids || [])].slice(start - 1, end);

    if (start <= 1) {
      const topicData = await Network.fetchJSONDirect<any>(`/t/${topicId}.json`, signal);
      const firstId = Utils.toSafeInt(topicData?.post_stream?.posts?.[0]?.id, 0);
      if (firstId && !ids.includes(firstId)) ids.unshift(firstId);
    }

    if (!ids.length) throw new Error('没有找到帖子内容');

    const chunks: string[] = [];
    const totalBatches = Math.ceil(ids.length / 200);

    for (let i = 0; i < ids.length; i += 200) {
      if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
      const batchIndex = Math.floor(i / 200) + 1;
      progress(`正在获取帖子内容 (${batchIndex}/${totalBatches})...`);

      const batch = ids.slice(i, i + 200);
      const query = batch.map(id => `post_ids[]=${encodeURIComponent(String(id))}`).join('&');
      const data = await Network.fetchJSONDirect<any>(
        `/t/${topicId}/posts.json?${query}&include_suggested=false`,
        signal,
      );

      const posts = Array.isArray(data?.post_stream?.posts) ? data.post_stream.posts : [];
      chunks.push(...posts.map((post: any) => this._formatPost(post)).filter(Boolean));
    }

    return chunks.join('\n\n');
  }

  async generate(
    systemPrompt: string,
    userContent: string,
    signal: AbortSignal,
    onChunk: (chunk: string) => void,
    messages?: ChatMessage[],
  ): Promise<void> {
    const endpoint = this._resolveEndpoint();
    const msgArray: ChatMessage[] = messages || [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ];

    const body = {
      model: this._config.model,
      messages: msgArray,
      max_tokens: 4096,
      temperature: 0.7,
      stream: true,
    };

    try {
      await this._callWithFetch(endpoint, body, signal, onChunk);
    } catch (e) {
      if ((e as Error).name === 'AbortError') throw e;
      if (typeof GM_xmlhttpRequest !== 'function') throw e;
      await this._callWithGM(endpoint, { ...body, stream: false }, signal, onChunk);
    }
  }

  private _formatPost(post: any): string {
    const postNumber = Utils.toSafeInt(post.post_number, 0);
    const username = Utils.sanitize(post.username || '', 80);
    const name = Utils.sanitize(post.name || post.display_username || username, 100);
    const content = this._cleanCooked(post.cooked || '');

    if (!content) return '';

    const reply = post.reply_to_post_number && post.reply_to_user
      ? `-回复[${Utils.toSafeInt(post.reply_to_post_number, 0)}楼] ${Utils.sanitize(post.reply_to_user.name || post.reply_to_user.username || '', 100)}（${Utils.sanitize(post.reply_to_user.username || '', 80)}）`
      : '';

    return `[${postNumber}楼] ${name}（${username}）${reply}:\n${content}`;
  }

  private _cleanCooked(html: string): string {
    const r = AISummaryGenerator._cleanCookedRegex;
    let content = html;

    content = content.replace(r.lightbox, (_match, hrefUrl, downloadHref, title) => {
      const url = hrefUrl || `${Network.getOrigin()}${downloadHref || ''}`;
      return `\n[图片: ${title || '图片'}](${url})\n`;
    });

    content = content.replace(r.attachment, (_match, url, name) => `\n[附件: ${name.trim()}](${url})\n`);
    content = content.replace(r.emoji, '$1 ');
    content = content.replace(r.quote, (_match, quoteInner) => {
      const quote = this._decodeHtml(String(quoteInner).replace(r.allTags, ' ').replace(r.multipleSpaces, ' ').trim());
      return `\n[引用]\n${quote}\n[/引用]\n`;
    });

    content = content.replace(r.br, '\n');
    content = content.replace(r.closingTags, '\n');
    content = content.replace(r.allTags, ' ');

    return this._decodeHtml(content)
      .replace(r.trailingSpaces, '\n')
      .replace(r.multipleNewlines, '\n\n')
      .replace(r.multipleSpaces, ' ')
      .trim();
  }

  private _decodeHtml(value: string): string {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = value;
    return textarea.value;
  }

  private _resolveEndpoint(): string {
    const rawUrl = this._config.apiUrl.trim();
    if (!rawUrl) throw new Error('请先在设置中填写 API 地址');

    let url: URL;
    try {
      url = new URL(rawUrl);
    } catch {
      throw new Error('API 地址格式不正确');
    }

    const path = url.pathname.replace(/\/+$/, '');
    if (!path) {
      url.pathname = '/v1/chat/completions';
      return url.toString();
    }

    if (/\/chat\/completions$/i.test(path)) {
      url.pathname = path;
      return url.toString();
    }

    url.pathname = `${path}/chat/completions`;
    return url.toString();
  }

  private async _callWithFetch(
    endpoint: string,
    body: Record<string, unknown>,
    signal: AbortSignal,
    onChunk: (chunk: string) => void,
  ): Promise<void> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this._config.apiKey.trim()) headers.Authorization = `Bearer ${this._config.apiKey.trim()}`;

    const resp = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal,
    });

    if (!resp.ok) throw new Error(await this._readError(resp));

    if (!resp.body) {
      const data = await resp.json();
      onChunk(this._extractText(data));
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let raw = '';
    let received = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      raw += chunk;
      buffer += chunk;

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      received = this._consumeSSELines(lines, onChunk) || received;
    }

    if (buffer.trim()) received = this._consumeSSELines([buffer], onChunk) || received;

    if (!received && raw.trim()) {
      const data = JSON.parse(raw);
      onChunk(this._extractText(data));
    }
  }

  private _callWithGM(
    endpoint: string,
    body: Record<string, unknown>,
    signal: AbortSignal,
    onChunk: (chunk: string) => void,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      let settled = false;
      const rejectOnce = (error: Error) => {
        if (settled) return;
        settled = true;
        reject(error);
      };

      const abort = () => rejectOnce(new DOMException('Aborted', 'AbortError'));
      signal.addEventListener('abort', abort, { once: true });

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (this._config.apiKey.trim()) headers.Authorization = `Bearer ${this._config.apiKey.trim()}`;

      GM_xmlhttpRequest({
        method: 'POST',
        url: endpoint,
        headers,
        data: JSON.stringify(body),
        timeout: 60000,
        onload: (response) => {
          signal.removeEventListener('abort', abort);
          if (settled) return;
          settled = true;

          if (response.status < 200 || response.status >= 300) {
            reject(new Error(this._extractErrorText(response.responseText, response.status)));
            return;
          }

          try {
            const data = JSON.parse(response.responseText || '{}');
            onChunk(this._extractText(data));
            resolve();
          } catch {
            reject(new Error('AI 响应解析失败'));
          }
        },
        onerror: () => {
          signal.removeEventListener('abort', abort);
          rejectOnce(new Error('AI 请求失败'));
        },
        ontimeout: () => {
          signal.removeEventListener('abort', abort);
          rejectOnce(new Error('AI 请求超时'));
        },
      });
    });
  }

  private _consumeSSELines(lines: string[], onChunk: (chunk: string) => void): boolean {
    let received = false;
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === 'data: [DONE]') continue;
      if (!trimmed.startsWith('data: ')) continue;

      try {
        const data = JSON.parse(trimmed.slice(6));
        const text = data?.choices?.[0]?.delta?.content || data?.choices?.[0]?.message?.content || '';
        if (text) {
          received = true;
          onChunk(String(text));
        }
      } catch {
        // Skip incomplete or provider-specific event payloads
      }
    }
    return received;
  }

  private async _readError(resp: Response): Promise<string> {
    const text = await resp.text().catch(() => '');
    return this._extractErrorText(text, resp.status);
  }

  private _extractErrorText(text: string, status: number): string {
    try {
      const data = JSON.parse(text);
      return data?.error?.message || data?.message || `AI 请求失败 (${status})`;
    } catch {
      return text.trim() || `AI 请求失败 (${status})`;
    }
  }

  private _extractText(data: any): string {
    const text = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.delta?.content || data?.content || '';
    if (!text) throw new Error('AI 未返回内容');
    return String(text);
  }
}
