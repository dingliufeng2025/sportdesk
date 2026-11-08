import { contextBridge, ipcRenderer } from 'electron'
import type {
  SportDeskConfig,
  SportFilter,
  FixtureItem,
  NewsItem,
  FollowingItem,
  SecretsStatus,
  DigestSection,
  PiModelOption,
  PiModelState
} from '../main/types'

export interface SportDeskApi {
  getPaths: () => Promise<{ home: string; config: string; cache: string }>
  loadConfig: () => Promise<SportDeskConfig>
  saveConfig: (config: SportDeskConfig) => Promise<SportDeskConfig>
  getFixtures: (filter: SportFilter, dayOffset: number) => Promise<FixtureItem[]>
  getTimeline: (filter: SportFilter, dayOffset: number) => Promise<FixtureItem[]>
  getFinished: (filter: SportFilter, dayOffset: number) => Promise<FixtureItem[]>
  getStandings: () => Promise<unknown>
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
  listPiModels: () => Promise<PiModelOption[]>
  getPiModelState: () => Promise<PiModelState>
  setPiModel: (provider: string, modelId: string) => Promise<{ ok: boolean; stubOnly?: boolean; error?: string }>
  onPiEvent: (callback: (event: unknown) => void) => () => void
  openExternal: (url: string) => Promise<void>
}

const api: SportDeskApi = {
  getPaths: () => ipcRenderer.invoke('app:get-paths'),
  loadConfig: () => ipcRenderer.invoke('config:load'),
  saveConfig: (config) => ipcRenderer.invoke('config:save', config),
  getFixtures: (filter, dayOffset) => ipcRenderer.invoke('data:fixtures', filter, dayOffset),
  getTimeline: (filter, dayOffset) => ipcRenderer.invoke('data:timeline', filter, dayOffset),
  getFinished: (filter, dayOffset) => ipcRenderer.invoke('data:finished', filter, dayOffset),
  getStandings: () => ipcRenderer.invoke('data:standings'),
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
  listPiModels: () => ipcRenderer.invoke('session:list-models'),
  getPiModelState: () => ipcRenderer.invoke('session:get-model'),
  setPiModel: (provider, modelId) => ipcRenderer.invoke('session:set-model', provider, modelId),
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
