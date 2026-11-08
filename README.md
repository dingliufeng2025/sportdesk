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

主界面 **一屏优先、无嵌套滚动**（1280×800 类桌面）：仅 **赛程横向滑动区** 可左右滚动。

| 区域 | 作用 |
|------|------|
| **顶栏** | 品牌、运动 Chip、日期、刷新、简报、设置（单行紧凑） |
| **左栏** | 关注双列紧凑瓷砖（图标 + 倒计时/直播） |
| **中央** | **赛程轴**（时间线 + 横向对阵卡，主视觉） |
| **右栏** | 3 条 AI 速览卡 + 完场横向 Pill |
| **右下角（可拖拽）** | **悬浮 AI 宠物**：idle/思考中动画；点击展开 **~480px 对话窗**；模型下拉（Pi catalog / Stub 占位） |
| **弹层** | 每日简报、API 设置 |

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
