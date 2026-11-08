import type { BrowserWindow } from 'electron'
import type { Model } from '@earendil-works/pi-ai/compat'
import { getFixtures, getFollowing, getNews, getStandings } from '../adapters/fake-adapters'
import { loadConfig, saveConfig } from '../config-manager'
import type { PiModelOption, PiModelState } from '../types'
import { isProviderAuthConfigured, readAuthJsonProviders, resolvePiAgentDir } from './pi-auth'

type PiRuntime = {
  getModels: (provider?: string) => readonly Model<any>[]
  getModel: (provider: string, modelId: string) => Model<any> | undefined
  hasConfiguredAuth: (provider: string) => boolean
}

type AgentSession = {
  dispose: () => void
  prompt: (msg: string) => Promise<void>
  subscribe?: (cb: (e: unknown) => void) => void
  model?: Model<any>
  modelRuntime?: PiRuntime
  setModel?: (model: Model<any>, options?: { persist?: boolean }) => Promise<void>
}

let agentSession: AgentSession | null = null
let piMode: 'sdk' | 'stub' = 'stub'
let initError: string | undefined
let catalogRuntime: PiRuntime | null = null

/** 常用占位模型（含 DeepSeek），在 catalog 截断时保证仍可选 */
const SUPPLEMENTAL_CATALOG: Array<{ provider: string; modelId: string }> = [
  { provider: 'deepseek', modelId: 'deepseek-flash' },
  { provider: 'deepseek', modelId: 'deepseek-v4-pro' },
  { provider: 'anthropic', modelId: 'claude-sonnet-4-5' },
  { provider: 'openai', modelId: 'gpt-4.1' },
  { provider: 'google', modelId: 'gemini-2.5-pro' }
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
    `【SportDesk · Stub】当前模型偏好：${modelLabel}（会话未连上 Pi 或凭据未生效时仅为本地演示）。\n` +
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
  return 'deepseek/deepseek-flash'
}

/**
 * 解析 createAgentSession 使用的初始模型。
 */
function resolveInitialModel(runtime: PiRuntime): Model<any> | undefined {
  const cfg = loadConfig()
  if (!cfg.aiModel?.provider || !cfg.aiModel?.modelId) {
    return runtime.getModel('deepseek', 'deepseek-flash')
  }
  return runtime.getModel(cfg.aiModel.provider, cfg.aiModel.modelId)
}

/**
 * 创建与 Pi CLI 一致的 ModelRuntime（读取 ~/.pi/agent/auth.json）。
 */
async function createPiRuntime(): Promise<PiRuntime | null> {
  try {
    const pi = await import('@earendil-works/pi-coding-agent')
    const agentDir = resolvePiAgentDir()
    const runtime = await pi.ModelRuntime.create({
      refreshOnCreate: false,
      authPath: `${agentDir}/auth.json`
    })
    return runtime
  } catch {
    return null
  }
}

/**
 * 懒加载模型目录运行时。
 */
async function ensureCatalogRuntime(): Promise<PiRuntime | null> {
  if (catalogRuntime) {
    return catalogRuntime
  }
  if (agentSession?.modelRuntime) {
    catalogRuntime = agentSession.modelRuntime
    return catalogRuntime
  }
  catalogRuntime = await createPiRuntime()
  return catalogRuntime
}

/**
 * 映射单个模型为下拉选项。
 */
function toOption(runtime: PiRuntime, m: Model<any>): PiModelOption {
  return {
    provider: m.provider,
    modelId: m.id,
    displayName: `${m.provider} / ${m.id}`,
    authConfigured: isProviderAuthConfigured(m.provider, (p) => runtime.hasConfiguredAuth(p))
  }
}

/**
 * 合并目录：已配置 provider 优先，并确保 DeepSeek / 用户配置模型不丢失。
 */
function buildModelCatalog(runtime: PiRuntime): PiModelOption[] {
  const cfg = loadConfig()
  const authProviders = readAuthJsonProviders()
  if (cfg.aiModel?.provider) {
    authProviders.add(cfg.aiModel.provider)
  }

  const all = runtime.getModels().map((m) => toOption(runtime, m))
  const byKey = new Map<string, PiModelOption>()
  for (const opt of all) {
    byKey.set(`${opt.provider}::${opt.modelId}`, opt)
  }

  for (const extra of SUPPLEMENTAL_CATALOG) {
    const key = `${extra.provider}::${extra.modelId}`
    if (byKey.has(key)) {
      continue
    }
    const model = runtime.getModel(extra.provider, extra.modelId)
    if (model) {
      byKey.set(key, toOption(runtime, model))
    } else {
      byKey.set(key, {
        provider: extra.provider,
        modelId: extra.modelId,
        displayName: `${extra.provider} / ${extra.modelId}`,
        authConfigured: isProviderAuthConfigured(extra.provider, (p) => runtime.hasConfiguredAuth(p))
      })
    }
  }

  const sorted = [...byKey.values()].sort((a, b) => {
    const aPri = authProviders.has(a.provider) ? 0 : 1
    const bPri = authProviders.has(b.provider) ? 0 : 1
    if (aPri !== bPri) {
      return aPri - bPri
    }
    if (a.provider === 'deepseek' && b.provider !== 'deepseek') {
      return -1
    }
    if (b.provider === 'deepseek' && a.provider !== 'deepseek') {
      return 1
    }
    return a.displayName.localeCompare(b.displayName)
  })

  return sorted
}

