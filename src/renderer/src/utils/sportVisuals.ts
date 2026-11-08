import type { SportFilter } from '../types'

/** 运动类型对应的展示渐变与图标字符 */
export interface SportVisual {
  gradient: string
  glow: string
  emoji: string
  label: string
}

const SPORT_VISUALS: Record<SportFilter, SportVisual> = {
  all: {
    gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    glow: 'rgba(99, 102, 241, 0.45)',
    emoji: '✦',
    label: '综合'
  },
  football: {
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    glow: 'rgba(16, 185, 129, 0.4)',
    emoji: '⚽',
    label: '足球'
  },
  nba: {
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
    glow: 'rgba(245, 158, 11, 0.45)',
    emoji: '🏀',
    label: 'NBA'
  },
  china: {
    gradient: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
    glow: 'rgba(239, 68, 68, 0.4)',
    emoji: '🇨🇳',
    label: '国足'
  },
  tennis: {
    gradient: 'linear-gradient(135deg, #84cc16 0%, #65a30d 100%)',
    glow: 'rgba(132, 204, 22, 0.4)',
    emoji: '🎾',
    label: '网球'
  },
  snooker: {
    gradient: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
    glow: 'rgba(20, 184, 166, 0.4)',
    emoji: '🎱',
    label: '斯诺克'
  },
  lol: {
    gradient: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
    glow: 'rgba(168, 85, 247, 0.45)',
    emoji: '🎮',
    label: '电竞'
  },
  honor: {
    gradient: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
    glow: 'rgba(234, 179, 8, 0.4)',
    emoji: '👑',
    label: '王者'
  }
}

/**
 * 按运动类型返回视觉配置（渐变、图标等）。
 */
export function getSportVisual(sport: SportFilter): SportVisual {
  return SPORT_VISUALS[sport] ?? SPORT_VISUALS.all
}

/**
 * 根据要闻摘要生成情绪标签（演示用启发式，非真实 NLP）。
 */
export function moodFromSummary(text: string): { label: string; className: string } {
  const t = text.toLowerCase()
  if (t.includes('胜') || t.includes('夺冠') || t.includes('绝杀')) {
    return { label: '高能', className: 'mood-hot' }
  }
  if (t.includes('伤') || t.includes('停赛') || t.includes('连败')) {
    return { label: '警惕', className: 'mood-warn' }
  }
  if (t.includes('直播') || t.includes('进行')) {
    return { label: '焦点', className: 'mood-live' }
  }
  return { label: '速览', className: 'mood-calm' }
}

/**
 * 计算距离开赛的简短倒计时文案。
 */
export function countdownToKickoff(iso: string): string | null {
  try {
    const diff = new Date(iso).getTime() - Date.now()
    if (diff <= 0) {
      return null
    }
    const h = Math.floor(diff / 3_600_000)
    const m = Math.floor((diff % 3_600_000) / 60_000)
    if (h > 48) {
      return `${Math.floor(h / 24)} 天后`
    }
    if (h > 0) {
      return `${h}h ${m}m`
    }
    return `${m} 分钟后`
  } catch {
    return null
  }
}
