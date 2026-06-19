import { CURRENT_SITE } from '../site';
import { Storage } from '../utils/storage';
import { AITopicSummary } from './aiTopicSummary';
import { TopicExporter } from './topicExporter';

const NODELOC_STORE_URL = 'https://store.nodeloc.com/';
const NODELOC_DOMAIN_URL = 'https://domain.nodeloc.com/';

interface ProfileActionsOptions {
  root: HTMLElement;
  storage: Storage;
  showToast: (msg: string) => void;
}

export class ProfileActions {
  private _topicExporter: TopicExporter | null = null;
  private _aiTopicSummary: AITopicSummary | null = null;

  constructor(private _options: ProfileActionsOptions) {}

  init(): void {
    for (const b of this._options.root.querySelectorAll<HTMLElement>('.nle-profile-btn')) {
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        void this._handleAction(b.dataset.action || '');
      });
    }
  }

  destroy(): void {
    this._topicExporter?.destroy();
    this._aiTopicSummary?.destroy();
  }

  private async _handleAction(action: string): Promise<void> {
    const username = await this._options.storage.resolveUser();
    if (action === 'summary') {
      this._ensureAITopicSummary().show();
      return;
    }
    if (action === 'export') {
      this._ensureTopicExporter().show();
      return;
    }
    if (action === 'store') {
      window.open(NODELOC_STORE_URL, '_blank', 'noopener,noreferrer');
      return;
    }
    if (action === 'domain') {
      window.open(NODELOC_DOMAIN_URL, '_blank', 'noopener,noreferrer');
      return;
    }
    if (action === 'logout') {
      this._logout(username);
    }
  }

  private _ensureTopicExporter(): TopicExporter {
    if (!this._topicExporter) {
      this._topicExporter = new TopicExporter(this._options.root, this._options.showToast);
    }
    return this._topicExporter;
  }

  private _ensureAITopicSummary(): AITopicSummary {
    if (!this._aiTopicSummary) {
      this._aiTopicSummary = new AITopicSummary(this._options.root, this._options.storage, this._options.showToast);
    }
    return this._aiTopicSummary;
  }

  private async _logout(username: string | null): Promise<void> {
    if (!username || !CURRENT_SITE) return;
    if (!window.confirm('确定要注销登录吗？')) return;
    try {
      const csrf = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content || '';
      const resp = await fetch(`${CURRENT_SITE.origin}/session/${encodeURIComponent(username)}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'X-CSRF-Token': csrf,
          'X-Requested-With': 'XMLHttpRequest',
          'Discourse-Logged-In': 'true',
        },
      });
      const data = await resp.json().catch(() => null);
      const redirect = data?.redirect_url || `${CURRENT_SITE.origin}/`;
      window.location.href = redirect;
    } catch {
      this._options.showToast('注销失败，请手动退出');
    }
  }
}
