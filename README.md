# SportDesk

个人体育 **AI 桌面工作台**（Windows 优先）— Electron + React + TypeScript。

深色玻璃态界面以 **AI 对话为主舞台**，将赛程、关注、智能摘要编排为工作台模块（非传统体育门户首页）。数据当前为**假数据适配器**；正式 API 密钥由用户本地配置，不进入 Git。

## 环境要求

- **Windows 10/11**（主要目标；macOS / Linux 亦可开发调试）
- **Node.js 20+**（推荐 LTS）
- npm 10+

## 快速开始（Windows）

```powershell
cd <项目目录>
npm install
npm run dev
```

- `npm run build` — 构建主进程、预加载与渲染进程
- `npm run start` — 预览已构建产物
- `npm run pack` — 打包安装包（需先 `build`）

首次启动会在用户目录创建 `%USERPROFILE%\.sportdesk\`（`config.json`、`cache\`、`secrets.json`）。详见下文「配置 API 密钥」。

## AI 工作台布局（当前 UI）

| 区域 | 作用 |
|------|------|
| **顶栏** | 品牌、运动上下文 Chip、今日/明日/后天、刷新、简报、设置 |
| **左栏** | **关注看板**：渐变徽章、运动图标、下场倒计时、进行中脉冲 |
| **中央（主）** | **AI 体育工作台**：流式对话、建议提示 Chip、关注上下文 Chip、每日简报入口 |
| **中央下** | **赛程轴**：时间线节点 + 横向滑动对阵卡（比分层级、直播高亮） |
| **右栏** | **AI 速览卡**（情绪胶囊 + 摘要）与完场结果 Pill |
| **弹层** | 生成式风格的每日简报、API 设置 |

王者荣耀：**不提供实时比分**，仅关注备注与官网外链。

## 架构

```
src/
  main/           # Electron 主进程：配置、假数据、Pi 会话、IPC
  preload/        # contextBridge → window.sportdesk
  renderer/       # React 工作台 UI（中文）
```

假数据：`src/main/adapters/fake-adapters.ts`。Pi SDK：`src/main/pi/sports-agent.ts`（未配置密钥时 **Stub 流式演示**）。

## 数据合规（强制）

- 仅使用**官方授权 API** 与 **RSS**。
- **禁止**：抓包、逆向、未授权接口、抓取直播吧 / 头条等第三方站点。

## 配置 API 密钥

应用内「设置」填写，保存至 `%USERPROFILE%\.sportdesk\secrets.json`。

## 许可证

MIT
