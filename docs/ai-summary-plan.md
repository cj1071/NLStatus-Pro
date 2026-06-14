# AI 总结功能实现计划

**创建时间:** 2026-06-14  
**状态:** 规划中（未实施）  
**目标:** 参考 LDStatusPro 吃瓜助手，实现用户活动 AI 智能总结

---

## 一、功能概述

### 1.1 参考对象
**LDStatusPro 吃瓜助手:** https://github.com/caigg188/LDStatusPro  
- AI 驱动的用户活动总结
- 个性化建议和洞察
- 自动生成可读性强的报告

### 1.2 我们的定位
- **触发方式:** 点击「📊 总结」按钮（不是跳转到 `/u/{username}/summary`）
- **总结内容:** 用户等级、阅读统计、活动概况、升级建议
- **AI 服务:** 可选多种 AI 提供商

---

## 二、功能设计

### 2.1 总结内容范围

#### 基础信息
- 用户名、等级、能量值
- 注册时间、访问天数
- 关注数、粉丝数

#### 阅读统计
- 总阅读时长（本地统计）
- 本周/本月活跃天数
- 阅读等级（初来乍到 → 深度学习）
- 热力图趋势（上升/下降/稳定）

#### 升级进度
- 当前等级：Lv2 白银
- 下一等级：Lv3 黄金
- 已达成条件 vs 未达成条件
- 完成百分比（如 91.7%）

#### 活动概况（从 Discourse API 获取）
- 发帖数、回复数、点赞数
- 最近活跃话题
- 收藏的帖子数量

#### AI 生成内容
- **个性化评价:** "您是一位活跃的社区成员，阅读时长位居前 20%..."
- **行为洞察:** "最近一周阅读活跃度下降 15%，可能需要..."
- **升级建议:** "距离黄金等级还需阅读 249 分钟，建议..."
- **社区贡献:** "您的回复获得了 XX 个赞，说明..."

### 2.2 触发方式

**当前实现（占位）:**
```typescript
// panel.ts _handleProfileAction
if (action === 'summary') {
  this._renderer.showToast('总结功能开发中');  // 占位提示
  return;
}
```

**未来实现:**
```typescript
if (action === 'summary') {
  this._showAISummary(username);  // 弹窗显示 AI 总结
}
```

**说明：**
- 当前总结按钮为**预留功能**，点击显示「总结功能开发中」提示
- 与导出按钮保持一致的占位设计
- 待技术方案确定、后端搭建完成后再实现

### 2.3 UI 设计

**总结弹窗:**
```
┌─────────────────────────────────────────┐
│  📊 个人总结 - jay.c               [×] │
├─────────────────────────────────────────┤
│                                         │
│  [加载中...]  正在生成 AI 总结...       │
│                                         │
│  ━━━━━━━━━━ 45%                        │
│                                         │
└─────────────────────────────────────────┘
```

**总结内容:**
```
┌─────────────────────────────────────────┐
│  📊 个人总结 - jay.c               [×] │
├─────────────────────────────────────────┤
│                                         │
│  🎖️ 等级信息                           │
│  Lv2 白银 (91.7% → Lv3)                │
│  能量值 12,345 · 来站 156 天            │
│                                         │
│  📖 阅读统计                           │
│  总时长 1,234 分钟 · 本周 5 天活跃      │
│  等级：🔥 沉浸阅读                      │
│                                         │
│  💬 活动概况                           │
│  发帖 12 · 回复 89 · 获赞 234          │
│                                         │
│  🤖 AI 洞察                            │
│  您是一位活跃的社区成员，阅读时长位    │
│  居前 20%。最近一周保持稳定的阅读习    │
│  惯，平均每天阅读 45 分钟。距离黄金    │
│  等级还需阅读 249 分钟，按当前速度约   │
│  6 天可达成。建议重点关注"主题阅读"   │
│  和"连续访问"两个条件。                │
│                                         │
│  [分享总结] [关闭]                      │
└─────────────────────────────────────────┘
```

