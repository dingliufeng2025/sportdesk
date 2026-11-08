import type { NewsItem } from '../types'

interface NewsPanelProps {
  news: NewsItem[]
}

/**
 * 右侧新闻摘要卡片。
 */
export function NewsPanel({ news }: NewsPanelProps) {
  return (
    <aside className="panel">
      <div className="panel-header">新闻摘要</div>
      <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {news.map((n) => (
          <article
            key={n.id}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: 10
            }}
          >
            <h3 style={{ margin: '0 0 6px', fontSize: 13, lineHeight: 1.4 }}>{n.title}</h3>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{n.summary}</p>
            <footer style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
              {n.source} · {formatTime(n.publishedAt)}
            </footer>
          </article>
        ))}
      </div>
    </aside>
  )
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}
