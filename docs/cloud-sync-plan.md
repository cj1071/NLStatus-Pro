# 云同步实现计划

**创建时间:** 2026-06-14  
**状态:** 规划中（未实施）  
**目标:** 实现跨设备阅读数据同步，防止本地缓存丢失

---

## 一、需求分析

### 1.1 核心需求
- **跨设备同步:** 用户在不同浏览器/电脑上访问 NodeLoc，阅读数据自动同步
- **数据备份:** 防止清除浏览器缓存导致数据丢失
- **合并策略:** 本地数据 vs 云端数据，取较大值（避免覆盖更大数据）

### 1.2 非功能需求
- 同步延迟 < 5 秒
- 不影响当前性能（异步上报）
- 免费或低成本（Cloudflare Workers 免费额度）
- 用户隐私保护（可选功能，用户自愿开启）

---

## 二、技术方案

### 2.1 后端选型：Cloudflare Workers

**优势:**
- ✅ 免费额度足够（100,000 次请求/天）
- ✅ 全球 CDN 加速（低延迟）
- ✅ D1 数据库免费（5GB 存储）
- ✅ 无需维护服务器
- ✅ 支持自定义域名（可选）

**部署步骤:**
```bash
# 1. 安装 Wrangler CLI
npm install -g wrangler

# 2. 登录 Cloudflare
wrangler login

# 3. 创建项目
mkdir nodeloc-sync && cd nodeloc-sync
wrangler init

# 4. 创建 D1 数据库
wrangler d1 create nodeloc-reading

# 5. 部署
wrangler deploy
```

### 2.2 数据库设计

**表结构（D1 SQLite）:**
```sql
CREATE TABLE reading_time (
  username TEXT NOT NULL,
  date TEXT NOT NULL,          -- 格式: "Wed Jun 12 2024"
  minutes REAL NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (username, date)
);

CREATE INDEX idx_username ON reading_time(username);
CREATE INDEX idx_updated_at ON reading_time(updated_at);
```

**数据示例:**
```
username   | date             | minutes | updated_at
-----------|------------------|---------|-------------------
jay.c      | Wed Jun 12 2024  | 120.5   | 2024-06-12 15:30:00
jay.c      | Thu Jun 13 2024  | 85.2    | 2024-06-13 22:15:00
```

### 2.3 API 设计

#### 2.3.1 上报数据（POST /sync）
**请求:**
```json
{
  "username": "jay.c",
  "dailyData": {
    "Wed Jun 12 2024": { "totalMinutes": 120.5 },
    "Thu Jun 13 2024": { "totalMinutes": 85.2 }
  }
}
```

**响应:**
```json
{
  "success": true,
  "synced": 2
}
```

**逻辑:**
```sql
-- 对每条数据，取较大值合并
INSERT INTO reading_time (username, date, minutes)
VALUES (?, ?, ?)
ON CONFLICT(username, date) DO UPDATE SET
  minutes = MAX(minutes, excluded.minutes),
  updated_at = CURRENT_TIMESTAMP
```

#### 2.3.2 拉取数据（GET /sync?username=xxx）
**请求:**
```
GET /sync?username=jay.c
```

**响应:**
```json
{
  "success": true,
  "data": [
    { "date": "Wed Jun 12 2024", "minutes": 120.5 },
    { "date": "Thu Jun 13 2024", "minutes": 85.2 }
  ]
}
```

---

## 三、客户端集成

### 3.1 修改文件
- `src/tracking/readingTracker.ts` — 添加云同步逻辑
- `src/utils/cloudSync.ts` — 新建云同步模块
- `src/ui/panel.ts` — 添加「启用云同步」开关

### 3.2 同步时机
1. **首次加载:** 拉取云端数据 → 合并本地数据 → 上报合并结果
2. **定时上报:** 每 1 小时上报一次本地增量数据
3. **页面卸载:** `beforeunload` 时强制同步一次

### 3.3 代码示例

**新建 `src/utils/cloudSync.ts`:**
```typescript
import { Storage } from './storage';

interface SyncConfig {
  apiUrl: string;  // e.g., 'https://nodeloc-sync.xxx.workers.dev'
  enabled: boolean;
}

export class CloudSync {
  constructor(private storage: Storage, private config: SyncConfig) {}

  async uploadData(username: string, dailyData: Record<string, any>): Promise<void> {
    if (!this.config.enabled) return;

    try {
      const response = await fetch(`${this.config.apiUrl}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, dailyData }),
      });

      if (!response.ok) {
        console.error('[CloudSync] Upload failed:', response.status);
      }
    } catch (error) {
      console.error('[CloudSync] Upload error:', error);
    }
  }

  async downloadData(username: string): Promise<Record<string, any> | null> {
    if (!this.config.enabled) return null;

    try {
      const response = await fetch(`${this.config.apiUrl}/sync?username=${encodeURIComponent(username)}`);
      if (!response.ok) return null;

      const result = await response.json();
      const dailyData: Record<string, any> = {};
      
      for (const item of result.data || []) {
        dailyData[item.date] = { totalMinutes: item.minutes };
      }

      return dailyData;
    } catch (error) {
      console.error('[CloudSync] Download error:', error);
      return null;
    }
  }

  async syncWithCloud(username: string, localData: Record<string, any>): Promise<Record<string, any>> {
    const cloudData = await this.downloadData(username);
    if (!cloudData) return localData;

    // 合并策略：取较大值
    const merged = { ...localData };
    for (const [date, cloudDay] of Object.entries(cloudData)) {
      const localDay = merged[date];
      if (!localDay || cloudDay.totalMinutes > localDay.totalMinutes) {
        merged[date] = cloudDay;
      }
    }

    // 上报合并后的数据
    await this.uploadData(username, merged);

    return merged;
  }
}
```

**修改 `src/tracking/readingTracker.ts`:**
```typescript
import { CloudSync } from '../utils/cloudSync';

