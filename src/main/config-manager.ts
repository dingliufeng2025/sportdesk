import { readFileSync, writeFileSync, existsSync } from 'fs'
import { SportDeskPaths, ensureDir } from './paths'
import type { SportDeskConfig, FollowingItem } from './types'
import { defaultFollowing } from './data/sample-following'

const DEFAULT_CONFIG: SportDeskConfig = {
  following: defaultFollowing,
  rssPlaceholders: [
    { name: '官方 RSS 占位', url: 'https://example.com/rss/football' }
  ],
  refreshIntervalMinutes: 15,
  digestTime: '08:00',
  timezone: 'Asia/Shanghai',
  aiModel: {
    provider: 'deepseek',
    modelId: 'deepseek-flash'
  }
}

/**
 * 初始化用户目录与默认配置文件。
 */
export function initUserData(): void {
  ensureDir(SportDeskPaths.home())
  ensureDir(SportDeskPaths.cache())
  if (!existsSync(SportDeskPaths.config())) {
    writeFileSync(SportDeskPaths.config(), JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf-8')
  }
}

/**
 * 读取本地 config.json。
 */
export function loadConfig(): SportDeskConfig {
  initUserData()
  const raw = readFileSync(SportDeskPaths.config(), 'utf-8')
  return JSON.parse(raw) as SportDeskConfig
}

/**
 * 保存配置到 config.json。
 */
export function saveConfig(config: SportDeskConfig): void {
  writeFileSync(SportDeskPaths.config(), JSON.stringify(config, null, 2), 'utf-8')
}

/**
 * 更新关注列表。
 */
export function updateFollowing(following: FollowingItem[]): void {
  const config = loadConfig()
  config.following = following
  saveConfig(config)
}
