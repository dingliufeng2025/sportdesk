import type { FixtureItem, NewsItem } from '../types'

interface StandingRow {
  league: string
  team: string
  played: number
  points: number
}

interface RightSidebarProps {
  finished: FixtureItem[]
  news: NewsItem[]
  standings: StandingRow[]
  finishedTitle: string
}

/**
 * 右侧侧栏：完场摘要、要闻、积分榜小卡。
 */
export function RightSidebar({ finished, news, standings, finishedTitle }: RightSidebarProps) {
  return (
    <aside className="panel panel-sidebar">
      <div className="sidebar-section">
        <div className="sidebar-title">{finishedTitle}</div>
        {finished.length === 0 ? (
          <p className="empty-hint small">暂无完场比赛</p>
        ) : (
          <ul className="finished-list">
            {finished.map((f) => (
              <li key={f.id} className="finished-item">
                <span className="finished-league">{f.league}</span>
                <span className="finished-score">
                  {f.home} {f.homeScore}:{f.awayScore} {f.away}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="sidebar-section">
        <div className="sidebar-title">要闻摘要</div>
        <div className="news-stack">
          {news.map((n) => (
            <article key={n.id} className="news-card-compact">
              <h3>{n.title}</h3>
              <p>{n.summary}</p>
              <footer>
                {n.source} · {formatTime(n.publishedAt)}
              </footer>
            </article>
          ))}
        </div>
      </div>

      {standings.length > 0 && (
        <div className="sidebar-section">
          <div className="sidebar-title">积分榜 · 示例</div>
          <table className="standings-mini">
            <thead>
              <tr>
                <th>联赛</th>
                <th>球队</th>
                <th>分</th>
              </tr>
            </thead>
            <tbody>
              {standings.slice(0, 4).map((row, i) => (
                <tr key={`${row.team}-${i}`}>
                  <td>{row.league}</td>
                  <td>{row.team}</td>
                  <td>{row.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </aside>
  )
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}
