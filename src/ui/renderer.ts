import { CONFIG, PATTERNS } from '../config';
import { CURRENT_SITE } from '../site';
import { Screen } from '../utils/screen';
import { Utils } from '../utils/helpers';
import type { UserProfile, RequirementItem } from '../data/trustLevelParser';
import type { LeaderboardData } from '../data/leaderboardFetcher';
import type { FollowUser } from '../data/followFetcher';
import type Panel from './panel';

export class Renderer {
  constructor(private _panel: Panel) {}

  get $(): Record<string, HTMLElement> {
    return this._panel.$;
  }

  renderTrustLevel(user: UserProfile | null, _stats: unknown, reqItems: RequirementItem[], pct: number): void {
    const cfg = Screen.getPanelConfig();
    const r = cfg.ringSize / 2 - 8;
    const circ = 2 * Math.PI * r;
    const off = circ * (1 - pct / 100);
    const colors = CONFIG.TRUST_LEVEL_COLORS;
    const levelNames = CONFIG.TRUST_LEVEL_NAMES;
    const currentLevel = user?.trust_level || 0;
    const color = colors[currentLevel] || colors[0];
    const levelName = levelNames[currentLevel] || '未知';

    this.$.trustRing.innerHTML = `
      <svg width="${cfg.ringSize}" height="${cfg.ringSize}" class="nle-ring-svg">
        <circle cx="${cfg.ringSize / 2}" cy="${cfg.ringSize / 2}" r="${r}" class="nle-ring-bg" stroke-width="8"/>
        <circle cx="${cfg.ringSize / 2}" cy="${cfg.ringSize / 2}" r="${r}" class="nle-ring-fg"
          stroke-width="8" stroke="${color}"
          stroke-dasharray="${circ}" stroke-dashoffset="${off}"/>
        <text x="${cfg.ringSize / 2}" y="${cfg.ringSize / 2 - 6}" class="nle-ring-text">${pct}%</text>
        <text x="${cfg.ringSize / 2}" y="${cfg.ringSize / 2 + 14}" class="nle-ring-label">${pct >= 100 ? '已达标' : '升级中'}</text>
      </svg>
    `;

    this.$.trustBadge.textContent = `Lv${currentLevel} · ${levelName}`;
    this.$.trustBadge.style.background = `linear-gradient(135deg, ${color}, ${color}cc)`;
    this.$.trustUser.textContent = user?.name || user?.username || '--';

    let reqHTML = '';
    if (reqItems.length === 0) {
      reqHTML = '<div class="nle-empty">🎉 已达成最高等级</div>';
    } else {
      for (const item of reqItems) {
        const cls = item.isSuccess ? 'met' : '';
        const check = item.isSuccess ? '✓' : '○';
        reqHTML += `
          <div class="nle-req-item ${cls}">
            <span class="nle-req-name">${Utils.escapeHtml(item.name)}</span>
            <span class="nle-req-values">${item.current}/${item.required}</span>
            <div class="nle-req-bar-wrap"><div class="nle-req-bar" style="width:${Math.round(item.progress * 100)}%"></div></div>
            <span class="nle-req-check">${check}</span>
          </div>
        `;
      }
    }
    this.$.reqList.innerHTML = reqHTML;
  }

  renderReading(minutes: number, isActive: boolean): void {
    const level = Utils.getReadingLevel(minutes);
    this.$.readingToday.textContent = Utils.formatReadingTime(minutes);
    this.$.readingLevel.textContent = `${level.icon} ${level.label}`;
    this.$.readingLevel.style.color = level.color;

    const actEl = this.$.readingActive;
    actEl.textContent = isActive ? '● 正在阅读' : '○ 未活动';
    actEl.className = 'nle-reading-active ' + (isActive ? 'on' : 'off');

    const week = this._panel.tracker.getWeekHistory();
    let cellsHTML = '';
    for (const d of week) {
      const hLevel = Utils.getHeatmapLevel(d.minutes);
      cellsHTML += `<div class="nle-heatmap-cell h${hLevel}" title="${d.day} ${Utils.formatReadingTime(d.minutes)}"></div>`;
    }
    this.$.heatmapGrid.innerHTML = cellsHTML;
    this.$.heatmapLabels.innerHTML = week.map(d => `<span>${d.day[1]}</span>`).join('');

    const goalHours = (this._panel.storage.get('nle_readingGoalHours', null) as number | null) || 0;
    if (goalHours > 0) {
      const goalMin = goalHours * 60;
      const progress = Math.min(100, Math.round((minutes / goalMin) * 100));
      this.$.readingGoalBar.innerHTML = `
        <div class="nle-heatmap-bar-fill"><div class="nle-heatmap-bar-inner" style="width:${progress}%"></div></div>
        <span class="nle-heatmap-bar-label">${progress}%</span>
      `;
      this.$.readingGoalBar.style.display = 'flex';
    } else {
      this.$.readingGoalBar.style.display = 'none';
    }
  }

