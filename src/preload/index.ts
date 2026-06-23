import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  getSettings: () => ipcRenderer.invoke('get-settings'),
  setNotificationMinutes: (minutes: number) => ipcRenderer.invoke('set-notification-minutes', minutes),
  setSoundEnabled: (enabled: boolean) => ipcRenderer.invoke('set-sound-enabled', enabled),
  unsubscribeMatch: (matchId: string) => ipcRenderer.invoke('unsubscribe-match', matchId),
  resubscribeMatch: (matchId: string) => ipcRenderer.invoke('resubscribe-match', matchId),
  resetSubscriptions: () => ipcRenderer.invoke('reset-subscriptions'),
  getCachedMatches: () => ipcRenderer.invoke('get-cached-matches'),
  getUpcomingMatches: (days: number) => ipcRenderer.invoke('get-upcoming-matches', days),
  getPromptQueue: () => ipcRenderer.invoke('get-prompt-queue'),
  addPrompt: (text: string) => ipcRenderer.invoke('add-prompt', text),
  deletePrompt: (index: number) => ipcRenderer.invoke('delete-prompt', index),
  clearPrompts: () => ipcRenderer.invoke('clear-prompts'),
  onMatchesUpdate: (cb: (matches: unknown[]) => void) => {
    const handler = (_: unknown, matches: unknown[]) => cb(matches)
    ipcRenderer.on('matches:update', handler)
    return () => ipcRenderer.off('matches:update', handler)
  },
  onSettingsUpdate: (cb: (settings: unknown) => void) => {
    const handler = (_: unknown, settings: unknown) => cb(settings)
    ipcRenderer.on('settings:update', handler)
    return () => ipcRenderer.off('settings:update', handler)
  },
  onPromptsUpdate: (cb: (prompts: string[]) => void) => {
    const handler = (_: unknown, prompts: string[]) => cb(prompts)
    ipcRenderer.on('prompts:update', handler)
    return () => ipcRenderer.off('prompts:update', handler)
  },
  onPlaySound: (cb: () => void) => {
    const handler = () => cb()
    ipcRenderer.on('play-sound', handler)
    return () => ipcRenderer.off('play-sound', handler)
  },
  getCastDevices: () => ipcRenderer.invoke('cast:get-devices'),
  refreshCastDevice: (deviceId: string) => ipcRenderer.invoke('cast:refresh', deviceId),
  scanCastDevices: () => ipcRenderer.invoke('cast:scan'),
  resizePanel: (h: number) => ipcRenderer.send('panel:resize', h),
  setPanelWidth: (w: number) => ipcRenderer.send('panel:set-width', w),
  getMatchSummary: (matchId: string) => ipcRenderer.invoke('get-match-summary', matchId),
  getStandings: () => ipcRenderer.invoke('get-standings'),
  getBracket: () => ipcRenderer.invoke('get-bracket'),
  getMatchesByDate: (dateStr: string) => ipcRenderer.invoke('get-matches-by-date', dateStr),
  openSpectrum: () => ipcRenderer.invoke('cast:open-spectrum'),
  setWatchProviderUrl: (url: string) => ipcRenderer.invoke('set-watch-provider-url', url),
  setWatchMethod: (method: 'browser' | 'airplay') => ipcRenderer.invoke('set-watch-method', method),
  openUrl: (url: string) => ipcRenderer.invoke('open-url', url),
  getTeamPage: (teamId: string) => ipcRenderer.invoke('get-team-page', teamId),
  getPlayerPage: (playerId: string) => ipcRenderer.invoke('get-player-page', playerId),
  onCastDevices: (cb: (devices: unknown[]) => void) => {
    const handler = (_: unknown, devices: unknown[]) => cb(devices)
    ipcRenderer.on('cast:devices', handler)
    return () => ipcRenderer.off('cast:devices', handler)
  },
}

if (process.contextIsolated) {
  contextBridge.exposeInMainWorld('electron', electronAPI)
  contextBridge.exposeInMainWorld('api', api)
} else {
  // @ts-ignore
  window.electron = electronAPI
  // @ts-ignore
  window.api = api
}
