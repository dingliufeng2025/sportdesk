# SportDesk

个人体育桌面工作台（Windows 优先）— Electron + React + TypeScript P0 脚手架。

深色简洁的「赛程优先」桌面布局，集成关注、要闻与 AI 问答（Pi SDK 接线 + 本地 Stub）。**当前版本使用假数据适配器**；正式 API 密钥由用户自行配置，不进入 Git。

> **UI 说明**：版式灵感来自对公开体育首页信息架构的抽象（赛程 Tab + 联赛标签 + 侧栏资讯），**数据仍仅来自正规 API / RSS / 本地假数据**，代码中无直播吧等站点的 URL 请求或解析逻辑。

## 环境要求

- **Windows 10/11**（主要目标平台；macOS / Linux 亦可开发调试）
- **Node.js 20+**（推荐 LTS）
- npm 10+

## 快速开始（Windows）

```powershell
cd <项目目录>
npm install
npm run dev
```

- `npm run build` — 构建主进程、预加载与渲染进程
- `npm run start` — 预览已构建产物（`electron-vite preview`）
- `npm run pack` — 打包 Windows 安装包（需先 `build`）

首次启动会在用户目录创建数据文件夹：

| 路径 | 说明 |
|------|------|
| `%USERPROFILE%\.sportdesk\config.json` | 关注列表、RSS 占位、刷新间隔、简报时间（默认 Asia/Shanghai 08:00） |
| `%USERPROFILE%\.sportdesk\cache\` | 示例 JSON 缓存（fixtures / news / standings） |
| `%USERPROFILE%\.sportdesk\secrets.json` | API 密钥（**仅本地**，勿提交仓库） |

仓库内提供 `.env.example` 供开发参考；生产以 `secrets.json` 或环境变量为准。

## 界面结构（P0 · 赛程优先）

首页信息架构参考常见体育门户「赛程中心」的**公开板块布局**（标签 + 日期 + 时间线 + 侧栏资讯），**不包含任何第三方站点数据抓取或接口调用**。

| 区域 | 内容 |
|------|------|
| **顶栏** | Logo、联赛/项目 Chip（NBA、五大联赛、中国队等）、今日/明日/后天 Tab、刷新、日报、设置 |
| **左栏（窄）** | 我的关注 + 下一场一句话摘要 |
| **中央（主）** | 赛程时间线：时间 · 联赛 · 对阵 · 比分/状态，进行中高亮置顶 |
| **右栏** | 完场摘要、要闻列表、积分榜小卡（示例） |
| **底部抽屉** | 可折叠 AI 问答（`session:send` / `pi:event`） |
| **弹层** | 每日日报、API 密钥设置 |

王者荣耀：**不提供实时比分**，仅关注备注与官网外链。

## 架构

```
src/
  main/           # Electron 主进程：配置、假数据适配器、Pi 会话、IPC
  preload/        # contextBridge → window.sportdesk
  renderer/       # React UI（中文文案）
```

- **假数据适配器**：`src/main/adapters/fake-adapters.ts` — 五大联赛、NBA、国足、网球/斯诺克/LOL 占位；刷新写入 `cache/`。  
- **Pi SDK**：依赖 `@earendil-works/pi-coding-agent`。主进程尝试 `createAgentSession`，`tools: []` + `noTools: 'all'`，仅注册只读 `customTools`：`get_fixtures`、`get_standings`、`get_news`、`get_following`。**未启用 bash / write**。  
- 若未配置 LLM 凭据或 SDK 初始化失败，自动降级为 **Stub 模式**：主进程按关键词读取本地缓存并模拟流式输出；README 与 UI 均标明状态。

> 说明：Pi 的 `ToolDefinition` 形态随版本可能变化。若与本仓库锁定版本不一致导致会话无法创建，应用仍可完整使用 Stub；请查阅 [Pi SDK 文档](https://pi.dev/docs/latest/sdk) 调整 `src/main/pi/sports-agent.ts`。

## 数据合规（强制）

- 仅使用**官方授权 API** 与 **RSS** 等公开订阅源。  
- **禁止**：抓包、逆向、未授权接口、抓取直播吧 / 头条等第三方站点。  
- P1 接入真实数据源时，须在适配器层实现速率限制、密钥保护与来源标注。

## 配置 API 密钥

在应用「设置」中填写（显示「已配置 / 未配置」，不回显完整密钥）：

- API-Sports（足球等）
- BALLDONTLIE（NBA）
- PandaScore（电竞等）
- 斯诺克可选 HTTP Header

保存至 `%USERPROFILE%\.sportdesk\secrets.json`。

## P1 规划（未实现）

- 真实 API 适配器与错误重试  
- RSS 拉取与摘要 pipeline  
- 定时刷新与 08:00 自动生成简报  
- 系统托盘、通知、开机自启（Windows）  
- Pi 会话持久化与更丰富的体育系统提示词  

## 许可证

MIT
