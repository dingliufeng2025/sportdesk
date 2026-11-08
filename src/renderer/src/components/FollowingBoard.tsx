import type { FixtureItem, FollowingItem } from '../types'
import { nextMatchLine } from '../utils/following'
import { ExternalLink } from 'lucide-react'

interface FollowingBoardProps {
  items: FollowingItem[]
  allFixtures: FixtureItem[]
}

/**
 * 左侧窄栏：关注卡片与下一场一句话。
 */
export function FollowingBoard({ items, allFixtures }: FollowingBoardProps) {
  return (
    <aside className="panel panel-follow">
      <div className="panel-header">我的关注</div>
      <div className="panel-body follow-list">
        {items.map((item) => {
          const line = nextMatchLine(item, allFixtures)
          return (
            <div key={item.id} className="follow-card">
              <div className="follow-name">{item.name}</div>
              {item.meta && <div className="follow-meta">{item.meta}</div>}
              {item.type === 'note' && item.sport === 'honor' && (
                <div className="follow-note">无实时比分 · 仅备注与外链</div>
              )}
              {line ? (
                <div className="follow-next">{line}</div>
              ) : (
                <div className="follow-next muted">近期无匹配赛程</div>
              )}
              {item.externalUrl && (
                <button
                  type="button"
                  className="follow-link"
                  onClick={() => window.sportdesk.openExternal(item.externalUrl!)}
                >
                  <ExternalLink size={12} />
                  官网
                </button>
              )}
            </div>
          )
        })}
      </div>
    </aside>
  )
}
