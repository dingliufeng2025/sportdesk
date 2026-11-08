import { contextBridge, ipcRenderer } from 'electron'
import type { SportDeskConfig, SportFilter, FixtureItem, NewsItem, FollowingItem, SecretsStatus, DigestSection } from '../main/types'

export interface SportDeskApi {
  getPaths: () => Promise<{ home: string; config: string; cache: string }>
  loadConfig: () => Promise<SportDeskConfig>
  saveConfig: (config: SportDeskConfig) => Promise<SportDeskConfig>
  getFixtures: (filter: SportFilter, mode: 'today' | 'week') => Promise<FixtureItem[]>
  getNews: (filter: SportFilter) => Promise<NewsItem[]>
  getFollowing: () => Promise<FollowingItem[]>
  refreshData: () => Promise<{ fixtures: FixtureItem[]; news: NewsItem[] }>
  generateDigest: () => Promise<{ generatedAt: string; sections: DigestSection[] }>
  getSecretsStatus: () => Promise<SecretsStatus>
  loadSecretsMasked: () => Promise<Record<string, string>>
  saveSecrets: (secrets: Record<string, string | undefined>) => Promise<SecretsStatus>
  initSession: () => Promise<{ mode: string; error?: string }>
  sendMessage: (text: string) => Promise<{ ok: boolean }>
  getPiMode: () => Promise<{ mode: string; initError?: string }>
  onPiEvent: (callback: (event: unknown) => void) => () => void
  openExternal: (url: string) => Promise<void>
}

const api: SportDeskApi = {
  getPaths: () => ipcRenderer.invoke('app:get-paths'),
  loadConfig: () => ipcRenderer.invoke('config:load'),
  saveConfig: (config) => ipcRenderer.invoke('config:save', config),
  getFixtures: (filter, mode) => ipcRenderer.invoke('data:fixtures', filter, mode),
  getNews: (filter) => ipcRenderer.invoke('data:news', filter),
  getFollowing: () => ipcRenderer.invoke('data:following'),
  refreshData: () => ipcRenderer.invoke('data:refresh'),
  generateDigest: () => ipcRenderer.invoke('digest:generate'),
  getSecretsStatus: () => ipcRenderer.invoke('secrets:status'),
  loadSecretsMasked: () => ipcRenderer.invoke('secrets:load-masked'),
  saveSecrets: (secrets) => ipcRenderer.invoke('secrets:save', secrets),
  initSession: () => ipcRenderer.invoke('session:init'),
  sendMessage: (text) => ipcRenderer.invoke('session:send', text),
  getPiMode: () => ipcRenderer.invoke('pi:mode'),
  onPiEvent: (callback) => {
    const listener = (_: Electron.IpcRendererEvent, data: unknown) => callback(data)
    ipcRenderer.on('pi:event', listener)
    return () => ipcRenderer.removeListener('pi:event', listener)
  },
  openExternal: (url) => ipcRenderer.invoke('shell:open-external', url)
}

contextBridge.exposeInMainWorld('sportdesk', api)

declare global {
  interface Window {
    sportdesk: SportDeskApi
  }
}
