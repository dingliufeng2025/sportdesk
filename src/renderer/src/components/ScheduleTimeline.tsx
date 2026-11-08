import type { FixtureItem } from '../types'
import { getSportVisual } from '../utils/sportVisuals'
import { CalendarDays } from 'lucide-react'

interface ScheduleTimelineProps {
  fixtures: FixtureItem[]
  dayLabel: string
}

/**
 * 赛程可视化：横向时间轴 + 紧凑对阵卡（状态色、直播脉冲）。
 */
export function ScheduleTimeline({ fixtures, dayLabel }: ScheduleTimelineProps) {
  return (
    <section className="glass-panel schedule-module">
      <header className="module-head">
        <div className="module-head-icon schedule-icon">
          <CalendarDays size={16} />
        </div>
        <div>
          <h2>{dayLabel}赛程轴</h2>
          <span className="module-head-hint">可视化时间线 · 进行中置顶</span>
        </div>
      </header>

      {fixtures.length === 0 ? (
        <p className="empty-inline center">该日暂无赛程，切换日期或筛选试试</p>
      ) : (
        <div className="schedule-viz">
          <div className="schedule-axis" aria-hidden>
            <div className="axis-line" />
            {fixtures.map((f, i) => (
              <div
                key={`dot-${f.id}`}
                className={`axis-node ${f.status === 'live' ? 'live' : ''}`}
                style={{ left: `${axisPosition(i, fixtures.length)}%` }}
              />
            ))}
          </div>
          <div className="fixture-card-row">
            {fixtures.map((f) => (
              <FixtureCard key={f.id} fixture={f} />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

function FixtureCard({ fixture: f }: { fixture: FixtureItem }) {
  const visual = getSportVisual(f.sport)
  const isLive = f.status === 'live'
  const isFinished = f.status === 'finished'

  return (
    <article className={`fixture-viz-card ${isLive ? 'live' : ''} ${isFinished ? 'done' : ''}`}>
      <div className="fixture-card-time">{formatTime(f.kickoff)}</div>
      <div className="fixture-league-row">
        <span className="mini-badge" style={{ background: visual.gradient }}>
          {visual.emoji}
        </span>
        <span className="fixture-league-name">{f.league}</span>
      </div>
      <div className="fixture-match-block">
        <span className={teamClass(f, 'home')}>{f.home}</span>
        <div className="fixture-score-hero">
          {f.status === 'scheduled' ? (
            <span className="vs-mark">VS</span>
          ) : (
            <>
              <span className="score-num">{f.homeScore ?? '-'}</span>
              <span className="score-colon">:</span>
              <span className="score-num">{f.awayScore ?? '-'}</span>
            </>
          )}
        </div>
        <span className={teamClass(f, 'away')}>{f.away}</span>
      </div>
      <StatusBadge status={f.status} minute={f.minute} />
    </article>
  )
}

function teamClass(f: FixtureItem, side: 'home' | 'away'): string {
  if (f.status === 'scheduled' || f.homeScore == null || f.awayScore == null) {
    return 'fixture-team'
  }
  const win = side === 'home' ? f.homeScore > f.awayScore : f.awayScore > f.homeScore
  return win ? 'fixture-team winner' : 'fixture-team'
}

function StatusBadge({ status, minute }: { status: FixtureItem['status']; minute?: number }) {
  if (status === 'live') {
    return (
      <span className="status-badge live">
        <span className="pulse-dot" />
        直播{minute != null ? ` ${minute}'` : ''}
      </span>
    )
  }
  if (status === 'finished') {
    return <span className="status-badge done">完场</span>
  }
  return <span className="status-badge upcoming">未赛</span>
}

function axisPosition(index: number, total: number): number {
  if (total <= 1) {
    return 50
  }
  const margin = 8
  const span = 100 - margin * 2
  return margin + (index / (total - 1)) * span
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return '--:--'
  }
}
