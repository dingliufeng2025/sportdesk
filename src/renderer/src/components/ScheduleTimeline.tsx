import type { FixtureItem } from '../types'

interface ScheduleTimelineProps {
  fixtures: FixtureItem[]
  dayLabel: string
}

/**
 * 中部主栏：按时间排序的赛程时间线（进行中高亮置顶）。
 */
export function ScheduleTimeline({ fixtures, dayLabel }: ScheduleTimelineProps) {
  return (
    <section className="panel panel-timeline">
      <div className="panel-header">
        <span>{dayLabel}赛程</span>
        <span className="panel-subtitle">按开赛时间 · 进行中优先</span>
      </div>
      <div className="panel-body timeline-body">
        {fixtures.length === 0 ? (
          <p className="empty-hint">该日暂无赛程，可切换日期或调整联赛筛选</p>
        ) : (
          <ul className="timeline-list">
            {fixtures.map((f) => (
              <li key={f.id} className={f.status === 'live' ? 'timeline-row live' : 'timeline-row'}>
                <div className="timeline-time">{formatTime(f.kickoff)}</div>
                <div className="timeline-league">{f.league}</div>
                <div className="timeline-match">
                  <span className={scoreLead(f, 'home')}>{f.home}</span>
                  <span className="timeline-score">
                    {f.status === 'scheduled' ? (
                      <span className="vs">vs</span>
                    ) : (
                      <>
                        {f.homeScore ?? '-'} <span className="colon">:</span> {f.awayScore ?? '-'}
                      </>
                    )}
                  </span>
                  <span className={scoreLead(f, 'away')}>{f.away}</span>
                </div>
                <div className="timeline-status">
                  <StatusPill status={f.status} minute={f.minute} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

function scoreLead(f: FixtureItem, side: 'home' | 'away'): string {
  if (f.status === 'scheduled' || f.homeScore == null || f.awayScore == null) {
    return 'team-name'
  }
  const win =
    side === 'home' ? f.homeScore > f.awayScore : f.awayScore > f.homeScore
  return win ? 'team-name strong' : 'team-name'
}

function StatusPill({ status, minute }: { status: FixtureItem['status']; minute?: number }) {
  if (status === 'live') {
    return <span className="pill live">直播{minute != null ? ` ${minute}'` : ''}</span>
  }
  if (status === 'finished') {
    return <span className="pill muted">完场</span>
  }
  return <span className="pill">未赛</span>
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return '--:--'
  }
}
