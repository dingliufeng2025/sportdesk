import type { FixtureItem } from '../types'

interface FixturesPanelProps {
  fixtures: FixtureItem[]
}

/**
 * 中部赛程与比分面板（直播置顶）。
 */
export function FixturesPanel({ fixtures }: FixturesPanelProps) {
  return (
    <section className="panel">
      <div className="panel-header">
        <span>赛程与比分</span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>直播优先</span>
      </div>
      <div className="panel-body">
        {fixtures.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: 24 }}>暂无赛程</p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {fixtures.map((f) => (
              <li
                key={f.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '72px 1fr auto',
                  gap: 12,
                  alignItems: 'center',
                  padding: 12,
                  background: 'var(--bg-card)',
                  borderRadius: 8,
                  border: f.status === 'live' ? '1px solid var(--live)' : '1px solid var(--border)'
                }}
              >
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{f.league}</div>
                  <StatusBadge status={f.status} minute={f.minute} />
                </div>
                <div style={{ fontSize: 14 }}>
                  <span style={{ fontWeight: f.homeScore != null && f.awayScore != null && f.homeScore > f.awayScore ? 700 : 400 }}>
                    {f.home}
                  </span>
                  {f.status !== 'scheduled' ? (
                    <span style={{ margin: '0 8px', fontVariantNumeric: 'tabular-nums' }}>
                      {f.homeScore ?? '-'} : {f.awayScore ?? '-'}
                    </span>
                  ) : (
                    <span style={{ margin: '0 8px', color: 'var(--text-muted)' }}>vs</span>
                  )}
                  <span style={{ fontWeight: f.homeScore != null && f.awayScore != null && f.awayScore > f.homeScore ? 700 : 400 }}>
                    {f.away}
                  </span>
                </div>
                <time style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatKickoff(f.kickoff)}</time>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

function StatusBadge({ status, minute }: { status: FixtureItem['status']; minute?: number }) {
  if (status === 'live') {
    return (
      <span style={{ color: 'var(--live)', fontSize: 12, fontWeight: 600 }}>直播 {minute != null ? `${minute}'` : ''}</span>
    )
  }
  if (status === 'finished') {
    return <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>已结束</span>
  }
  return <span style={{ color: 'var(--accent)', fontSize: 12 }}>未开赛</span>
}

function formatKickoff(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return iso
  }
}
