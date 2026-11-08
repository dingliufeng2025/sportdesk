import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { SportDeskPaths, ensureDir } from '../paths'
import { loadConfig } from '../config-manager'
import { sampleFixtures } from '../data/sample-fixtures'
import { sampleNews } from '../data/sample-news'
import type { FixtureItem, NewsItem, SportFilter, FollowingItem } from '../types'

const CACHE_FILES = {
  fixtures: 'fixtures.json',
  news: 'news.json',
  standings: 'standings.json'
} as const

/**
 * 将示例数据写入 ~/.sportdesk/cache/（首次启动）。
 */
export function seedCacheIfNeeded(): void {
  ensureDir(SportDeskPaths.cache())
  const base = SportDeskPaths.cache()
  if (!existsSync(join(base, CACHE_FILES.fixtures))) {
    writeFileSync(join(base, CACHE_FILES.fixtures), JSON.stringify(sampleFixtures, null, 2), 'utf-8')
  }
  if (!existsSync(join(base, CACHE_FILES.news))) {
    writeFileSync(join(base, CACHE_FILES.news), JSON.stringify(sampleNews, null, 2), 'utf-8')
  }
  if (!existsSync(join(base, CACHE_FILES.standings))) {
    writeFileSync(
      join(base, CACHE_FILES.standings),
      JSON.stringify(
        [
          { league: '英超', team: '阿森纳', played: 11, points: 25 },
          { league: '英超', team: '利物浦', played: 11, points: 24 }
        ],
        null,
        2
      ),
      'utf-8'
    )
  }
}

/**
 * 从缓存或内存样本读取赛程。
 */
export function getFixtures(filter: SportFilter = 'all', mode: 'today' | 'week' = 'today'): FixtureItem[] {
  seedCacheIfNeeded()
  const path = join(SportDeskPaths.cache(), CACHE_FILES.fixtures)
  let items: FixtureItem[] = sampleFixtures
  if (existsSync(path)) {
    items = JSON.parse(readFileSync(path, 'utf-8')) as FixtureItem[]
  }
  const filtered =
    filter === 'all' ? items : items.filter((f) => f.sport === filter)
  const sorted = [...filtered].sort((a, b) => {
    const order = { live: 0, scheduled: 1, finished: 2 }
    if (order[a.status] !== order[b.status]) {
      return order[a.status] - order[b.status]
    }
    return a.kickoff.localeCompare(b.kickoff)
  })
  if (mode === 'today') {
    return sorted.slice(0, 12)
  }
  return sorted
}

/**
 * 读取新闻摘要缓存。
 */
export function getNews(filter: SportFilter = 'all'): NewsItem[] {
  seedCacheIfNeeded()
  const path = join(SportDeskPaths.cache(), CACHE_FILES.news)
  let items: NewsItem[] = sampleNews
  if (existsSync(path)) {
    items = JSON.parse(readFileSync(path, 'utf-8')) as NewsItem[]
  }
  if (filter === 'all') {
    return items
  }
  return items.filter((n) => n.sport === filter)
}

/**
 * 读取关注列表（来自 config）。
 */
export function getFollowing(): FollowingItem[] {
  return loadConfig().following
}

/**
 * 读取积分榜占位缓存。
 */
export function getStandings(): unknown {
  seedCacheIfNeeded()
  const path = join(SportDeskPaths.cache(), CACHE_FILES.standings)
  if (existsSync(path)) {
    return JSON.parse(readFileSync(path, 'utf-8'))
  }
  return []
}

/**
 * 刷新：重写 cache 时间戳并返回最新假数据。
 */
export function refreshAllData(): { fixtures: FixtureItem[]; news: NewsItem[] } {
  seedCacheIfNeeded()
  writeFileSync(join(SportDeskPaths.cache(), 'last-refresh.txt'), new Date().toISOString(), 'utf-8')
  return { fixtures: getFixtures(), news: getNews() }
}

/**
 * 生成每日简报（P0 假数据）。
 */
export function generateDailyDigest(): { generatedAt: string; sections: { title: string; items: string[] }[] } {
  const fixtures = getFixtures('all', 'today')
  const live = fixtures.filter((f) => f.status === 'live')
  return {
    generatedAt: new Date().toISOString(),
    sections: [
      {
        title: '进行中',
        items: live.map((f) => `${f.league} ${f.home} ${f.homeScore ?? '-'}:${f.awayScore ?? '-'} ${f.away}`)
      },
      {
        title: '今日赛程',
        items: fixtures
          .filter((f) => f.status === 'scheduled')
          .slice(0, 5)
          .map((f) => `${f.kickoff.slice(11, 16)} ${f.league} ${f.home} vs ${f.away}`)
      },
      {
        title: '要闻',
        items: getNews().slice(0, 3).map((n) => n.title)
      }
    ]
  }
}
