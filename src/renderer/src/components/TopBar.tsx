import type { CSSProperties } from 'react'
import clsx from 'clsx'
import { RefreshCw, Settings, Newspaper } from 'lucide-react'
import type { SportFilter } from '../types'

const SPORT_OPTIONS: { value: SportFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'football', label: '足球' },
  { value: 'nba', label: 'NBA' },
  { value: 'china', label: '国足' },
  { value: 'tennis', label: '网球' },
  { value: 'snooker', label: '斯诺克' },
  { value: 'lol', label: 'LOL' },
  { value: 'honor', label: '王者' }
]

interface TopBarProps {
  timeMode: 'today' | 'week'
  onTimeModeChange: (m: 'today' | 'week') => void
  sportFilter: SportFilter
  onSportFilterChange: (s: SportFilter) => void
  onRefresh: () => void
  refreshing: boolean
  onOpenSettings: () => void
  onOpenDigest: () => void
}

/**
 * 顶部工具栏：时间范围、项目筛选、刷新与设置。
 */
export function TopBar({
  timeMode,
  onTimeModeChange,
  sportFilter,
  onSportFilterChange,
  onRefresh,
  refreshing,
  onOpenSettings,
  onOpenDigest
}: TopBarProps) {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
        flexWrap: 'wrap'
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 18, marginRight: 8 }}>SportDesk</div>
      <div style={{ display: 'flex', gap: 4, background: 'var(--bg-card)', padding: 4, borderRadius: 8 }}>
        {(['today', 'week'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => onTimeModeChange(m)}
            className={clsx()}
            style={{
              border: 'none',
              padding: '6px 14px',
              borderRadius: 6,
              background: timeMode === m ? 'var(--accent)' : 'transparent',
              color: timeMode === m ? '#fff' : 'var(--text-muted)'
            }}
          >
            {m === 'today' ? '今日' : '本周'}
          </button>
        ))}
      </div>
      <select
        value={sportFilter}
        onChange={(e) => onSportFilterChange(e.target.value as SportFilter)}
        style={{
          background: 'var(--bg-card)',
          color: 'var(--text)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '8px 10px'
        }}
      >
        {SPORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={onRefresh}
        disabled={refreshing}
        style={btnStyle}
        title="刷新数据"
      >
        <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
        刷新
      </button>
      <button type="button" onClick={onOpenDigest} style={btnStyle}>
        <Newspaper size={16} />
        每日简报
      </button>
      <div style={{ flex: 1 }} />
      <button type="button" onClick={onOpenSettings} style={btnStyle}>
        <Settings size={16} />
        设置
      </button>
    </header>
  )
}

const btnStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  border: '1px solid var(--border)',
  background: 'var(--bg-card)',
  color: 'var(--text)',
  padding: '8px 12px',
  borderRadius: 8
}
