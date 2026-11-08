import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Send, Bot, ChevronDown, ChevronUp } from 'lucide-react'

interface AiChatDrawerProps {
  piMode: string
  initError?: string
}

/**
 * 底部可折叠 AI 问答抽屉。
 */
export function AiChatDrawer({ piMode, initError }: AiChatDrawerProps) {
  const [expanded, setExpanded] = useState(false)
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
        if (!expanded) {
          setExpanded(true)
        }
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
  }, [expanded])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streaming, expanded])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || sending) {
      return
    }
    setInput('')
    setSending(true)
    setStreaming('')
    setExpanded(true)
    await window.sportdesk.sendMessage(text)
  }

  return (
    <div className={`ai-drawer ${expanded ? 'expanded' : 'collapsed'}`}>
      <button type="button" className="ai-drawer-handle" onClick={() => setExpanded((e) => !e)}>
        <Bot size={18} />
        <span>AI 体育助手</span>
        <span className="ai-mode-tag">{piMode === 'sdk' ? 'Pi' : 'Stub'}</span>
        {expanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
      </button>
      {expanded && (
        <div className="ai-drawer-body">
          <p className="ai-hint">
            试试：「今天的赛程」「我的关注」
            {initError ? ` · ${initError.slice(0, 36)}` : ''}
          </p>
          <div className="ai-messages">
            {messages.map((msg, i) => (
              <div key={i} className={msg.role === 'user' ? 'msg user' : 'msg bot'}>
                {msg.text}
              </div>
            ))}
            {streaming && <div className="msg bot streaming">{streaming}</div>}
            <div ref={bottomRef} />
          </div>
          <div className="ai-input-row">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="输入问题…"
              disabled={sending}
            />
            <button type="button" onClick={handleSend} disabled={sending} style={sendBtn}>
              <Send size={16} />
              发送
            </button>
          </div>
        </div>
      )}
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
