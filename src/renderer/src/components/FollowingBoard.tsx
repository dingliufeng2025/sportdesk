import type { CSSProperties } from 'react'
import type { FixtureItem, FollowingItem } from '../types'
import { nextMatchLine } from '../utils/following'
import { getSportVisual, countdownToKickoff } from '../utils/sportVisuals'
import { ExternalLink, Heart } from 'lucide-react'

interface FollowingBoardProps {
  items: FollowingItem[]
  allFixtures: FixtureItem[]
}

/**
 * 关注看板：视觉卡片（运动图标、渐变徽章、下场倒计时）。
 */
export function FollowingBoard({ items, allFixtures }: FollowingBoardProps) {
  return (
    <aside className="following-rail">
      <header className="rail-head">
        <Heart size={16} className="rail-head-icon" />
        <h2>我的关注</h2>
      </header>
      <div className="following-grid">
        {items.map((item) => {
          const visual = getSportVisual(item.sport)
          const line = nextMatchLine(item, allFixtures)
          const nextFx = findNextFixture(item, allFixtures)
          const countdown = nextFx?.status === 'scheduled' ? countdownToKickoff(nextFx.kickoff) : null
          const live = nextFx?.status === 'live'

          return (
            <article
              key={item.id}
              className={`follow-visual-card ${live ? 'is-live' : ''}`}
              style={{ '--card-glow': visual.glow } as CSSProperties}
            >
              <div className="follow-card-badge" style={{ background: visual.gradient }}>
                <span className="follow-emoji">{visual.emoji}</span>
              </div>
              <div className="follow-card-main">
                <div className="follow-card-name">{item.name}</div>
                {item.meta && <div className="follow-card-meta">{item.meta}</div>}
                {countdown && <div className="countdown-pill">{countdown} 开赛</div>}
                {live && (
                  <div className="countdown-pill live-pulse">
                    <span className="pulse-dot" />
                    进行中
                  </div>
                )}
                {line ? <p className="follow-card-line">{line}</p> : <p className="follow-card-line muted">近期无匹配赛程</p>}
                {item.type === 'note' && item.sport === 'honor' && (
                  <p className="follow-card-note">无实时比分 · 仅备注与外链</p>
                )}
                {item.externalUrl && (
                  <button
                    type="button"
                    className="follow-ext-link"
                    onClick={() => window.sportdesk.openExternal(item.externalUrl!)}
                  >
                    <ExternalLink size={12} />
                    官网
                  </button>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </aside>
  )
}

function findNextFixture(item: FollowingItem, fixtures: FixtureItem[]): FixtureItem | undefined {
  return fixtures
    .filter((f) => f.status !== 'finished')
    .filter((f) => {
      const line = nextMatchLine(item, [f])
      return Boolean(line)
    })
    .sort((a, b) => a.kickoff.localeCompare(b.kickoff))[0]
}
