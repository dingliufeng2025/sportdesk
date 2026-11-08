import { useState } from 'react'
import { X, Sparkles } from 'lucide-react'
import type { DigestSection } from '../types'

interface DigestModalProps {
  open: boolean
  onClose: () => void
}

/**
 * 每日简报弹窗。
 */
export function DigestModal({ open, onClose }: DigestModalProps) {
  const [sections, setSections] = useState<DigestSection[]>([])
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (!open) {
    return null
  }

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const result = await window.sportdesk.generateDigest()
      setSections(result.sections)
      setGeneratedAt(result.generatedAt)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      role="dialog"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 16
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          width: '100%',
          maxWidth: 520,
          maxHeight: '85vh',
          overflow: 'auto',
          padding: 20
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>每日简报</h2>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text)' }}>
            <X size={20} />
          </button>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>默认生成时间：Asia/Shanghai 08:00（P1 定时任务）</p>
        <button type="button" onClick={handleGenerate} disabled={loading} style={{ ...primaryBtn, marginTop: 12 }}>
          <Sparkles size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
          {loading ? '生成中…' : '立即生成'}
        </button>
        {generatedAt && (
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12 }}>
            生成于 {new Date(generatedAt).toLocaleString('zh-CN')}
          </p>
        )}
        {sections.map((sec) => (
          <section key={sec.title} style={{ marginTop: 16 }}>
            <h3 style={{ fontSize: 14, marginBottom: 8 }}>{sec.title}</h3>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, lineHeight: 1.6 }}>
              {sec.items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}

const primaryBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  padding: '10px',
  border: 'none',
  borderRadius: 8,
  background: 'var(--accent)',
  color: '#fff',
  fontWeight: 600
}
