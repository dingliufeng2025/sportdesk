import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

interface SettingsModalProps {
  open: boolean
  onClose: () => void
}

interface SecretsStatus {
  apiSports: boolean
  balldontlie: boolean
  pandascore: boolean
  snookerHeader: boolean
  piReady: boolean
}

/**
 * API 密钥与本地路径设置（密钥不落库到 Git）。
 */
export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const [paths, setPaths] = useState({ home: '', config: '', cache: '' })
  const [status, setStatus] = useState<SecretsStatus | null>(null)
  const [form, setForm] = useState({
    apiSportsKey: '',
    balldontlieKey: '',
    pandascoreKey: '',
    snookerApiHeader: ''
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!open) {
      return
    }
    void (async () => {
      setPaths(await window.sportdesk.getPaths())
      setStatus(await window.sportdesk.getSecretsStatus())
      const masked = await window.sportdesk.loadSecretsMasked()
      setForm({
        apiSportsKey: masked.apiSportsKey ?? '',
        balldontlieKey: masked.balldontlieKey ?? '',
        pandascoreKey: masked.pandascoreKey ?? '',
        snookerApiHeader: masked.snookerApiHeader ?? ''
      })
    })()
  }, [open])

  if (!open) {
    return null
  }

  const handleSave = async () => {
    const toSave: Record<string, string> = {}
    const assignIfNew = (key: string, value: string) => {
      if (value && !value.startsWith('****')) {
        toSave[key] = value
      }
    }
    assignIfNew('apiSportsKey', form.apiSportsKey)
    assignIfNew('balldontlieKey', form.balldontlieKey)
    assignIfNew('pandascoreKey', form.pandascoreKey)
    assignIfNew('snookerApiHeader', form.snookerApiHeader)
    const next = await window.sportdesk.saveSecrets(toSave)
    setStatus(next)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
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
          maxWidth: 480,
          maxHeight: '90vh',
          overflow: 'auto',
          padding: 20
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>设置</h2>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text)' }}>
            <X size={20} />
          </button>
        </div>
        <section style={{ marginBottom: 20, fontSize: 12, color: 'var(--text-muted)' }}>
          <p style={{ margin: '4px 0' }}>配置目录：{paths.home}</p>
          <p style={{ margin: '4px 0' }}>config.json：{paths.config}</p>
          <p style={{ margin: '4px 0' }}>缓存：{paths.cache}</p>
        </section>
        <section>
          <h3 style={{ fontSize: 14, marginBottom: 12 }}>API 密钥（存于用户目录，不入 Git）</h3>
          <Field
            label="API-Sports"
            configured={status?.apiSports}
            value={form.apiSportsKey}
            onChange={(v) => setForm((f) => ({ ...f, apiSportsKey: v }))}
          />
          <Field
            label="BALLDONTLIE"
            configured={status?.balldontlie}
            value={form.balldontlieKey}
            onChange={(v) => setForm((f) => ({ ...f, balldontlieKey: v }))}
          />
          <Field
            label="PandaScore"
            configured={status?.pandascore}
            value={form.pandascoreKey}
            onChange={(v) => setForm((f) => ({ ...f, pandascoreKey: v }))}
          />
          <Field
            label="斯诺克 Header"
            configured={status?.snookerHeader}
            value={form.snookerApiHeader}
            onChange={(v) => setForm((f) => ({ ...f, snookerApiHeader: v }))}
          />
        </section>
        <button type="button" onClick={handleSave} style={{ marginTop: 16, ...primaryBtn }}>
          {saved ? '已保存' : '保存密钥'}
        </button>
      </div>
    </div>
  )
}

function Field({
  label,
  configured,
  value,
  onChange
}: {
  label: string
  configured?: boolean
  value: string
  onChange: (v: string) => void
}) {
  return (
    <label style={{ display: 'block', marginBottom: 12, fontSize: 13 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span>{label}</span>
        <span style={{ color: configured ? 'var(--success)' : 'var(--text-muted)', fontSize: 11 }}>
          {configured ? '已配置' : '未配置'}
        </span>
      </div>
      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={configured ? '留空则保持原值；输入新值覆盖' : '输入密钥'}
        style={inputStyle}
      />
    </label>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '8px 10px',
  color: 'var(--text)'
}

const primaryBtn: React.CSSProperties = {
  width: '100%',
  padding: '10px',
  border: 'none',
  borderRadius: 8,
  background: 'var(--accent)',
  color: '#fff',
  fontWeight: 600
}
