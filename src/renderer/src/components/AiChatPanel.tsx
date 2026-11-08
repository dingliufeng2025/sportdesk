import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Send, Bot } from 'lucide-react'

interface AiChatPanelProps {
  piMode: string
  initError?: string
}

/**
 * 底部 AI 问答面板（支持 Pi 流式或 Stub）。
 */
export function AiChatPanel({ piMode, initError }: AiChatPanelProps) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([])
  const [streaming, setStreaming] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const unsub = window.sportdesk.onPiEvent((event) => {
      const ev = event as { type?: string; text?: string; delta?: string; message?: string }
      if (ev.type === 'user' && ev.text) {
        setMessages((m) => [...m, { role: 'user', text: ev.text! }])
      } else if (ev.type === 'text_delta' && ev.delta) {
        setStreaming((s) => s + ev.delta)
      } else if (ev.type === 'done') {
        setStreaming((s) => {
          if (s) {
            setMessages((m) => [...m, { role: 'assistant', text: s }])
          }
          return ''
        })
        setSending(false)
      } else if (ev.type === 'error') {
        setMessages((m) => [...m, { role: 'assistant', text: `错误：${ev.message ?? '未知'}` }])
        setSending(false)
      }
    })
    return unsub
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streaming])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || sending) {
      return
    }
    setInput('')
    setSending(true)
    setStreaming('')
    await window.sportdesk.sendMessage(text)
  }

  return (
    <div
      className="panel"
      style={{
        margin: '0 12px 12px',
        maxHeight: 220,
        minHeight: 180
      }}
    >
      <div className="panel-header">
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Bot size={16} />
          AI 体育助手
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>
          {piMode === 'sdk' ? 'Pi SDK' : 'Stub 模式'}
          {initError ? ` · ${initError.slice(0, 40)}` : ''}
        </span>
      </div>
      <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ flex: 1, overflowY: 'auto', fontSize: 13 }}>
          {messages.length === 0 && !streaming && (
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>
              试试问：「今天的赛程」「我的关注有哪些」「最新新闻」
            </p>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                marginBottom: 6,
                textAlign: msg.role === 'user' ? 'right' : 'left',
                color: msg.role === 'user' ? 'var(--accent)' : 'var(--text)'
              }}
            >
              {msg.text}
            </div>
          ))}
          {streaming && <div style={{ color: 'var(--text-muted)' }}>{streaming}</div>}
          <div ref={bottomRef} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="输入问题…"
            disabled={sending}
            style={{
              flex: 1,
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '8px 12px',
              color: 'var(--text)'
            }}
          />
          <button type="button" onClick={handleSend} disabled={sending} style={sendBtn}>
            <Send size={16} />
            发送
          </button>
        </div>
      </div>
    </div>
  )
}

const sendBtn: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  border: 'none',
  background: 'var(--accent)',
  color: '#fff',
  padding: '8px 16px',
  borderRadius: 8
}
