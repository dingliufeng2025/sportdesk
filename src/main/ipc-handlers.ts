import { ipcMain, BrowserWindow, shell } from 'electron'
import { loadConfig, saveConfig } from './config-manager'
import { loadSecrets, saveSecrets, getSecretsStatus } from './secrets-manager'
import {
  getFixtures,
  getNews,
  getFollowing,
  refreshAllData,
  generateDailyDigest
} from './adapters/fake-adapters'
import { initSportsAgent, sendSportsAgentMessage, getPiMode, disposeSportsAgent } from './pi/sports-agent'
import type { SportFilter, SportDeskConfig, SecretsFile } from './types'
import { SportDeskPaths } from './paths'

/**
 * 注册所有 IPC 通道。
 */
export function registerIpcHandlers(getMainWindow: () => BrowserWindow | null): void {
  ipcMain.handle('app:get-paths', () => ({
    home: SportDeskPaths.home(),
    config: SportDeskPaths.config(),
    cache: SportDeskPaths.cache()
  }))

  ipcMain.handle('config:load', () => loadConfig())

  ipcMain.handle('config:save', (_e, config: SportDeskConfig) => {
    saveConfig(config)
    return loadConfig()
  })

  ipcMain.handle('data:fixtures', (_e, filter: SportFilter, mode: 'today' | 'week') =>
    getFixtures(filter, mode)
  )

  ipcMain.handle('data:news', (_e, filter: SportFilter) => getNews(filter))

  ipcMain.handle('data:following', () => getFollowing())

  ipcMain.handle('data:refresh', () => refreshAllData())

  ipcMain.handle('digest:generate', () => generateDailyDigest())

  ipcMain.handle('secrets:status', () => {
    const { mode } = getPiMode()
    return getSecretsStatus(mode === 'sdk')
  })

  ipcMain.handle('secrets:load-masked', () => {
    const s = loadSecrets()
    return {
      apiSportsKey: maskSecret(s.apiSportsKey),
      balldontlieKey: maskSecret(s.balldontlieKey),
      pandascoreKey: maskSecret(s.pandascoreKey),
      snookerApiHeader: maskSecret(s.snookerApiHeader)
    }
  })

  ipcMain.handle('secrets:save', (_e, secrets: SecretsFile) => {
    saveSecrets(secrets)
    return getSecretsStatus(getPiMode().mode === 'sdk')
  })

  ipcMain.handle('session:init', async () => {
    const win = getMainWindow()
    if (!win) {
      return { mode: 'stub', error: 'no window' }
    }
    return initSportsAgent(win)
  })

  ipcMain.handle('session:send', async (_e, text: string) => {
    const win = getMainWindow()
    if (!win) {
      return { ok: false }
    }
    await sendSportsAgentMessage(win, text)
    return { ok: true }
  })

  ipcMain.handle('pi:mode', () => getPiMode())

  ipcMain.on('session:dispose', () => {
    disposeSportsAgent()
  })

  ipcMain.handle('shell:open-external', (_e, url: string) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return shell.openExternal(url)
    }
    return Promise.resolve()
  })
}

/**
 * 掩码显示密钥尾缀。
 */
function maskSecret(value?: string): string {
  if (!value || !value.trim()) {
    return ''
  }
  if (value.length <= 4) {
    return '****'
  }
  return `****${value.slice(-4)}`
}
