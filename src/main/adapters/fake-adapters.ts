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
 * 判断开赛时间是否落在「今天 + dayOffset」的自然日（本地时区）。
 */
function isKickoffOnOffsetDay(iso: string, dayOffset: number): boolean {
  const kickoff = new Date(iso)
  const target = new Date()
  target.setHours(0, 0, 0, 0)
  target.setDate(target.getDate() + dayOffset)
  const end = new Date(target)
  end.setDate(end.getDate() + 1)
  return kickoff >= target && kickoff < end
}

function loadAllFixtures(): FixtureItem[] {
  seedCacheIfNeeded()
  const path = join(SportDeskPaths.cache(), CACHE_FILES.fixtures)
  if (existsSync(path)) {
    return JSON.parse(readFileSync(path, 'utf-8')) as FixtureItem[]
  }
  return sampleFixtures
}

function sortTimeline(items: FixtureItem[]): FixtureItem[] {
  return [...items].sort((a, b) => {
    const order = { live: 0, scheduled: 1, finished: 2 }
    if (order[a.status] !== order[b.status]) {
      return order[a.status] - order[b.status]
    }
    return a.kickoff.localeCompare(b.kickoff)
  })
}

/**
 * 从缓存或内存样本读取赛程（按运动筛选 + 日期偏移 0=今日 1=明日 2=后天）。
 */
export function getFixtures(filter: SportFilter = 'all', dayOffset = 0): FixtureItem[] {
  let items = loadAllFixtures()
  if (filter !== 'all') {
    items = items.filter((f) => f.sport === filter)
  }
  items = items.filter((f) => isKickoffOnOffsetDay(f.kickoff, dayOffset))
  return sortTimeline(items)
}

/**
 * 赛程时间线：不含已结束场次（完场在侧栏展示）。
 */
export function getTimelineFixtures(filter: SportFilter = 'all', dayOffset = 0): FixtureItem[] {
  return getFixtures(filter, dayOffset).filter((f) => f.status !== 'finished')
}

/**
 * 指定日期的完场比赛（侧栏摘要）。
 */
export function getFinishedFixtures(filter: SportFilter = 'all', dayOffset = 0): FixtureItem[] {
  let items = loadAllFixtures().filter((f) => f.status === 'finished')
  if (filter !== 'all') {
    items = items.filter((f) => f.sport === filter)
  }
  return items
    .filter((f) => isKickoffOnOffsetDay(f.kickoff, dayOffset))
    .sort((a, b) => b.kickoff.localeCompare(a.kickoff))
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
  const fixtures = getFixtures('all', 0)
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
