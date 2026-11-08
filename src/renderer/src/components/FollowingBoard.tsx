import type { FollowingItem } from '../types'
import { ExternalLink } from 'lucide-react'

interface FollowingBoardProps {
  items: FollowingItem[]
}

/**
 * 左侧关注看板。
 */
export function FollowingBoard({ items }: FollowingBoardProps) {
  return (
    <aside className="panel">
      <div className="panel-header">我的关注</div>
      <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((item) => (
          <div
            key={item.id}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: 10
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</div>
            {item.meta && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{item.meta}</div>
            )}
            {item.type === 'note' && item.sport === 'honor' && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                无实时比分 · 仅备注与外链
              </div>
            )}
            {item.externalUrl && (
              <button
                type="button"
                onClick={() => window.sportdesk.openExternal(item.externalUrl!)}
                style={{
                  marginTop: 8,
                  fontSize: 12,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--accent)',
                  padding: 0
                }}
              >
                <ExternalLink size={12} />
                打开官网
              </button>
            )}
          </div>
        ))}
      </div>
    </aside>
  )
}
