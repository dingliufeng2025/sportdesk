import type { FixtureItem, FollowingItem } from '../types'
import { nextMatchLine } from '../utils/following'
import { countdownToKickoff } from '../utils/sportVisuals'
import { logoForFollowing } from '../utils/leagueLogos'
import { Heart } from 'lucide-react'

interface FollowingBoardProps {
  items: FollowingItem[]
  allFixtures: FixtureItem[]
}

/**
 * 关注看板：双列紧凑网格，一屏内展示、无独立滚动条。
 */
export function FollowingBoard({ items, allFixtures }: FollowingBoardProps) {
  return (
    <aside className="following-rail glass-panel">
      <header className="rail-head compact">
        <Heart size={14} className="rail-head-icon" />
        <h2>关注</h2>
      </header>
      <div className="following-grid compact">
        {items.map((item) => {
          const logoSrc = logoForFollowing(item.id, item.name)
          const nextFx = findNextFixture(item, allFixtures)
          const line = nextMatchLine(item, allFixtures)
          const countdown = nextFx?.status === 'scheduled' ? countdownToKickoff(nextFx.kickoff) : null
          const live = nextFx?.status === 'live'

          return (
            <article
              key={item.id}
              className={`follow-tile ${live ? 'is-live' : ''}`}
              title={line ?? undefined}
            >
              <img className="follow-tile-logo" src={logoSrc} alt="" width={28} height={28} />
              <span className="follow-tile-name">{item.name}</span>
              {live && (
                <span className="follow-tile-tag live">
                  <span className="pulse-dot" />
                  直播
                </span>
              )}
              {!live && countdown && <span className="follow-tile-tag">{countdown}</span>}
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
    .filter((f) => Boolean(nextMatchLine(item, [f])))
    .sort((a, b) => a.kickoff.localeCompare(b.kickoff))[0]
}
