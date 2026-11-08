import type { FixtureItem, FollowingItem } from '../types'

/**
 * 为关注项匹配最近一场未结束的赛程（一句话摘要）。
 */
export function nextMatchLine(item: FollowingItem, fixtures: FixtureItem[]): string | null {
  const candidates = fixtures
    .filter((f) => f.status !== 'finished')
    .filter((f) => matchesFollowing(item, f))
    .sort((a, b) => a.kickoff.localeCompare(b.kickoff))
  const next = candidates[0]
  if (!next) {
    return null
  }
  const time = formatShortTime(next.kickoff)
  if (next.status === 'live') {
    return `进行中 ${next.home} ${next.homeScore ?? '-'}:${next.awayScore ?? '-'} ${next.away}`
  }
  return `${time} ${next.home} vs ${next.away}`
}

function matchesFollowing(item: FollowingItem, f: FixtureItem): boolean {
  if (item.sport === 'honor') {
    return false
  }
  if (item.type === 'league') {
    if (item.name === f.league) {
      return true
    }
    if (item.sport === f.sport && item.sport !== 'football') {
      return true
    }
    if (item.sport === 'football' && f.sport === 'football') {
      const leagueNames = ['英超', '西甲', '意甲', '德甲', '法甲']
      if (leagueNames.includes(item.name) && f.league === item.name) {
        return true
      }
    }
  }
  if (item.type === 'team') {
    return f.home.includes(item.name) || f.away.includes(item.name) || item.name.includes(f.home)
  }
  return item.sport === f.sport
}

function formatShortTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}
