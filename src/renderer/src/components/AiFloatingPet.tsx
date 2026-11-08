import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { X, Send, Sparkles, GripHorizontal } from 'lucide-react'
import type { FollowingItem } from '../types'

const SUGGESTED_PROMPTS = [
  '今日有哪些值得看的比赛？',
  '我的关注下一场？',
  '昨夜 NBA 赛果',
  '国足赛程与要闻',
  '本周体育简报要点'
]

const DRAG_THRESHOLD_PX = 6
const PANEL_W = 520
const PANEL_H_VH = 72

interface PiModelRow {
  provider: string
  modelId: string
  displayName: string
  authConfigured: boolean
}

interface AiFloatingPetProps {
  piMode: string
  initError?: string
  following: FollowingItem[]
}

type PetAnimState = 'idle' | 'busy' | 'open'

/**
 * 可拖拽悬浮 AI 助手：角落宠物光球 + 大尺寸对话面板 + 模型切换。
 */
export function AiFloatingPet({ piMode, initError, following }: AiFloatingPetProps) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([])
  const [streaming, setStreaming] = useState('')
  const [sending, setSending] = useState(false)
  const [hasUnread, setHasUnread] = useState(false)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const [models, setModels] = useState<PiModelRow[]>([])
  const [selectedKey, setSelectedKey] = useState('')
  const [modelHint, setModelHint] = useState<string>()
  const scrollRef = useRef<HTMLDivElement>(null)
  const hostRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef({
    active: false,
    moved: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0
  })

  const busy = sending || Boolean(streaming)
  const animState: PetAnimState = open ? 'open' : busy ? 'busy' : 'idle'

  /**
   * 计算默认右下角坐标。
   */
  const defaultPosition = useCallback((): { x: number; y: number } => {
    const margin = 20
    const orb = 64
    return {
      x: Math.max(margin, window.innerWidth - orb - margin),
      y: Math.max(margin, window.innerHeight - orb - margin)
    }
  }, [])

  useEffect(() => {
    void (async () => {
      const cfg = await window.sportdesk.loadConfig()
      if (cfg.aiPet && cfg.aiPet.x >= 0 && cfg.aiPet.y >= 0) {
        setPos({ x: cfg.aiPet.x, y: cfg.aiPet.y })
      } else {
        setPos(defaultPosition())
      }
      const catalog = await window.sportdesk.listPiModels()
      setModels(catalog)
      const state = await window.sportdesk.getPiModelState()
      setSelectedKey(`${state.provider}::${state.modelId}`)
    })()
  }, [defaultPosition])

  useEffect(() => {
    const onResize = () => {
      setPos((p) => {
        const base = p ?? defaultPosition()
        const orb = 64
        return {
          x: Math.min(base.x, window.innerWidth - orb - 8),
          y: Math.min(base.y, window.innerHeight - orb - 8)
        }
      })
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [defaultPosition])

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
   * 持久化宠物坐标到 ~/.sportdesk/config.json。
   */
  const persistPosition = async (x: number, y: number) => {
    const cfg = await window.sportdesk.loadConfig()
    await window.sportdesk.saveConfig({ ...cfg, aiPet: { x, y } })
  }

  /**
   * 指针按下：准备拖拽，与点击区分。
   */
  const onOrbPointerDown = (e: React.PointerEvent) => {
    if (!pos) {
      return
    }
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = {
      active: true,
      moved: false,
      startX: e.clientX,
      startY: e.clientY,
      originX: pos.x,
      originY: pos.y
    }
  }

  /**
   * 拖拽移动宠物。
   */
  const onOrbPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current
    if (!d.active || !pos) {
      return
    }
    const dx = e.clientX - d.startX
    const dy = e.clientY - d.startY
    if (!d.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) {
      return
    }
    d.moved = true
    const orb = 64
    const x = Math.max(8, Math.min(window.innerWidth - orb - 8, d.originX + dx))
    const y = Math.max(8, Math.min(window.innerHeight - orb - 8, d.originY + dy))
    setPos({ x, y })
  }

  /**
   * 结束拖拽或触发点击展开。
   */
  const onOrbPointerUp = (e: React.PointerEvent) => {
    const d = dragRef.current
    if (!d.active) {
      return
    }
    d.active = false
    e.currentTarget.releasePointerCapture(e.pointerId)
    if (d.moved && pos) {
      void persistPosition(pos.x, pos.y)
      return
    }
    setOpen((v) => !v)
    setHasUnread(false)
  }

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
    setOpen(true)
    await window.sportdesk.sendMessage(text)
  }

  /**
   * 切换 Pi 模型并写入配置。
   */
  const handleModelChange = async (key: string) => {
    const [provider, modelId] = key.split('::')
    if (!provider || !modelId) {
      return
    }
    setSelectedKey(key)
    const result = await window.sportdesk.setPiModel(provider, modelId)
    if (result.stubOnly) {
      setModelHint(result.error ?? 'Stub 模式：已保存模型偏好，回复仍为本地演示')
    } else if (result.error) {
      setModelHint(result.error)
    } else {
      setModelHint(undefined)
    }
  }

  const contextChips = following.slice(0, 5)
  const panelStyle = computePanelStyle(pos, open)

  if (!pos) {
    return null
  }

  return (
    <div ref={hostRef} className="ai-pet-host positioned" style={{ left: pos.x, top: pos.y }}>
      {open && (
        <div className="ai-codex-window glass-panel" style={panelStyle} role="dialog" aria-label="AI 助手对话">
          <header className="ai-codex-toolbar">
            <div className="ai-codex-toolbar-left">
              <Sparkles size={18} />
              <span className="ai-codex-title">SportDesk AI</span>
              <span className={`mode-pill tiny ${piMode === 'sdk' ? 'mode-sdk' : 'mode-stub'}`}>
                {piMode === 'sdk' ? 'Pi 在线' : 'Stub'}
              </span>
            </div>
            <div className="ai-codex-toolbar-center">
              <label className="sr-only" htmlFor="pi-model-select">
                模型
              </label>
              <select
                id="pi-model-select"
                className="model-picker toolbar"
                value={selectedKey}
                onChange={(e) => void handleModelChange(e.target.value)}
                disabled={models.length === 0}
              >
                {models.length === 0 ? (
                  <option value="">加载模型…</option>
                ) : (
                  models.map((m) => (
                    <option key={`${m.provider}::${m.modelId}`} value={`${m.provider}::${m.modelId}`}>
                      {m.displayName}
                      {m.authConfigured ? '' : '（未配置密钥）'}
                    </option>
                  ))
                )}
              </select>
            </div>
            <button type="button" className="icon-btn ghost" onClick={() => setOpen(false)} aria-label="收起">
              <X size={18} />
            </button>
          </header>

          {(modelHint || initError) && (
            <div className="ai-codex-status-bar">
              {modelHint && <span>{modelHint}</span>}
              {initError && <span className="warn">{initError.slice(0, 140)}</span>}
            </div>
          )}

          <div className="ai-codex-prompts">
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
                onClick={() => void handleSend(`关于「${item.name}」有什么动态？`)}
                disabled={sending}
              >
                {item.name}
              </button>
            ))}
          </div>

          <div className="ai-codex-thread" ref={scrollRef}>
            {messages.length === 0 && !streaming && (
              <div className="ai-codex-empty">
                <p>像 Codex 一样对话：下方输入，上方为消息流</p>
                <p className="muted">拖动摇晃宠物可换位置（单击仍用于开关）</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <article key={i} className={`codex-msg ${msg.role}`}>
                <header>{msg.role === 'user' ? '你' : '助手'}</header>
                <div className="codex-msg-body">{msg.text}</div>
              </article>
            ))}
            {streaming && (
              <article className="codex-msg assistant">
                <header>助手</header>
                <div className="codex-msg-body streaming-cursor">{streaming}</div>
              </article>
            )}
          </div>

          <footer className="ai-codex-composer">
            <textarea
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void handleSend()
                }
              }}
              placeholder="输入消息… Enter 发送，Shift+Enter 换行"
              disabled={sending}
            />
            <button type="button" className="codex-send-btn" onClick={() => void handleSend()} disabled={sending || !input.trim()}>
              <Send size={16} />
              发送
            </button>
          </footer>
        </div>
      )}

      <button
        type="button"
        className={`ai-pet-orb svg-pet state-${animState}`}
        onPointerDown={onOrbPointerDown}
        onPointerMove={onOrbPointerMove}
        onPointerUp={onOrbPointerUp}
        onPointerCancel={onOrbPointerUp}
        aria-label={open ? '拖拽或收起' : '拖拽或打开 AI 助手'}
      >
        <span className="pet-ring ring-a" aria-hidden />
        <span className="pet-ring ring-b" aria-hidden />
        <svg className="pet-svg" viewBox="0 0 64 64" aria-hidden>
          <defs>
            <linearGradient id="pet-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
          <circle cx="32" cy="34" r="26" fill="url(#pet-grad)" />
          <ellipse className="pet-blush left" cx="22" cy="40" rx="5" ry="3" />
          <ellipse className="pet-blush right" cx="42" cy="40" rx="5" ry="3" />
          <ellipse className="pet-eye left" cx="24" cy="30" rx="4" ry="5" />
          <ellipse className="pet-eye right" cx="40" cy="30" rx="4" ry="5" />
          <path className="pet-mouth" d="M26 42 Q32 46 38 42" fill="none" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span className="pet-drag-hint" title="拖拽">
          <GripHorizontal size={12} />
        </span>
        {hasUnread && !open && <span className="ai-pet-badge" />}
      </button>
    </div>
  )
}

/**
 * 根据宠物位置计算大面板锚点，避免超出视口。
 */
function computePanelStyle(pos: { x: number; y: number } | null, open: boolean): CSSProperties | undefined {
  if (!pos || !open) {
    return undefined
  }
  const w = Math.min(PANEL_W, window.innerWidth - 24)
  const panelH = Math.min((window.innerHeight * PANEL_H_VH) / 100, window.innerHeight - 96)
  let left = pos.x + 72 - w
  if (left < 12) {
    left = 12
  }
  if (left + w > window.innerWidth - 12) {
    left = window.innerWidth - w - 12
  }
  let top = pos.y - panelH - 12
  if (top < 56) {
    top = Math.min(pos.y + 72, window.innerHeight - panelH - 12)
  }
  return {
    width: w,
    height: panelH,
    left,
    top,
    position: 'fixed'
  }
}
