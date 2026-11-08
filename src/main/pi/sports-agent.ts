import type { BrowserWindow } from 'electron'
import type { Model } from '@earendil-works/pi-ai/compat'
import { getFixtures, getFollowing, getNews, getStandings } from '../adapters/fake-adapters'
import { loadConfig, saveConfig } from '../config-manager'
import type { PiModelOption, PiModelState } from '../types'

type AgentSession = {
  dispose: () => void
  prompt: (msg: string) => Promise<void>
  subscribe?: (cb: (e: unknown) => void) => void
  model?: Model<any>
  modelRuntime?: {
    getModels: () => readonly Model<any>[]
    getModel: (provider: string, modelId: string) => Model<any> | undefined
    hasConfiguredAuth: (provider: string) => boolean
  }
  setModel?: (model: Model<any>, options?: { persist?: boolean }) => Promise<void>
}

let agentSession: AgentSession | null = null
let piMode: 'sdk' | 'stub' = 'stub'
let initError: string | undefined
let catalogRuntime: AgentSession['modelRuntime'] | null = null

/** Stub 模式下仍展示的典型模型占位（与 Pi catalog 命名对齐） */
const STUB_MODEL_CATALOG: PiModelOption[] = [
  { provider: 'anthropic', modelId: 'claude-sonnet-4-5', displayName: 'anthropic / claude-sonnet-4-5', authConfigured: false },
  { provider: 'anthropic', modelId: 'claude-opus-4-5', displayName: 'anthropic / claude-opus-4-5', authConfigured: false },
  { provider: 'openai', modelId: 'gpt-4.1', displayName: 'openai / gpt-4.1', authConfigured: false },
  { provider: 'openai', modelId: 'gpt-5.2', displayName: 'openai / gpt-5.2', authConfigured: false },
  { provider: 'google', modelId: 'gemini-2.5-pro', displayName: 'google / gemini-2.5-pro', authConfigured: false }
]

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
function stubReply(userText: string, modelLabel: string): string {
  const lower = userText.toLowerCase()
  if (lower.includes('赛程') || lower.includes('fixture')) {
    const fx = getFixtures().slice(0, 5)
    return `【Stub · ${modelLabel}】本地缓存赛程（前 5 场）：\n${fx.map((f) => `· ${f.status === 'live' ? '🔴' : ''}${f.league} ${f.home} vs ${f.away}`).join('\n')}`
  }
  if (lower.includes('关注')) {
    const fl = getFollowing()
    return `【Stub · ${modelLabel}】当前关注：\n${fl.map((x) => `· ${x.name}${x.meta ? `（${x.meta}）` : ''}`).join('\n')}`
  }
  if (lower.includes('新闻')) {
    return `【Stub · ${modelLabel}】新闻摘要：\n${getNews().slice(0, 3).map((n) => `· ${n.title}`).join('\n')}`
  }
  if (lower.includes('积分') || lower.includes('standing')) {
    return `【Stub】积分榜占位数据已加载：${JSON.stringify(getStandings()).slice(0, 200)}…`
  }
  return (
    `【SportDesk · Stub】当前模型偏好：${modelLabel}（未配置 Pi 凭据，回复为本地演示）。\n` +
    '试试：「今天的赛程」「我的关注」「新闻摘要」。\n' +
    `你的问题：${userText}`
  )
}

/**
 * 读取配置中的模型偏好标签。
 */
function configuredModelLabel(): string {
  const cfg = loadConfig()
  if (cfg.aiModel?.provider && cfg.aiModel?.modelId) {
    return `${cfg.aiModel.provider}/${cfg.aiModel.modelId}`
  }
  return 'stub-default'
}

/**
 * 解析 createAgentSession 使用的初始模型。
 */
async function resolveInitialModel(
  runtime: NonNullable<AgentSession['modelRuntime']>
): Promise<Model<any> | undefined> {
  const cfg = loadConfig()
  if (!cfg.aiModel?.provider || !cfg.aiModel?.modelId) {
    return undefined
  }
  return runtime.getModel(cfg.aiModel.provider, cfg.aiModel.modelId)
}

/**
 * 懒加载仅用于模型目录的 ModelRuntime（会话未创建时）。
 */