/**
 * 尝试注册 Pi 只读 customTools（禁止 bash/write）。
 */
async function tryInitPiSession(win: BrowserWindow): Promise<boolean> {
  try {
    const pi = await import('@earendil-works/pi-coding-agent')
    const { createAgentSession, SessionManager, SettingsManager } = pi
    const agentDir = resolvePiAgentDir()

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
      agentDir,
      sessionManager: SessionManager.inMemory(),
      settingsManager: SettingsManager.inMemory(),
      tools: [],
      noTools: 'all',
      customTools: customTools as never,
      cwd: process.cwd()
    })

    const { session } = bootstrap
    agentSession = session as AgentSession
    catalogRuntime = session.modelRuntime ?? null
    piMode = 'sdk'

    const runtime = session.modelRuntime
    if (runtime) {
      const initial = resolveInitialModel(runtime)
      if (initial && session.setModel) {
        const authed = isProviderAuthConfigured(initial.provider, (p) => runtime.hasConfiguredAuth(p))
        if (!authed) {
          initError = `提供商 ${initial.provider} 未检测到凭据（auth.json 或环境变量）`
        } else {
          try {
            await session.setModel(initial, { persist: false })
          } catch (modelErr) {
            initError = modelErr instanceof Error ? modelErr.message : String(modelErr)
          }
        }
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
  return { mode: ok ? 'sdk' : 'stub', error: ok ? initError : initError }
}

/**
 * 处理用户消息：优先 Pi prompt，否则流式 Stub 回复。
 */
export async function sendSportsAgentMessage(win: BrowserWindow, text: string): Promise<void> {
  emitPiEvent(win, { type: 'user', text })

  const cfg = loadConfig()
  const preferSdk =
    piMode === 'sdk' &&
    agentSession &&
    cfg.aiModel?.provider &&
    isProviderAuthConfigured(cfg.aiModel.provider, (p) => agentSession?.modelRuntime?.hasConfiguredAuth(p) ?? false)

  if (preferSdk && agentSession) {
    try {
      await agentSession.prompt(text)
      emitPiEvent(win, { type: 'done' })
      return
    } catch (err) {
      emitPiEvent(win, {
        type: 'error',
        message: err instanceof Error ? err.message : String(err)
      })
      emitPiEvent(win, { type: 'done' })
      return
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
 * 列出 Pi SDK 模型目录；合并 DeepSeek 与已配置 provider。
 */
export async function listPiModels(): Promise<PiModelOption[]> {
  const runtime = await ensureCatalogRuntime()
  if (runtime) {
    return buildModelCatalog(runtime)
  }
  return SUPPLEMENTAL_CATALOG.map((m) => ({
    provider: m.provider,
    modelId: m.modelId,
    displayName: `${m.provider} / ${m.modelId}`,
    authConfigured: isProviderAuthConfigured(m.provider)
  }))
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
      : { provider: 'deepseek', modelId: 'deepseek-flash' }
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

  const authed = isProviderAuthConfigured(provider, (p) => agentSession?.modelRuntime?.hasConfiguredAuth(p) ?? false)
  if (piMode !== 'sdk' || !agentSession?.setModel || !agentSession.modelRuntime) {
    return {
      ok: true,
      stubOnly: !authed,
      error: authed ? 'Pi 会话未就绪，已保存模型偏好' : '未检测到凭据，仍将使用 Stub 回复'
    }
  }

  const model = agentSession.modelRuntime.getModel(provider, modelId)
  if (!model) {
    return { ok: false, error: `未找到模型 ${provider}/${modelId}` }
  }
  if (!authed) {
    return { ok: true, stubOnly: true, error: '该提供商未配置 API 凭据，仍将使用 Stub 回复' }
  }

  try {
    await agentSession.setModel(model, { persist: false })
    initError = undefined
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
