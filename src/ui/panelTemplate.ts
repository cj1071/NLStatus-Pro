import { CURRENT_SITE } from '../site';

const PANEL_ELEMENT_IDS = [
  'progress',
  'profileCard',
  'profileAvatar',
  'profileName',
  'profileUsername',
  'profileMeta',
  'profileActions',
  'trustRing',
  'trustBadge',
  'trustUser',
  'trustGuide',
  'reqList',
  'readingToday',
  'readingLevel',
  'readingActive',
  'heatmapGrid',
  'heatmapLabels',
  'readingGoalBar',
  'energyLb',
  'postersLb',
  'topicsLb',
  'postingFilters',
  'activitySearch',
  'activityStats',
  'activityScroll',
  'activityList',
  'activityStatus',
  'activityEnd',
  'followingCount',
  'followersCount',
  'followList',
] as const;

export type PanelElementMap = Record<(typeof PANEL_ELEMENT_IDS)[number], HTMLElement>;

export function createPanelTemplate(): { el: HTMLElement; els: PanelElementMap } | null {
  if (!CURRENT_SITE) return null;

  const el = document.createElement('div');
  el.id = 'nle-panel';
  el.setAttribute('role', 'complementary');
  el.innerHTML = `
    <div class="nle-hdr">
      <div class="nle-hdr-info">
        <img src="${CURRENT_SITE.icon}" alt="NL" class="nle-hdr-logo">
        <div>
          <div class="nle-hdr-title">NLStatus Pro</div>
          <div class="nle-hdr-ver">v${__APP_VERSION__}</div>
        </div>
      </div>
      <div class="nle-hdr-btns">
        <button id="nle-btn-refresh" title="刷新">🔄</button>
        <button id="nle-btn-theme" title="切换主题">🌓</button>
        <button class="nle-toggle" id="nle-btn-toggle" title="折叠面板">
          <span class="nle-toggle-arrow">◀</span>
          <img class="nle-toggle-logo" src="${CURRENT_SITE.icon}" alt="NL" draggable="false">
        </button>
      </div>
    </div>
    <div class="nle-progress" id="nle-progress"></div>
    <div class="nle-profile-card" id="nle-profileCard">
      <div class="nle-profile-head">
        <img class="nle-profile-avatar" id="nle-profileAvatar" alt="">
        <div class="nle-profile-main">
          <div class="nle-profile-name" id="nle-profileName">--</div>
          <div class="nle-profile-username" id="nle-profileUsername"></div>
          <div class="nle-profile-meta" id="nle-profileMeta"></div>
        </div>
      </div>
      <div class="nle-profile-actions" id="nle-profileActions">
        <button class="nle-profile-btn" data-action="logout" title="注销登录">⏻ 注销</button>
        <button class="nle-profile-btn" data-action="store" title="打开 NodeLoc Store">🏪 Store</button>
        <button class="nle-profile-btn" data-action="domain" title="Nodeloc 公告 | 每月福利：免费注册 loc.cc 二级域名！">🌐 Domain</button>
        <button class="nle-profile-btn nle-profile-btn-wide" data-action="summary" title="查看个人总结">📊 总结</button>
        <button class="nle-profile-btn nle-profile-btn-wide" data-action="export" title="导出当前帖子">📥 导出</button>
      </div>
    </div>
    <div class="nle-tab-nav">
      <button class="nle-tab active" data-tab="trust">📊 信任</button>
      <button class="nle-tab" data-tab="leaderboard">🏆 排行</button>
      <button class="nle-tab" data-tab="activity">📋 活动</button>
      <button class="nle-tab" data-tab="follows">👥 关注</button>
    </div>
    <div class="nle-body">
      <div class="nle-section active" id="nle-sec-trust">
        <div class="nle-trust-ring-wrap" id="nle-trustRing"></div>
        <div id="nle-trustBadge" class="nle-trust-level-badge" style="text-align:center">--</div>
        <div id="nle-trustUser" class="nle-trust-user" style="text-align:center"></div>
        <div class="nle-reading-card">
          <div class="nle-reading-today" id="nle-readingToday">0分钟</div>
          <div class="nle-reading-level" id="nle-readingLevel">--</div>
          <div class="nle-reading-active off" id="nle-readingActive">○ 未活动</div>
          <div class="nle-heatmap" id="nle-heatmapGrid"></div>
          <div class="nle-heatmap-labels" id="nle-heatmapLabels"></div>
          <div class="nle-heatmap-bar" id="nle-readingGoalBar" style="display:none"></div>
        </div>
        <div class="nle-req-list" id="nle-reqList"></div>
        <button id="nle-trustGuide" class="nle-trust-guide" type="button">了解论坛信任等级 →</button>
      </div>
      <div class="nle-section" id="nle-sec-leaderboard">
        <div class="nle-lb-subtabs">
          <button class="nle-lb-subtab active" data-lb-tab="energy">⚡ 财富榜</button>
          <button class="nle-lb-subtab" data-lb-tab="posters">💬 水王榜</button>
          <button class="nle-lb-subtab" data-lb-tab="topics">✍️ 文圣榜</button>
        </div>
        <div class="nle-lb-posting-filters" id="nle-postingFilters" style="display:none">
          <div class="nle-lb-subtabs">
            <button class="nle-lb-subtab active" data-posting-period="current_month">本月</button>
            <button class="nle-lb-subtab" data-posting-period="previous_month">上月</button>
            <button class="nle-lb-subtab" data-posting-period="all_time">全部</button>
          </div>
        </div>
        <div id="nle-energyLb"></div>
        <div id="nle-postersLb" style="display:none"></div>
        <div id="nle-topicsLb" style="display:none"></div>
      </div>
      <div class="nle-section" id="nle-sec-activity">
        <div class="nle-lb-subtabs nle-activity-subtabs">
          <button class="nle-lb-subtab active" data-activity-type="read">👁️ 已读</button>
          <button class="nle-lb-subtab" data-activity-type="bookmarks">🔖 收藏</button>
          <button class="nle-lb-subtab" data-activity-type="replies">💬 回复</button>
          <button class="nle-lb-subtab" data-activity-type="likes">❤️ 点赞</button>
          <button class="nle-lb-subtab" data-activity-type="topics">✏️ 话题</button>
          <button class="nle-lb-subtab" data-activity-type="reactions">⚡ 互动</button>
          <button class="nle-lb-subtab" data-activity-type="notifications">🔔 通知</button>
        </div>
        <div class="nle-activity-toolbar">
          <div class="nle-activity-search-wrap">
            <span class="nle-activity-search-icon">🔍</span>
            <input type="text" id="nle-activitySearch" class="nle-activity-search-input" placeholder="搜索标题...">
          </div>
          <div class="nle-activity-stats" id="nle-activityStats">已加载 0 条</div>
        </div>
        <div class="nle-activity-scroll" id="nle-activityScroll">
          <div id="nle-activityList"></div>
          <div class="nle-activity-status" id="nle-activityStatus" style="display:none"></div>
          <div class="nle-activity-status nle-activity-end" id="nle-activityEnd" style="display:none">— 没有更多了 —</div>
        </div>
      </div>
      <div class="nle-section" id="nle-sec-follows">
        <div class="nle-follow-stats">
          <div class="nle-follow-stat active" data-follow-tab="following">
            <div class="nle-follow-num" id="nle-followingCount">--</div>
            <div class="nle-follow-label">关注</div>
          </div>
          <div class="nle-follow-stat" data-follow-tab="followers">
            <div class="nle-follow-num" id="nle-followersCount">--</div>
            <div class="nle-follow-label">粉丝</div>
          </div>
        </div>
        <div id="nle-followList"></div>
      </div>
    </div>
  `;

  const els = {} as PanelElementMap;
  for (const id of PANEL_ELEMENT_IDS) {
    els[id] = el.querySelector(`#nle-${id}`)! as HTMLElement;
  }

  return { el, els };
}
