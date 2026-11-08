import type { BrowserWindow } from 'electron'
import { getFixtures, getFollowing, getNews, getStandings } from '../adapters/fake-adapters'

let piSession: { dispose: () => void; prompt: (msg: string) => Promise<void>; subscribe?: (cb: (e: unknown) => void) => void } | null = null
let piMode: 'sdk' | 'stub' = 'stub'
let initError: string | undefined

/**
 * 向渲染进程推送 Pi 事件流。
 */
function emitPiEvent(win: BrowserWindow, payload: unknown): void {
  if (!win.isDestroyed()) {
    win.webContents.send('pi:event', payload)
  }
}

/**
 * 本地只读工具的 Stub 实现（无 Pi SDK 时由主进程直接回答）。
 */
function stubReply(userText: string): string {
  const lower = userText.toLowerCase()
  if (lower.includes('赛程') || lower.includes('fixture')) {
    const fx = getFixtures().slice(0, 5)
    return `【Stub】本地缓存赛程（前 5 场）：\n${fx.map((f) => `· ${f.status === 'live' ? '🔴' : ''}${f.league} ${f.home} vs ${f.away}`).join('\n')}`
  }
  if (lower.includes('关注')) {
    const fl = getFollowing()
    return `【Stub】当前关注：\n${fl.map((x) => `· ${x.name}${x.meta ? `（${x.meta}）` : ''}`).join('\n')}`
  }
  if (lower.includes('新闻')) {
    return `【Stub】新闻摘要：\n${getNews().slice(0, 3).map((n) => `· ${n.title}`).join('\n')}`
  }
  if (lower.includes('积分') || lower.includes('standing')) {
    return `【Stub】积分榜占位数据已加载：${JSON.stringify(getStandings()).slice(0, 200)}…`
  }
  return (
    '【SportDesk AI · Stub 模式】未检测到可用的 Pi 模型凭据或 SDK 初始化失败。\n' +
    '你仍可通过只读工具查询本地缓存。试试问：「今天的赛程」「我的关注」「新闻摘要」。\n' +
    `你的问题：${userText}`
  )
}

/**
 * 尝试注册 Pi 只读 customTools（禁止 bash/write）。
 */
async function tryInitPiSession(win: BrowserWindow): Promise<boolean> {
  try {
    const pi = await import('@earendil-works/pi-coding-agent')
    const { createAgentSession, SessionManager, SettingsManager } = pi

    const customTools = [
      {
        name: 'get_fixtures',
        description: 'Read local cached fixtures (read-only)',
        parameters: { type: 'object', properties: { filter: { type: 'string' } } },
        execute: async () => JSON.stringify(getFixtures())
      },
      {
        name: 'get_standings',
        description: 'Read local cached standings (read-only)',
        parameters: { type: 'object', properties: {} },
        execute: async () => JSON.stringify(getStandings())
      },
      {
        name: 'get_news',
        description: 'Read local cached news (read-only)',
        parameters: { type: 'object', properties: {} },
        execute: async () => JSON.stringify(getNews())
      },
      {
        name: 'get_following',
        description: 'Read user following list from config (read-only)',
        parameters: { type: 'object', properties: {} },
        execute: async () => JSON.stringify(getFollowing())
      }
    ]

    const result = await createAgentSession({
      sessionManager: SessionManager.inMemory(),
      settingsManager: SettingsManager.inMemory(),
      tools: [],
      noTools: 'all',
      customTools: customTools as never,
      cwd: process.cwd()
    })

    const { session } = result
    piSession = session as typeof piSession
    piMode = 'sdk'

    if (session.subscribe) {
      session.subscribe((event: { type?: string; assistantMessageEvent?: { type?: string; delta?: string } }) => {
        emitPiEvent(win, event)
        if (
          event.type === 'message_update' &&
          event.assistantMessageEvent?.type === 'text_delta' &&
          event.assistantMessageEvent.delta
        ) {
          emitPiEvent(win, { type: 'text_delta', delta: event.assistantMessageEvent.delta })
        }
      })
    }
    return true
  } catch (err) {
    initError = err instanceof Error ? err.message : String(err)
    piMode = 'stub'
    piSession = null
    return false
  }
}

/**
 * 初始化体育 AI 会话（Pi SDK 或 Stub）。
 */
export async function initSportsAgent(win: BrowserWindow): Promise<{ mode: string; error?: string }> {
  const ok = await tryInitPiSession(win)
  return { mode: ok ? 'sdk' : 'stub', error: ok ? undefined : initError }
}

/**
 * 处理用户消息：优先 Pi prompt，否则流式 Stub 回复。
 */
export async function sendSportsAgentMessage(win: BrowserWindow, text: string): Promise<void> {
  emitPiEvent(win, { type: 'user', text })

  if (piMode === 'sdk' && piSession) {
    try {
      await piSession.prompt(text)
      emitPiEvent(win, { type: 'done' })
      return
    } catch (err) {
      emitPiEvent(win, {
        type: 'error',
        message: err instanceof Error ? err.message : String(err)
      })
    }
  }

  const reply = stubReply(text)
  const chunks = reply.match(/.{1,24}/g) ?? [reply]
  for (const chunk of chunks) {
    emitPiEvent(win, { type: 'text_delta', delta: chunk })
    await new Promise((r) => setTimeout(r, 20))
  }
  emitPiEvent(win, { type: 'done' })
}

/**
 * 当前 Pi 运行模式。
 */
export function getPiMode(): { mode: string; initError?: string } {
  return { mode: piMode, initError }
}

/**
 * 释放 Pi 会话资源。
 */
export function disposeSportsAgent(): void {
  if (piSession) {
    piSession.dispose()
    piSession = null
  }
}
