export type SportFilter =
  | 'all'
  | 'football'
  | 'nba'
  | 'china'
  | 'tennis'
  | 'snooker'
  | 'lol'
  | 'honor'

export interface FollowingItem {
  id: string
  type: 'league' | 'team' | 'note'
  sport: SportFilter
  name: string
  meta?: string
  externalUrl?: string
}

export interface FixtureItem {
  id: string
  sport: SportFilter
  league: string
  home: string
  away: string
  homeScore?: number
  awayScore?: number
  status: 'live' | 'scheduled' | 'finished'
  kickoff: string
  minute?: number
}

export interface NewsItem {
  id: string
  title: string
  summary: string
  source: string
  publishedAt: string
  sport: SportFilter
  url?: string
}

export interface AiPetPosition {
  /** 距窗口左边的像素坐标 */
  x: number
  /** 距窗口顶部的像素坐标 */
  y: number
}

export interface AiModelSelection {
  provider: string
  modelId: string
}

export interface SportDeskConfig {
  following: FollowingItem[]
  rssPlaceholders: { name: string; url: string }[]
  refreshIntervalMinutes: number
  digestTime: string
  timezone: string
  /** 悬浮助手位置（写入 ~/.sportdesk/config.json） */
  aiPet?: AiPetPosition
  /** 用户选择的 Pi 模型 */
  aiModel?: AiModelSelection
}

/** Pi 模型列表项（渲染进程展示用） */
export interface PiModelOption {
  provider: string
  modelId: string
  displayName: string
  authConfigured: boolean
}

export interface PiModelState {
  provider: string
  modelId: string
  mode: 'sdk' | 'stub'
}

export interface SecretsStatus {
  apiSports: boolean
  balldontlie: boolean
  pandascore: boolean
  snookerHeader: boolean
  piReady: boolean
}

export interface DigestSection {
  title: string
  items: string[]
}
