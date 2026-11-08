import { FileText } from 'lucide-react'
import type { NewsItem, FixtureItem } from '../types'
import { moodFromSummary } from '../utils/sportVisuals'
import { logoForSportFilter } from '../utils/leagueLogos'

interface SmartBriefPanelProps {
  news: NewsItem[]
  finished: FixtureItem[]
  finishedTitle: string
}

/**
 * 右侧摘要区：固定条数、无嵌套滚动，完场为横向 Pill 带。
 */
export function SmartBriefPanel({ news, finished, finishedTitle }: SmartBriefPanelProps) {
  return (
    <aside className="digest-rail glass-panel">
      <header className="module-head tight">
        <div className="module-head-icon brief-icon">
          <FileText size={15} />
        </div>
        <div>
          <h2>速览</h2>
          <span className="module-head-hint">AI 摘要卡</span>
        </div>
      </header>

      <div className="brief-cards static">
        {news.slice(0, 3).map((n) => {
            const mood = moodFromSummary(n.summary)
            const logo = logoForSportFilter(n.sport)
          return (
            <article key={n.id} className="brief-card compact">
              <div className="brief-card-top">
                <img className="team-badge-img" src={logo} alt="" width={22} height={22} />
                <span className={`mood-pill ${mood.className}`}>{mood.label}</span>
              </div>
              <h3 className="brief-card-title clamp">{n.title}</h3>
              <p className="brief-card-summary clamp-2">{truncateSummary(n.summary, 48)}</p>
            </article>
          )
        })}
      </div>

      <div className="finish-strip">
        <span className="finish-strip-label">{finishedTitle}</span>
        {finished.length === 0 ? (
          <span className="empty-inline">暂无</span>
        ) : (
          <div className="finish-pills horizontal">
            {finished.slice(0, 5).map((f) => (
              <div key={f.id} className="finish-pill mini" title={`${f.home} vs ${f.away}`}>
                <span className="finish-score-display inline">
                  {f.homeScore}:{f.awayScore}
                </span>
                <span className="finish-league-tag">{f.league}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}

function truncateSummary(s: string, max = 72): string {
  if (s.length <= max) {
    return s
  }
  return `${s.slice(0, max)}…`
}