---

## 三、技术方案

### 3.1 AI 服务选型

#### 方案 A: OpenAI API（推荐）
**优势:**
- ✅ GPT-4 质量最高
- ✅ API 稳定可靠
- ✅ 支持结构化输出（JSON mode）

**劣势:**
- ❌ 需要 API Key（用户自己提供 or 我们代理）
- ❌ 有成本（$0.03 / 1K tokens）

**成本估算:**
- 输入 tokens: ~500（用户数据 + 提示词）
- 输出 tokens: ~300（总结内容）
- 单次成本: $0.03（约 ¥0.2）

#### 方案 B: Claude API
**优势:**
- ✅ 质量接近 GPT-4
- ✅ 上下文窗口大（200K tokens）
- ✅ 成本稍低

**劣势:**
- ❌ 需要 API Key
- ❌ 国内访问可能不稳定

#### 方案 C: 本地模型（WebLLM）
**优势:**
- ✅ 完全免费
- ✅ 离线可用
- ✅ 隐私友好

**劣势:**
- ❌ 质量较低（小模型）
- ❌ 首次加载慢（下载模型 500MB+）
- ❌ 性能依赖用户设备

#### 方案 D: 后端代理调用 AI（推荐新手）
**优势:**
- ✅ 用户无需提供 API Key
- ✅ 统一管理成本
- ✅ 可以缓存相似查询

**劣势:**
- ❌ 需要搭建后端（Cloudflare Workers）
- ❌ 我们需要支付 API 成本

### 3.2 推荐方案

**阶段 1: 后端代理（最简单）**
```
用户点击总结
  ↓
发送请求到 Cloudflare Workers
  ↓
Workers 调用 OpenAI API（我们的 Key）
  ↓
返回总结内容
```

**优势:** 用户体验最好，无需配置

**阶段 2: 用户自带 Key（可选）**
- 设置界面提供「AI API Key」输入框
- 用户可选填，未填则使用我们的后端

---

## 四、后端实现（Cloudflare Workers）

### 4.1 API 设计

**POST /summary**

**请求:**
```json
{
  "username": "jay.c",
  "profile": {
    "trust_level": 2,
    "gamification_score": 12345,
    "days_visited": 156,
    "total_following": 23,
    "total_followers": 45
  },
  "reading": {
    "totalMinutes": 1234,
    "weekActiveDays": 5,
    "level": "沉浸阅读"
  },
  "requirements": [
    { "name": "阅读时长", "current": 351, "required": 600, "met": false },
    { "name": "访问天数", "current": 156, "required": 50, "met": true }
  ],
  "activity": {
    "topics": 12,
    "posts": 89,
    "likes_received": 234
  }
}
```

**响应:**
```json
{
  "success": true,
  "summary": "您是一位活跃的社区成员，阅读时长位居前 20%...",
  "cached": false
}
```

### 4.2 Cloudflare Workers 代码

```typescript
// worker.ts
interface Env {
  OPENAI_API_KEY: string;
  DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const data = await request.json();
    const { username, profile, reading, requirements, activity } = data;

    // 检查缓存（同样数据 1 小时内不重复调用 AI）
    const cacheKey = JSON.stringify(data);
    const cached = await env.DB.prepare(
      'SELECT summary FROM summaries WHERE cache_key = ? AND created_at > datetime("now", "-1 hour")'
    ).bind(cacheKey).first();

    if (cached) {
      return new Response(JSON.stringify({
        success: true,
        summary: cached.summary,
        cached: true
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 调用 OpenAI API
    const prompt = `你是一个社区数据分析助手。根据以下用户数据，生成一份简洁、个性化的总结报告（200字以内）。

用户名: ${username}
等级: Lv${profile.trust_level}
能量值: ${profile.gamification_score}
访问天数: ${profile.days_visited}
关注: ${profile.total_following} / 粉丝: ${profile.total_followers}

阅读统计:
- 总时长: ${reading.totalMinutes} 分钟
- 本周活跃: ${reading.weekActiveDays} 天
- 等级: ${reading.level}

