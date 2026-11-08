import { RefreshCw, Settings, Sparkles, Layers } from 'lucide-react'
import type { SportFilter } from '../types'
import { logoForSportFilter } from '../utils/leagueLogos'

/** 运动上下文筛选（工作台辅助，非门户 Tab 墙） */
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

/** 筛选项带本地合规 Logo（Wikimedia / 自建占位） */
function ChipIcon({ filter }: { filter: SportFilter }) {
  return <img className="filter-chip-logo" src={logoForSportFilter(filter)} alt="" width={16} height={16} />
}

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
 * 工作台顶栏：品牌、上下文筛选、刷新与设置（紧凑 AI 工作台风格）。
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
    <header className="workbench-topbar">
      <div className="topbar-inner">
        <div className="brand-workbench">
          <span className="brand-orb">
            <Layers size={18} />
          </span>
          <div>
            <span className="brand-wordmark">SportDesk</span>
            <span className="brand-tag">AI 工作台</span>
          </div>
        </div>

        <div className="context-filter-scroll">
          {SPORT_CHIPS.map((chip) => (
            <button
              key={chip.value}
              type="button"
              className={sportFilter === chip.value ? 'filter-chip active' : 'filter-chip'}
              onClick={() => onSportFilterChange(chip.value)}
            >
              <ChipIcon filter={chip.value} />
              {chip.label}
            </button>
          ))}
        </div>

        <div className="topbar-actions">
          {DATE_TABS.map((tab) => (
            <button
              key={tab.offset}
              type="button"
              className={dayOffset === tab.offset ? 'day-pill active' : 'day-pill'}
              onClick={() => onDayOffsetChange(tab.offset)}
              title={formatTabDate(tab.offset)}
            >
              {tab.label}
            </button>
          ))}
          <button type="button" onClick={onRefresh} disabled={refreshing} className="icon-btn" title="刷新数据">
            <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
          </button>
          <button type="button" onClick={onOpenDigest} className="icon-btn" title="每日简报">
            <Sparkles size={16} />
          </button>
          <button type="button" onClick={onOpenSettings} className="icon-btn" title="设置">
            <Settings size={16} />
          </button>
        </div>
      </div>
    </header>
  )
}

function formatTabDate(offset: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric', weekday: 'short' })
}
