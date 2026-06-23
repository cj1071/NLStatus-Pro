# AI 帖子总结功能说明

**创建时间:** 2026-06-14  
**更新时间:** 2026-06-23  
**状态:** 已实现，随 `v1.2.0` 重构优化  
**目标:** 参考 `LDStatusPro` 的 `MelonHelper`，实现当前话题帖子的 AI 总结能力。

## 功能范围

| 能力 | 当前实现 |
|------|----------|
| 触发入口 | 点击个人卡片里的「📊 总结」按钮 |
| 使用场景 | 当前页面必须是 Discourse 话题页 |
| 数据来源 | `/t/{topicId}.json`、`/t/{topicId}/post_ids.json`、`/t/{topicId}/posts.json` |
| 楼层范围 | 支持输入起始楼层和结束楼层 |
| 总结模式 | 简略、详细 |
| AI 服务 | 用户在设置里填写 OpenAI 兼容 API 地址、API Key、模型 |
| 提示词 | 支持简略/详细模式自定义提示词 |
| 输出 | 结果统一在独立弹窗助手中流式显示，支持复制、字号调整、阅读模式 |
| Markdown 渲染 | 支持标题、段落、列表层级、引用、代码、链接、表格 |
| 历史记录 | 本地保存最近 100 条，列表点击打开弹窗，支持复制、跳转话题、删除、清空 |
| 追问 | 弹窗助手内基于本次总结继续提问 |
| 弹窗尺寸 | 桌面端支持右下角拖拽缩放，移动端按屏幕自适应 |

## 来源功能对照

| `LDStatusPro` `MelonHelper` | `nodeloc-enhance` |
|-----------------------------|-------------------|
| `ldsp_melon_config` | `aiTopicSummaryConfig` |
| `ldsp_melon_history` | `aiTopicSummaryHistory` |
| `_getTopicId` | `AITopicSummary._getTopicId` |
| `_getTopicInfo` | `AITopicSummary._getTopicInfo` |
| `_fetchDialogues` | `AITopicSummary._fetchDialogues` |
| `_callAIStream` | `AITopicSummary._callAI` |
| `_renderMarkdown` | `AITopicSummary._renderMarkdown` |
| `_showViewer` | `AITopicSummary._showViewer` |
| 历史、设置、首页三标签 | 历史、设置、首页三标签 |

## 客户端实现

| 文件 | 作用 |
|------|------|
| `src/ui/aiTopicSummary.ts` | AI 帖子总结主体，包括帖子抓取、AI 调用、历史、设置、弹窗助手、追问 |
| `src/ui/profileActions.ts` | 将 `summary` 按钮接入 `AITopicSummary` |
| `src/ui/panelTemplate.ts` | 将按钮标题改为“总结当前帖子” |
| `src/ui/styles.css` | AI 总结入口面板、弹窗助手、历史、设置、Markdown 渲染样式 |
| `src/types.ts` | 补充 `GM_xmlhttpRequest` 超时回调类型 |
| `vite.config.ts` | 增加 `@connect *`，允许用户配置任意 OpenAI 兼容 API |

## README 对外说明

| 位置 | 当前说明 |
|------|----------|
| 功能特性 | AI 帖子总结已作为正式功能展示 |
| 项目结构 | `src/ui/aiTopicSummary.ts`、`topicExporter.ts`、`profileActions.ts` 已列入结构 |
| 路线图 | AI 帖子总结已从规划中移到已完成 |

## 行为说明

1. 在话题页点击「📊 总结」。
2. 面板读取当前话题信息，并显示总楼层、浏览、点赞。
3. 用户选择楼层范围和总结模式。
4. 点击「开始总结」后，脚本批量抓取帖子内容并清洗 HTML。
5. 通过 OpenAI 兼容接口生成总结，优先使用 `fetch` 在独立弹窗中流式输出。
6. 如果 `fetch` 失败且环境支持 `GM_xmlhttpRequest`，回退为非流式请求。
7. 总结完成后保存历史，弹窗内开放复制、阅读模式和追问。
8. 历史记录列表点击后直接打开同一个弹窗助手。

## 注意事项

- 默认 API 地址为 `https://api.openai.com/v1/chat/completions`。
- 如果用户使用第三方兼容服务，需要在设置里填写对应地址和 Key。
- API 地址可填写 `https://example.com/v1`，脚本会自动补全为 `/chat/completions`。
- 追问只基于已生成的总结回答，不重新读取原帖全文。
- 历史记录只保存在浏览器本地。