async function ensureCatalogRuntime(): Promise<AgentSession['modelRuntime'] | null> {
  if (catalogRuntime) {
    return catalogRuntime
  }
  if (agentSession?.modelRuntime) {
    catalogRuntime = agentSession.modelRuntime
    return catalogRuntime
  }
  try {
    const pi = await import('@earendil-works/pi-coding-agent')
    const runtime = await pi.ModelRuntime.create({ refreshOnCreate: false })
    catalogRuntime = runtime
    return catalogRuntime
  } catch {
    return null
  }
}

/**
 * 将 ModelRuntime 中的模型映射为 UI 选项。
 */
function mapRuntimeModels(runtime: NonNullable<AgentSession['modelRuntime']>): PiModelOption[] {
  return runtime.getModels().map((m) => ({
    provider: m.provider,
    modelId: m.id,
    displayName: `${m.provider} / ${m.id}`,
    authConfigured: runtime.hasConfiguredAuth(m.provider)
  }))
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

    const bootstrap = await createAgentSession({
      sessionManager: SessionManager.inMemory(),
      settingsManager: SettingsManager.inMemory(),
      tools: [],
      noTools: 'all',
      customTools: customTools as never,
      cwd: process.cwd()
    })

    const { session } = bootstrap
    agentSession = session as AgentSession
    catalogRuntime = session.modelRuntime
    piMode = 'sdk'

    const initial = await resolveInitialModel(session.modelRuntime)
    if (initial && session.setModel) {
      try {
        await session.setModel(initial, { persist: false })
      } catch (modelErr) {
        initError =
          modelErr instanceof Error ? modelErr.message : String(modelErr)
      }
    }

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
    agentSession = null
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

  if (piMode === 'sdk' && agentSession) {
    try {
      await agentSession.prompt(text)
      emitPiEvent(win, { type: 'done' })
      return
    } catch (err) {
      emitPiEvent(win, {
        type: 'error',
        message: err instanceof Error ? err.message : String(err)
      })
    }
  }

  const reply = stubReply(text, configuredModelLabel())
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
 * 列出 Pi SDK 模型目录；Stub 时返回占位 + 静态 catalog（若可加载）。
 */
export async function listPiModels(): Promise<PiModelOption[]> {
  const runtime = await ensureCatalogRuntime()
  if (runtime && runtime.getModels().length > 0) {
    const mapped = mapRuntimeModels(runtime)
    return mapped.length > 0 ? mapped.slice(0, 80) : STUB_MODEL_CATALOG
  }
  return STUB_MODEL_CATALOG
}

/**
 * 当前选中模型与运行模式。
 */
export function getPiModelState(): PiModelState {
  const cfg = loadConfig()
  const fromSession =
    agentSession?.model?.provider && agentSession.model.id
      ? { provider: agentSession.model.provider, modelId: agentSession.model.id }
      : null
  const fromConfig =
    cfg.aiModel?.provider && cfg.aiModel?.modelId
      ? { provider: cfg.aiModel.provider, modelId: cfg.aiModel.modelId }
      : { provider: 'anthropic', modelId: 'claude-sonnet-4-5' }
  return {
    provider: fromSession?.provider ?? fromConfig.provider,
    modelId: fromSession?.modelId ?? fromConfig.modelId,
    mode: piMode
  }
}

/**
 * 切换模型：持久化到 config；SDK 模式下调用 session.setModel。
 */
export async function setPiModel(
  provider: string,
  modelId: string
): Promise<{ ok: boolean; stubOnly?: boolean; error?: string }> {
  const cfg = loadConfig()
  cfg.aiModel = { provider, modelId }
  saveConfig(cfg)

  if (piMode !== 'sdk' || !agentSession?.setModel || !agentSession.modelRuntime) {
    return { ok: true, stubOnly: true }
  }

  const model = agentSession.modelRuntime.getModel(provider, modelId)
  if (!model) {
    return { ok: false, error: `未找到模型 ${provider}/${modelId}` }
  }
  if (!agentSession.modelRuntime.hasConfiguredAuth(provider)) {
    return { ok: true, stubOnly: true, error: '该提供商未配置 API 凭据，仍将使用 Stub 回复' }
  }

  try {
    await agentSession.setModel(model, { persist: false })
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

/**
 * 释放 Pi 会话资源。
 */
export function disposeSportsAgent(): void {
  if (agentSession) {
    agentSession.dispose()
    agentSession = null
  }
}
