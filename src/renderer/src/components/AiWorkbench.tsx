import { useEffect, useRef, useState } from 'react'
import { Bot, Send, Sparkles, Zap } from 'lucide-react'
import type { FollowingItem } from '../types'

const SUGGESTED_PROMPTS = [
  '今日有哪些值得看的比赛？',
  '我的关注球队下一场什么时候？',
  '帮我汇总 NBA 昨夜赛果',
  '国足近期赛程与要闻',
  '生成本周体育简报要点'
]

interface AiWorkbenchProps {
  piMode: string
  initError?: string
  following: FollowingItem[]
  onOpenDigest: () => void
}

/**
 * 工作台核心：AI 对话主舞台（流式输出、提示芯片、关注上下文）。
 */
export function AiWorkbench({ piMode, initError, following, onOpenDigest }: AiWorkbenchProps) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([])
  const [streaming, setStreaming] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

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
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, streaming])

  const handleSend = async (textOverride?: string) => {
    const text = (textOverride ?? input).trim()
    if (!text || sending) {
      return
    }
    setInput('')
    setSending(true)
    setStreaming('')
    await window.sportdesk.sendMessage(text)
  }

  const contextChips = following.slice(0, 6)

  return (
    <section className="workbench-hero glass-panel">
      <div className="workbench-hero-glow" aria-hidden />
      <header className="workbench-hero-header">
        <div className="workbench-title-row">
          <div className="workbench-icon-ring">
            <Bot size={22} />
          </div>
          <div>
            <h1 className="workbench-title">AI 体育工作台</h1>
            <p className="workbench-subtitle">对话即入口 · 赛程、关注与摘要由助手串联</p>
          </div>
        </div>
        <div className="workbench-header-actions">
          <span className={`mode-pill ${piMode === 'sdk' ? 'mode-sdk' : 'mode-stub'}`}>
            <Zap size={12} />
            {piMode === 'sdk' ? 'Pi 在线' : 'Stub 演示'}
          </span>
          <button type="button" className="ghost-btn" onClick={onOpenDigest}>
            <Sparkles size={14} />
            每日简报
          </button>
        </div>
      </header>

      {contextChips.length > 0 && (
        <div className="context-chip-row">
          <span className="context-label">上下文</span>
          {contextChips.map((item) => (
            <button
              key={item.id}
              type="button"
              className="context-chip"
              onClick={() => void handleSend(`关于「${item.name}」最近有什么动态？`)}
            >
              {item.name}
            </button>
          ))}
        </div>
      )}

      <div className="chat-surface" ref={scrollRef}>
        {messages.length === 0 && !streaming && (
          <div className="chat-empty">
            <div className="chat-empty-art" aria-hidden>
              <svg viewBox="0 0 120 80" className="empty-svg">
                <defs>
                  <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#7c3aed" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
                <rect x="8" y="12" width="104" height="56" rx="12" fill="url(#g1)" opacity="0.15" />
                <circle cx="36" cy="40" r="14" fill="url(#g1)" opacity="0.35" />
                <rect x="58" y="28" width="44" height="8" rx="4" fill="currentColor" opacity="0.2" />
                <rect x="58" y="44" width="32" height="6" rx="3" fill="currentColor" opacity="0.12" />
              </svg>
            </div>
            <p>向助手提问，或点选下方建议</p>
            {initError && <p className="chat-warn">{initError.slice(0, 80)}</p>}
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`chat-bubble ${msg.role}`}>
            <div className="bubble-avatar">{msg.role === 'user' ? '你' : 'AI'}</div>
            <div className="bubble-body">{msg.text}</div>
          </div>
        ))}
        {streaming && (
          <div className="chat-bubble assistant">
            <div className="bubble-avatar">AI</div>
            <div className="bubble-body streaming-cursor">{streaming}</div>
          </div>
        )}
      </div>

      <div className="prompt-chip-row">
        {SUGGESTED_PROMPTS.map((p) => (
          <button key={p} type="button" className="prompt-chip" onClick={() => void handleSend(p)} disabled={sending}>
            {p}
          </button>
        ))}
      </div>

      <div className="chat-composer">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && void handleSend()}
          placeholder="问我赛程、赛果、关注球队…"
          disabled={sending}
          aria-label="AI 输入"
        />
        <button type="button" className="send-fab" onClick={() => void handleSend()} disabled={sending || !input.trim()}>
          <Send size={18} />
        </button>
      </div>
    </section>
  )
}
