import { useCallback, useEffect, useMemo, useState } from 'react'
import { TopBar } from './components/TopBar'
import { FollowingBoard } from './components/FollowingBoard'
import { ScheduleTimeline } from './components/ScheduleTimeline'
import { SmartBriefPanel } from './components/SmartBriefPanel'
import { AiFloatingPet } from './components/AiFloatingPet'
import { SettingsModal } from './components/SettingsModal'
import { DigestModal } from './components/DigestModal'
import type { SportFilter, FixtureItem, NewsItem, FollowingItem } from './types'

/**
 * SportDesk 主界面：内容居中展示，AI 为角落悬浮助手。
 */
export default function App() {
  const [dayOffset, setDayOffset] = useState(0)
  const [sportFilter, setSportFilter] = useState<SportFilter>('all')
  const [timeline, setTimeline] = useState<FixtureItem[]>([])
  const [allDayFixtures, setAllDayFixtures] = useState<FixtureItem[]>([])
  const [finished, setFinished] = useState<FixtureItem[]>([])
  const [news, setNews] = useState<NewsItem[]>([])
  const [following, setFollowing] = useState<FollowingItem[]>([])
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
    const [tl, allFx, fin, nw, fl] = await Promise.all([
      window.sportdesk.getTimeline(sportFilter, dayOffset),
      window.sportdesk.getFixtures('all', dayOffset),
      window.sportdesk.getFinished(sportFilter, dayOffset),
      window.sportdesk.getNews(sportFilter),
      window.sportdesk.getFollowing()
    ])
    setTimeline(tl)
    setAllDayFixtures(allFx)
    setFinished(fin)
    setNews(nw)
    setFollowing(fl)
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
    <div className="workbench-shell">
      <div className="workbench-bg" aria-hidden />
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
      <main className="workbench-grid">
        <FollowingBoard items={following} allFixtures={allDayFixtures} />
        <ScheduleTimeline fixtures={timeline} dayLabel={dayLabel} />
        <SmartBriefPanel news={news} finished={finished} finishedTitle={finishedTitle} />
      </main>
      <AiFloatingPet piMode={piMode} initError={piError} following={following} />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <DigestModal open={digestOpen} onClose={() => setDigestOpen(false)} />
    </div>
  )
}