升级条件:
${requirements.map(r => `- ${r.name}: ${r.current}/${r.required || '达成'} ${r.met ? '✓' : '✗'}`).join('\n')}

活动:
- 发帖: ${activity.topics}
- 回复: ${activity.posts}
- 获赞: ${activity.likes_received}

请生成包含以下内容的总结:
1. 用户整体评价（活跃度、贡献）
2. 阅读习惯洞察
3. 升级建议（距离下一等级还需什么）
4. 1-2 条个性化建议`;

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',  // 更便宜，质量也不错
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    const aiData = await aiResponse.json();
    const summary = aiData.choices[0].message.content;

    // 缓存结果
    await env.DB.prepare(
      'INSERT INTO summaries (username, cache_key, summary) VALUES (?, ?, ?)'
    ).bind(username, cacheKey, summary).run();

    return new Response(JSON.stringify({
      success: true,
      summary,
      cached: false
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'https://www.nodeloc.com'
      }
    });
  }
};
```

**数据库表:**
```sql
CREATE TABLE summaries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  cache_key TEXT NOT NULL,
  summary TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cache_key ON summaries(cache_key);
```

---

## 五、客户端实现

### 5.1 新建文件

**`src/utils/aiSummary.ts`:**
```typescript
export interface SummaryData {
  username: string;
  profile: {
    trust_level: number;
    gamification_score: number;
    days_visited: number;
    total_following: number;
    total_followers: number;
  };
  reading: {
    totalMinutes: number;
    weekActiveDays: number;
    level: string;
  };
  requirements: Array<{
    name: string;
    current: number;
    required: number | null;
    met: boolean;
  }>;
  activity: {
    topics: number;
    posts: number;
    likes_received: number;
  };
}

export class AISummary {
  constructor(private apiUrl: string) {}

  async generate(data: SummaryData): Promise<string> {
    const response = await fetch(`${this.apiUrl}/summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`AI Summary failed: ${response.status}`);
    }

    const result = await response.json();
    return result.summary;
  }
}
```

### 5.2 修改 Panel

**`src/ui/panel.ts`:**
```typescript
private async _handleProfileAction(action: string): Promise<void> {
  const username = this.storage.getUser();
  if (!username) return;

  if (action === 'summary') {
    this._showAISummary(username);  // 改为弹窗
    return;
  }
  // ... 其他逻辑
}

