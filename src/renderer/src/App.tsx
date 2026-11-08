import { useCallback, useEffect, useState } from 'react'
import { TopBar } from './components/TopBar'
import { FollowingBoard } from './components/FollowingBoard'
import { FixturesPanel } from './components/FixturesPanel'
import { NewsPanel } from './components/NewsPanel'
import { AiChatPanel } from './components/AiChatPanel'
import { SettingsModal } from './components/SettingsModal'
import { DigestModal } from './components/DigestModal'
import type { SportFilter, FixtureItem, NewsItem, FollowingItem } from './types'

/**
 * SportDesk 主界面：五区块布局 + 弹窗。
 */
export default function App() {
  const [timeMode, setTimeMode] = useState<'today' | 'week'>('today')
  const [sportFilter, setSportFilter] = useState<SportFilter>('all')
  const [fixtures, setFixtures] = useState<FixtureItem[]>([])
  const [news, setNews] = useState<NewsItem[]>([])
  const [following, setFollowing] = useState<FollowingItem[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [digestOpen, setDigestOpen] = useState(false)
  const [piMode, setPiMode] = useState('stub')
  const [piError, setPiError] = useState<string>()

  const loadData = useCallback(async () => {
    const [fx, nw, fl] = await Promise.all([
      window.sportdesk.getFixtures(sportFilter, timeMode),
      window.sportdesk.getNews(sportFilter),
      window.sportdesk.getFollowing()
    ])
    setFixtures(fx)
    setNews(nw)
    setFollowing(fl)
  }, [sportFilter, timeMode])

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

  return (
    <div className="app-shell">
      <TopBar
        timeMode={timeMode}
        onTimeModeChange={setTimeMode}
        sportFilter={sportFilter}
        onSportFilterChange={setSportFilter}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenDigest={() => setDigestOpen(true)}
      />
      <div className="main-grid">
        <FollowingBoard items={following} />
        <FixturesPanel fixtures={fixtures} />
        <NewsPanel news={news} />
      </div>
      <AiChatPanel piMode={piMode} initError={piError} />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <DigestModal open={digestOpen} onClose={() => setDigestOpen(false)} />
    </div>
  )
}
