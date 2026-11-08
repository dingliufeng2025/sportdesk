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

export interface SportDeskConfig {
  following: FollowingItem[]
  rssPlaceholders: { name: string; url: string }[]
  refreshIntervalMinutes: number
  digestTime: string
  timezone: string
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
