import { useState } from 'react'
import { X, Sparkles, Wand2 } from 'lucide-react'
import type { DigestSection } from '../types'

interface DigestModalProps {
  open: boolean
  onClose: () => void
}

/**
 * 每日简报弹窗：生成式卡片风格（玻璃态 + 渐变强调）。
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
    <div className="digest-overlay" role="dialog" onClick={onClose}>
      <div className="digest-gen-card glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="digest-gen-glow" aria-hidden />
        <header className="digest-gen-header">
          <div className="digest-gen-title">
            <Wand2 size={20} />
            <h2>AI 每日简报</h2>
          </div>
          <button type="button" className="icon-btn ghost" onClick={onClose} aria-label="关闭">
            <X size={20} />
          </button>
        </header>
        <p className="digest-gen-hint">默认生成时间：Asia/Shanghai 08:00（P1 定时任务）· 本地示例摘要</p>
        <button type="button" className="digest-generate-btn" onClick={handleGenerate} disabled={loading}>
          <Sparkles size={16} />
          {loading ? '生成中…' : '立即生成'}
        </button>
        {generatedAt && (
          <p className="digest-timestamp">生成于 {new Date(generatedAt).toLocaleString('zh-CN')}</p>
        )}
        <div className="digest-sections">
          {sections.map((sec) => (
            <section key={sec.title} className="digest-section-card">
              <h3>{sec.title}</h3>
              <ul>
                {sec.items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
