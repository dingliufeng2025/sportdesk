import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { getAgentDir } from '@earendil-works/pi-coding-agent'

/** 提供商与环境变量映射（与 Pi CLI 常用约定一致） */
const PROVIDER_ENV_KEYS: Record<string, string[]> = {
  deepseek: ['DEEPSEEK_API_KEY'],
  anthropic: ['ANTHROPIC_API_KEY'],
  openai: ['OPENAI_API_KEY'],
  google: ['GOOGLE_API_KEY', 'GEMINI_API_KEY']
}

type AuthJson = Record<string, { api_key?: string; type?: string } | string>

/**
 * 读取 ~/.pi/agent/auth.json 中已配置的 provider 列表。
 */
export function readAuthJsonProviders(): Set<string> {
  const providers = new Set<string>()
  try {
    const authPath = join(getAgentDir(), 'auth.json')
    if (!existsSync(authPath)) {
      return providers
    }
    const raw = JSON.parse(readFileSync(authPath, 'utf-8')) as AuthJson
    for (const [key, value] of Object.entries(raw)) {
      if (key.startsWith('_')) {
        continue
      }
      if (typeof value === 'string' && value.trim()) {
        providers.add(key)
        continue
      }
      if (value && typeof value === 'object') {
        const apiKey = value.api_key
        if (typeof apiKey === 'string' && apiKey.trim()) {
          providers.add(key)
        }
      }
    }
  } catch {
    return providers
  }
  return providers
}

/**
 * 判断 provider 是否在环境变量或 auth.json 中具备凭据。
 */
export function isProviderAuthConfigured(
  provider: string,
  runtimeHasAuth?: (providerId: string) => boolean
): boolean {
  if (runtimeHasAuth?.(provider)) {
    return true
  }
  for (const envKey of PROVIDER_ENV_KEYS[provider] ?? [`${provider.toUpperCase()}_API_KEY`]) {
    const val = process.env[envKey]
    if (val?.trim()) {
      return true
    }
  }
  return readAuthJsonProviders().has(provider)
}

/**
 * 返回 Pi 使用的 agent 目录（~/.pi/agent）。
 */
export function resolvePiAgentDir(): string {
  return getAgentDir()
}
