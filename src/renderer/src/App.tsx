import { useCallback, useEffect, useMemo, useState } from 'react'
import { TopBar } from './components/TopBar'
import { FollowingBoard } from './components/FollowingBoard'
import { ScheduleTimeline } from './components/ScheduleTimeline'
import { RightSidebar } from './components/RightSidebar'
import { AiChatDrawer } from './components/AiChatDrawer'
import { SettingsModal } from './components/SettingsModal'
import { DigestModal } from './components/DigestModal'
import type { SportFilter, FixtureItem, NewsItem, FollowingItem } from './types'

interface StandingRow {
  league: string
  team: string
  played: number
  points: number
}

/**
 * SportDesk 主界面：赛程时间线优先的三栏布局。
 */
export default function App() {
  const [dayOffset, setDayOffset] = useState(0)
  const [sportFilter, setSportFilter] = useState<SportFilter>('all')
  const [timeline, setTimeline] = useState<FixtureItem[]>([])
  const [allDayFixtures, setAllDayFixtures] = useState<FixtureItem[]>([])
  const [finished, setFinished] = useState<FixtureItem[]>([])
  const [news, setNews] = useState<NewsItem[]>([])
  const [following, setFollowing] = useState<FollowingItem[]>([])
  const [standings, setStandings] = useState<StandingRow[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [digestOpen, setDigestOpen] = useState(false)
  const [piMode, setPiMode] = useState('stub')
  const [piError, setPiError] = useState<string>()

  const dayLabel = useMemo(() => {
    if (dayOffset === 0) {
      return '今日'
    }
    if (dayOffset === 1) {
      return '明日'
    }
    if (dayOffset === 2) {
      return '后天'
    }
    return '当日'
  }, [dayOffset])

  const loadData = useCallback(async () => {
    const [tl, allFx, fin, nw, fl, st] = await Promise.all([
      window.sportdesk.getTimeline(sportFilter, dayOffset),
      window.sportdesk.getFixtures('all', dayOffset),
      window.sportdesk.getFinished(sportFilter, dayOffset),
      window.sportdesk.getNews(sportFilter),
      window.sportdesk.getFollowing(),
      window.sportdesk.getStandings()
    ])
    setTimeline(tl)
    setAllDayFixtures(allFx)
    setFinished(fin)
    setNews(nw)
    setFollowing(fl)
    setStandings(Array.isArray(st) ? (st as StandingRow[]) : [])
  }, [sportFilter, dayOffset])

  useEffect(() => {
    void loadData()
  }, [loadData])

  useEffect(() => {
    void (async () => {
      const init = await window.sportdesk.initSession()
      setPiMode(init.mode)
      setPiError(init.error)
      const mode = await window.sportdesk.getPiMode()
      setPiMode(mode.mode)
      setPiError(mode.initError)
    })()
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await window.sportdesk.refreshData()
      await loadData()
    } finally {
      setRefreshing(false)
    }
  }

  const finishedTitle = dayOffset === 0 ? '今日完场' : `${dayLabel}完场`

  return (
    <div className="app-shell">
      <TopBar
        dayOffset={dayOffset}
        onDayOffsetChange={setDayOffset}
        sportFilter={sportFilter}
        onSportFilterChange={setSportFilter}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenDigest={() => setDigestOpen(true)}
      />
      <div className="home-layout">
        <FollowingBoard items={following} allFixtures={allDayFixtures} />
        <ScheduleTimeline fixtures={timeline} dayLabel={dayLabel} />
        <RightSidebar
          finished={finished}
          news={news}
          standings={standings}
          finishedTitle={finishedTitle}
        />
      </div>
      <AiChatDrawer piMode={piMode} initError={piError} />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <DigestModal open={digestOpen} onClose={() => setDigestOpen(false)} />
    </div>
  )
}