export class ReadingTracker {
  private cloudSync?: CloudSync;

  init(username: string): void {
    // ... 现有代码 ...

    // 初始化云同步
    const syncEnabled = this._storage.get('nle_cloudSyncEnabled', false);
    if (syncEnabled) {
      this.cloudSync = new CloudSync(this._storage, {
        apiUrl: 'https://nodeloc-sync.xxx.workers.dev',
        enabled: true,
      });

      // 首次同步
      this.syncOnStartup(username);

      // 定时同步（每小时）
      this._intervals.push(
        setInterval(() => this.syncToCloud(username), 3600000)
      );
    }
  }

  private async syncOnStartup(username: string): Promise<void> {
    const stored = this._storage.get('readingTime', null) as StoredReading | null;
    const localData = stored?.dailyData || {};

    const merged = await this.cloudSync!.syncWithCloud(username, localData);

    if (stored) {
      stored.dailyData = merged;
      this._storage.set('readingTime', stored);
    }
  }

  private async syncToCloud(username: string): Promise<void> {
    const stored = this._storage.get('readingTime', null) as StoredReading | null;
    if (!stored?.dailyData || !this.cloudSync) return;

    await this.cloudSync.uploadData(username, stored.dailyData);
  }
}
```

---

## 四、用户界面

### 4.1 设置界面新增开关

**位置:** 面板设置 Tab  
**标签:** `☁️ 云同步`  
**描述:** `跨设备同步阅读数据（需联网）`  
**默认:** 关闭

### 4.2 首次开启提示
```
🔔 云同步功能说明

- 阅读数据将上传至云端服务器
- 仅存储阅读时长统计，不包含浏览内容
- 数据仅用于跨设备同步，不会分享给第三方
- 可随时在设置中关闭

[确认开启] [取消]
```

---

## 五、隐私与安全

### 5.1 数据最小化
- **只上传:** 用户名 + 日期 + 阅读分钟数
- **不上传:** 浏览历史、帖子内容、IP 地址

### 5.2 HTTPS 加密
- Cloudflare Workers 强制 HTTPS
- 传输数据加密

### 5.3 CORS 配置
```javascript
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://www.nodeloc.com',
  'Access-Control-Allow-Methods': 'GET, POST',
  'Access-Control-Allow-Headers': 'Content-Type',
};
```

---

## 六、成本评估

### 6.1 Cloudflare Workers 免费额度
- 请求数：100,000 次/天
- CPU 时间：10ms/请求
- D1 数据库：5GB 存储 + 500 万行读/天

### 6.2 实际使用量（假设 100 活跃用户）
| 操作 | 频率 | 月请求数 |
|------|------|---------|
| 上报数据 | 每小时 1 次 | 100 × 24 × 30 = 72,000 |
| 拉取数据 | 每天 1 次 | 100 × 30 = 3,000 |
| **总计** | | **75,000 次/月** |

**结论:** 远低于免费额度（300 万次/月），**完全免费**。

---

## 七、实施步骤

### 阶段 1: 后端开发（1-2 天）
- [ ] 搭建 Cloudflare Workers 项目
- [ ] 创建 D1 数据库和表结构
- [ ] 实现 POST /sync 和 GET /sync API
- [ ] 编写单元测试

### 阶段 2: 客户端集成（1 天）
- [ ] 创建 `src/utils/cloudSync.ts`
- [ ] 修改 `readingTracker.ts` 添加云同步逻辑
- [ ] 面板添加「启用云同步」开关
- [ ] 测试本地 + 云端数据合并逻辑

### 阶段 3: 测试验证（1 天）
- [ ] 单设备测试：开关、上报、拉取
- [ ] 跨设备测试：两个浏览器数据同步
- [ ] 边界测试：网络断开、API 超时、数据冲突

### 阶段 4: 文档与发布
- [ ] 更新 README 说明云同步功能
- [ ] 编写隐私政策说明
- [ ] 发布新版本

---

## 八、风险与备选方案

### 8.1 风险
| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| Cloudflare 免费额度不够 | 功能失效 | 监控用量，提前告知用户 |
| API 服务中断 | 同步失败 | 本地数据不受影响，自动降级 |
| 用户隐私担忧 | 不愿开启 | 默认关闭，透明说明 |

### 8.2 备选方案
1. **不实施云同步**，保持纯前端方案（当前状态）
2. **使用 GitHub Gist** 作为免费存储（需要用户 OAuth）
3. **导出/导入功能**：用户手动备份数据为 JSON 文件

---

## 九、决策点

**需要用户回答：**
1. 是否真的需要云同步功能？（用户反馈中是否有跨设备需求）
2. 是否愿意维护 Cloudflare Workers 后端？
3. 是否接受存储用户数据的隐私风险？

**建议：**
- 如果用户群体小（< 50 人），保持当前纯前端方案即可
- 如果用户群体大且有跨设备需求，云同步值得实施
- 可以先实现「导出/导入」功能作为过渡方案