  renderLeaderboard(data: LeaderboardData, type: 'energy' | 'posting'): void {
    const users = data?.users || [];
    const personal = data?.personal;
    let html = '';

    if (personal && personal.position) {
      html += `
        <div class="nle-lb-personal">
          <span>🏅</span>
          <span class="nle-lb-personal-rank">#${personal.position}</span>
          <span>${Utils.escapeHtml(personal.username || '你')}</span>
          <span style="flex:1"></span>
          <span style="font-weight:700;color:var(--nle-accent)">${Utils.formatNumber(personal.total_score)}</span>
        </div>
      `;
    }

    for (let i = 0; i < users.length; i++) {
      const u = users[i];
      const rank = u.position || i + 1;
      let rankCls = '';
      if (rank === 1) rankCls = 'gold';
      else if (rank === 2) rankCls = 'silver';
      else if (rank === 3) rankCls = 'bronze';

      let avatar: string;
      if (u.avatar_template && CURRENT_SITE) {
        avatar = `${CURRENT_SITE.origin}${u.avatar_template.replace(PATTERNS.AVATAR_SIZE, '/40/')}`;
      } else {
        avatar = Utils.buildLetterAvatar(u.username);
      }

      html += `
        <div class="nle-lb-item">
          <span class="nle-lb-rank ${rankCls}">${rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : String(rank)}</span>
          <img class="nle-lb-avatar" src="${avatar}" loading="lazy" onerror="this.src='${Utils.buildLetterAvatar(u.username)}'">
          <span class="nle-lb-name">${Utils.escapeHtml(u.name || u.username)}</span>
          <span class="nle-lb-score">${Utils.formatNumber(u.total_score)}</span>
        </div>
      `;
    }

    this.$[type === 'energy' ? 'energyLb' : 'postingLb'].innerHTML = html || '<div class="nle-empty">暂无数据</div>';
  }

  renderActivity(items: Array<{ title?: string; excerpt?: string; topic_title?: string; created_at?: string; updated_at?: string; action_type?: number; notification_type?: number; topic_id?: number }>): string {
    let html = '';
    for (const a of items) {
      const title = a.title || a.excerpt || a.topic_title || '';
      const time = Utils.formatRelativeTime(a.created_at || a.updated_at || '');
      const actionType = a.action_type || a.notification_type;
      let icon = '📄';
      if (actionType === 2) icon = '❤️';
      else if (actionType === 5) icon = '💬';
      else if (actionType === 6) icon = '✏️';
      else if (actionType === 9) icon = '🔖';
      html += `
        <div class="nle-activity-item" data-topic-id="${a.topic_id || ''}">
          <div class="nle-activity-title">${icon} ${Utils.escapeHtml(Utils.sanitize(title, 80))}</div>
          <div class="nle-activity-meta">${time}</div>
        </div>
      `;
    }
    return html || '<div class="nle-empty">暂无活动记录</div>';
  }

  renderFollowList(users: FollowUser[]): string {
    let html = '';
    for (const u of users) {
      let avatar: string;
      if (u.avatar_template && CURRENT_SITE) {
        avatar = `${CURRENT_SITE.origin}${u.avatar_template.replace(PATTERNS.AVATAR_SIZE, '/40/')}`;
      } else {
        avatar = Utils.buildLetterAvatar(u.username);
      }
      html += `
        <div class="nle-follow-item" data-username="${Utils.escapeHtml(u.username)}">
          <img class="nle-follow-avatar" src="${avatar}" loading="lazy" onerror="this.src='${Utils.buildLetterAvatar(u.username)}'">
          <span class="nle-follow-name">${Utils.escapeHtml(u.name || u.username)}</span>
        </div>
      `;
    }
    return html || '<div class="nle-empty">暂无数据</div>';
  }

  showToast(msg: string): void {
    const el = document.createElement('div');
    el.className = 'nle-toast';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2600);
  }
}
