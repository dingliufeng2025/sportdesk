import { useEffect, useRef, useState } from 'react'
import { X, Send, Sparkles } from 'lucide-react'
import type { FollowingItem } from '../types'

const SUGGESTED_PROMPTS = ['今日赛程', '我的关注', '昨夜 NBA', '国足动态']

interface AiFloatingPetProps {
  piMode: string
  initError?: string
  following: FollowingItem[]
}

/**
 * 角落悬浮 AI 助手：默认收起为光球，点击展开聊天气泡面板。
 */
export function AiFloatingPet({ piMode, initError, following }: AiFloatingPetProps) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([])
  const [streaming, setStreaming] = useState('')
  const [sending, setSending] = useState(false)
  const [hasUnread, setHasUnread] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const unsub = window.sportdesk.onPiEvent((event) => {
      const ev = event as { type?: string; text?: string; delta?: string; message?: string }
      if (ev.type === 'user' && ev.text) {
        setMessages((m) => [...m, { role: 'user', text: ev.text! }])
      } else if (ev.type === 'text_delta' && ev.delta) {
        setStreaming((s) => s + ev.delta)
        setOpen(true)
      } else if (ev.type === 'done') {
        setStreaming((s) => {
          if (s) {
            setMessages((m) => [...m, { role: 'assistant', text: s }])
          }
          return ''
        })
        setSending(false)
        if (!open) {
          setHasUnread(true)
        }
      } else if (ev.type === 'error') {
        setMessages((m) => [...m, { role: 'assistant', text: `错误：${ev.message ?? '未知'}` }])
        setSending(false)
      }
    })
    return unsub
  }, [open])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, streaming, open])

  useEffect(() => {
    if (!open) {
      return
    }
    const onPointerDown = (e: MouseEvent) => {
      if (hostRef.current && !hostRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  /**
   * 发送用户消息到主进程 Pi/Stub 会话。
   */
  const handleSend = async (textOverride?: string) => {
    const text = (textOverride ?? input).trim()
    if (!text || sending) {
      return
    }
    setInput('')
    setSending(true)
    setStreaming('')
    setHasUnread(false)
    await window.sportdesk.sendMessage(text)
  }

  const toggleOpen = () => {
    setOpen((v) => !v)
    setHasUnread(false)
  }

  const contextChips = following.slice(0, 4)

  return (
    <div ref={hostRef} className="ai-pet-host">
      {open && (
        <div className="ai-pet-popover glass-panel" role="dialog" aria-label="AI 助手">
          <header className="ai-pet-popover-head">
            <div className="ai-pet-popover-title">
              <Sparkles size={14} />
              <span>体育小助手</span>
              <span className="ai-pet-mode">{piMode === 'sdk' ? 'Pi' : 'Stub'}</span>
            </div>
            <button type="button" className="icon-btn ghost" onClick={() => setOpen(false)} aria-label="收起">
              <X size={18} />
            </button>
          </header>
          {initError && <p className="ai-pet-warn">{initError.slice(0, 64)}</p>}
          <div className="ai-pet-prompts">
            {SUGGESTED_PROMPTS.map((p) => (
              <button key={p} type="button" className="pet-prompt-chip" onClick={() => void handleSend(p)} disabled={sending}>
                {p}
              </button>
            ))}
            {contextChips.map((item) => (
              <button
                key={item.id}
                type="button"
                className="pet-prompt-chip context"
                onClick={() => void handleSend(`「${item.name}」近况？`)}
                disabled={sending}
              >
                {item.name}
              </button>
            ))}
          </div>
          <div className="ai-pet-messages" ref={scrollRef}>
            {messages.length === 0 && !streaming && <p className="ai-pet-empty">点选上方快捷语，或直接输入</p>}
            {messages.map((msg, i) => (
              <div key={i} className={`pet-bubble ${msg.role}`}>
                {msg.text}
              </div>
            ))}
            {streaming && <div className="pet-bubble assistant streaming-cursor">{streaming}</div>}
          </div>
          <div className="ai-pet-composer">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void handleSend()}
              placeholder="输入问题…"
              disabled={sending}
            />
            <button type="button" className="send-fab mini" onClick={() => void handleSend()} disabled={sending || !input.trim()}>
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      <button type="button" className={`ai-pet-orb ${open ? 'open' : ''}`} onClick={toggleOpen} aria-label={open ? '收起助手' : '打开 AI 助手'}>
        <span className="ai-pet-face" aria-hidden>
          <span className="pet-eye" />
          <span className="pet-eye" />
        </span>
        {hasUnread && !open && <span className="ai-pet-badge" />}
      </button>
    </div>
  )
}