private async _showAISummary(username: string): Promise<void> {
  // 创建弹窗
  const modal = document.createElement('div');
  modal.className = 'nle-modal';
  modal.innerHTML = `
    <div class="nle-modal-content">
      <div class="nle-modal-header">
        <h3>📊 个人总结 - ${username}</h3>
        <button class="nle-modal-close">×</button>
      </div>
      <div class="nle-modal-body">
        <div class="nle-loading">
          <div class="nle-spinner"></div>
          <p>正在生成 AI 总结...</p>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // 关闭按钮
  modal.querySelector('.nle-modal-close')!.addEventListener('click', () => {
    modal.remove();
  });

  try {
    // 收集数据
    const data: SummaryData = {
      username,
      profile: {
        trust_level: this._user?.trust_level || 0,
        gamification_score: this._user?.gamification_score || 0,
        days_visited: this._user?.days_visited || 0,
        total_following: this._user?.total_following || 0,
        total_followers: this._user?.total_followers || 0,
      },
      reading: {
        totalMinutes: this.tracker.getTodayTime(),
        weekActiveDays: this.tracker.getWeekHistory().filter(d => d.minutes > 0).length,
        level: Utils.getReadingLevel(this.tracker.getTodayTime()).label,
      },
      requirements: this._reqItems.map(r => ({
        name: r.name,
        current: r.current,
        required: r.required,
        met: r.isSuccess,
      })),
      activity: {
        topics: 0,  // 需要从 API 获取
        posts: 0,
        likes_received: 0,
      },
    };

    // 调用 AI
    const aiSummary = new AISummary('https://nodeloc-sync.xxx.workers.dev');
    const summary = await aiSummary.generate(data);

    // 显示结果
    const body = modal.querySelector('.nle-modal-body')!;
    body.innerHTML = `
      <div class="nle-summary-content">
        <h4>🤖 AI 洞察</h4>
        <p>${summary.replace(/\n/g, '<br>')}</p>
      </div>
    `;
  } catch (error) {
    const body = modal.querySelector('.nle-modal-body')!;
    body.innerHTML = `<div class="nle-error">生成失败，请稍后重试</div>`;
  }
}
```

### 5.3 样式（styles.css）

```css
/* AI Summary Modal */
.nle-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 100000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.2s;
}

.nle-modal-content {
  background: var(--nle-bg);
  border: 1px solid var(--nle-border);
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: var(--nle-shadow);
}

.nle-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--nle-border);
}

.nle-modal-header h3 {
  margin: 0;
  font-size: 16px;
  color: var(--nle-txt);
}

.nle-modal-close {
  background: none;
  border: none;
  font-size: 24px;
  color: var(--nle-txt-mut);
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  line-height: 1;
}

.nle-modal-close:hover {
  color: var(--nle-txt);
}

.nle-modal-body {
  padding: 20px;
  overflow-y: auto;
  max-height: calc(80vh - 60px);
}

.nle-loading {
  text-align: center;
  padding: 40px 20px;
}

.nle-summary-content {
  line-height: 1.6;
}

.nle-summary-content h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: var(--nle-accent);
}

.nle-summary-content p {
  margin: 0;
  color: var(--nle-txt);
  white-space: pre-wrap;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

---

## 六、成本与限制

### 6.1 OpenAI API 成本

**模型选择: gpt-4o-mini**（推荐）
- 输入: $0.150 / 1M tokens
- 输出: $0.600 / 1M tokens

**单次总结成本:**
- 输入: 500 tokens × $0.150 / 1M = $0.000075
- 输出: 300 tokens × $0.600 / 1M = $0.000180
- **总计: ~$0.00026（约 ¥0.002）**

**月成本估算（100 用户，每人 10 次）:**
- 1000 次 × $0.00026 = **$0.26/月（约 ¥2）**

### 6.2 免费策略

**方案 1: 限制次数**
- 每用户每天 5 次免费
- 超出显示「今日额度已用完」

**方案 2: 缓存复用**
- 同样数据 1 小时内不重复调用 AI
- 显示「使用缓存结果」

**方案 3: 用户自带 Key**
- 设置界面提供 API Key 输入
- 未填则使用我们的免费额度

---

## 七、实施步骤

### 阶段 1: 后端开发（1 天）
- [ ] 搭建 Cloudflare Workers
- [ ] 集成 OpenAI API
- [ ] 创建缓存表
- [ ] 测试 API 调用

### 阶段 2: 客户端开发（1 天）
- [ ] 创建 `src/utils/aiSummary.ts`
- [ ] 修改 `_handleProfileAction` 逻辑
- [ ] 实现弹窗 UI
- [ ] 添加加载动画和错误处理

### 阶段 3: 测试优化（0.5 天）
- [ ] 测试各种用户数据场景
- [ ] 优化提示词（生成质量）
- [ ] 测试缓存命中率

### 阶段 4: 文档与发布
- [ ] 更新 README 说明 AI 总结功能
- [ ] 编写隐私政策
- [ ] 发布新版本

---

## 八、决策点

**需要用户回答:**
1. AI 服务选择？（OpenAI / Claude / 本地模型）
2. 是否愿意支付 AI API 成本？（每月 ~¥2）
3. 是否需要用户自带 Key 选项？
4. 总结内容范围是否合适？

**建议:**
- 使用 **OpenAI gpt-4o-mini**（成本低、质量好）
- 采用**后端代理 + 缓存**（用户体验最好）
- 提供**用户自带 Key** 作为备选（高级用户）
