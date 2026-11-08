import { existsSync, readFileSync, writeFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'
import { SportDeskPaths, ensureDir } from './paths'
import type { SecretsStatus } from './types'

export interface SecretsFile {
  apiSportsKey?: string
  balldontlieKey?: string
  pandascoreKey?: string
  snookerApiHeader?: string
}

/**
 * 从进程环境或 ~/.sportdesk/secrets.json 加载密钥（仓库内不含真实值）。
 */
export function loadSecrets(): SecretsFile {
  const fromFile = readSecretsFile()
  return {
    apiSportsKey: process.env.API_SPORTS_KEY || fromFile.apiSportsKey,
    balldontlieKey: process.env.BALLDONTLIE_KEY || fromFile.balldontlieKey,
    pandascoreKey: process.env.PANDASCORE_KEY || fromFile.pandascoreKey,
    snookerApiHeader: process.env.SNOOKER_API_HEADER || fromFile.snookerApiHeader
  }
}

/**
 * 读取 secrets.json。
 */
function readSecretsFile(): SecretsFile {
  const path = SportDeskPaths.secrets()
  if (!existsSync(path)) {
    return {}
  }
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as SecretsFile
  } catch {
    return {}
  }
}

/**
 * 保存密钥到 ~/.sportdesk/secrets.json（不含进 Git）。
 */
export function saveSecrets(secrets: Partial<SecretsFile>): void {
  ensureDir(SportDeskPaths.home())
  const merged = { ...readSecretsFile(), ...secrets }
  writeFileSync(SportDeskPaths.secrets(), JSON.stringify(merged, null, 2), 'utf-8')
}

/**
 * 返回各密钥是否已配置（不泄露完整值）。
 */
export function getSecretsStatus(piReady: boolean): SecretsStatus {
  const s = loadSecrets()
  const has = (v?: string) => Boolean(v && v.trim().length > 0)
  return {
    apiSports: has(s.apiSportsKey),
    balldontlie: has(s.balldontlieKey),
    pandascore: has(s.pandascoreKey),
    snookerHeader: has(s.snookerApiHeader),
    piReady
  }
}

/**
 * 开发时也可从项目根 .env 加载（dotenv 未引入，仅文档说明；主路径为用户目录）。
 */
export function getEnvHintPath(): string {
  return join(homedir(), '.sportdesk', 'secrets.json')
}
