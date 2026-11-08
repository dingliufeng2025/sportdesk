import { FileText, TrendingUp } from 'lucide-react'
import type { NewsItem, FixtureItem } from '../types'
import { getSportVisual, moodFromSummary } from '../utils/sportVisuals'

interface SmartBriefPanelProps {
  news: NewsItem[]
  finished: FixtureItem[]
  finishedTitle: string
}

/**
 * 智能摘要区：要闻卡片化（徽章、情绪胶囊），非标题墙。
 */
export function SmartBriefPanel({ news, finished, finishedTitle }: SmartBriefPanelProps) {
  return (
    <div className="module-stack">
      <section className="glass-panel module-brief">
        <header className="module-head">
          <div className="module-head-icon brief-icon">
            <FileText size={16} />
          </div>
          <div>
            <h2>AI 速览卡</h2>
            <span className="module-head-hint">摘要提炼 · 示例数据</span>
          </div>
        </header>
        <div className="brief-cards">
          {news.slice(0, 5).map((n) => {
            const visual = getSportVisual(n.sport)
            const mood = moodFromSummary(n.summary)
            return (
              <article key={n.id} className="brief-card">
                <div className="brief-card-top">
                  <span className="team-badge" style={{ background: visual.gradient }} title={visual.label}>
                    {visual.emoji}
                  </span>
                  <span className={`mood-pill ${mood.className}`}>{mood.label}</span>
                </div>
                <h3 className="brief-card-title">{n.title}</h3>
                <p className="brief-card-summary">{truncateSummary(n.summary)}</p>
                <footer className="brief-card-foot">
                  <span>{n.source}</span>
                  <span>{formatBriefTime(n.publishedAt)}</span>
                </footer>
              </article>
            )
          })}
        </div>
      </section>

      <section className="glass-panel module-finished-compact">
        <header className="module-head">
          <div className="module-head-icon finish-icon">
            <TrendingUp size={16} />
          </div>
          <div>
            <h2>{finishedTitle}</h2>
            <span className="module-head-hint">结果一览</span>
          </div>
        </header>
        <div className="finish-pills">
          {finished.length === 0 ? (
            <p className="empty-inline">暂无完场</p>
          ) : (
            finished.slice(0, 6).map((f) => (
              <div key={f.id} className="finish-pill">
                <span className="finish-league-tag">{f.league}</span>
                <span className="finish-score-display">
                  <strong>{f.homeScore}</strong>
                  <span className="score-sep">:</span>
                  <strong>{f.awayScore}</strong>
                </span>
                <span className="finish-teams">
                  {f.home} · {f.away}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}

function truncateSummary(s: string, max = 72): string {
  if (s.length <= max) {
    return s
  }
  return `${s.slice(0, max)}…`
}

function formatBriefTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}
