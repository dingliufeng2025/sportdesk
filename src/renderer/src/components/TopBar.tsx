import type { CSSProperties } from 'react'
import { RefreshCw, Settings, Newspaper } from 'lucide-react'
import type { SportFilter } from '../types'

/** 联赛/项目快捷标签（信息架构参考常见体育首页，无第三方数据源）。 */
const SPORT_CHIPS: { value: SportFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'nba', label: 'NBA' },
  { value: 'football', label: '五大联赛' },
  { value: 'china', label: '中国队' },
  { value: 'tennis', label: '网球' },
  { value: 'snooker', label: '斯诺克' },
  { value: 'lol', label: '电竞' },
  { value: 'honor', label: '王者' }
]

const DATE_TABS: { offset: number; label: string }[] = [
  { offset: 0, label: '今日' },
  { offset: 1, label: '明日' },
  { offset: 2, label: '后天' }
]

interface TopBarProps {
  dayOffset: number
  onDayOffsetChange: (offset: number) => void
  sportFilter: SportFilter
  onSportFilterChange: (s: SportFilter) => void
  onRefresh: () => void
  refreshing: boolean
  onOpenSettings: () => void
  onOpenDigest: () => void
}

/**
 * 顶栏：Logo、联赛 chip、日期 Tab、刷新与设置。
 */
export function TopBar({
  dayOffset,
  onDayOffsetChange,
  sportFilter,
  onSportFilterChange,
  onRefresh,
  refreshing,
  onOpenSettings,
  onOpenDigest
}: TopBarProps) {
  return (
    <header className="top-bar">
      <div className="top-bar-row">
        <div className="brand">
          <span className="brand-mark">SD</span>
          <span className="brand-name">SportDesk</span>
        </div>
        <div className="chip-scroll">
          {SPORT_CHIPS.map((chip) => (
            <button
              key={chip.value}
              type="button"
              className={sportFilter === chip.value ? 'chip active' : 'chip'}
              onClick={() => onSportFilterChange(chip.value)}
            >
              {chip.label}
            </button>
          ))}
        </div>
        <div className="top-actions">
          <button type="button" onClick={onRefresh} disabled={refreshing} style={btnStyle} title="刷新">
            <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
          </button>
          <button type="button" onClick={onOpenDigest} style={btnStyle}>
            <Newspaper size={16} />
            日报
          </button>
          <button type="button" onClick={onOpenSettings} style={btnStyle}>
            <Settings size={16} />
          </button>
        </div>
      </div>
      <div className="top-bar-row secondary">
        <div className="date-tabs">
          {DATE_TABS.map((tab) => (
            <button
              key={tab.offset}
              type="button"
              className={dayOffset === tab.offset ? 'date-tab active' : 'date-tab'}
              onClick={() => onDayOffsetChange(tab.offset)}
            >
              {tab.label}
              <span className="date-tab-sub">{formatTabDate(tab.offset)}</span>
            </button>
          ))}
        </div>
        <p className="top-tagline">赛程优先 · 深色简洁 · 数据来自正规 API / RSS / 本地示例</p>
      </div>
    </header>
  )
}

function formatTabDate(offset: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric', weekday: 'short' })
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
