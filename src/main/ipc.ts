import { ipcMain, BrowserWindow, shell } from 'electron'
import { execFile } from 'child_process'
import { fetchUpcomingMatches, fetchMatchSummary, fetchStandings, fetchBracket, fetchMatchesWithGoals, fetchTeamPage, fetchPlayerPage } from './api'
import {
  getSettings, setNotificationMinutes, setSoundEnabled,
  unsubscribeMatch, resubscribeMatch, resetSubscriptions,
  getPromptQueue, addPrompt, deletePrompt, clearPrompts,
  getWatchProviderUrl, setWatchProviderUrl, getWatchMethod, setWatchMethod,
} from './store'
import { getCachedMatches } from './poller'
import { getDevices, refreshStatus, scanNow } from './cast'

export function registerIpcHandlers(win: BrowserWindow) {
  ipcMain.handle('get-settings', () => getSettings())
  ipcMain.handle('set-notification-minutes', (_, minutes: number) => { setNotificationMinutes(minutes) })
  ipcMain.handle('set-sound-enabled', (_, enabled: boolean) => { setSoundEnabled(enabled) })

  ipcMain.handle('unsubscribe-match', (_, matchId: string) => {
    unsubscribeMatch(matchId)
    win.webContents.send('settings:update', getSettings())
  })
  ipcMain.handle('resubscribe-match', (_, matchId: string) => {
    resubscribeMatch(matchId)
    win.webContents.send('settings:update', getSettings())
  })
  ipcMain.handle('reset-subscriptions', () => {
    resetSubscriptions()
    win.webContents.send('settings:update', getSettings())
  })

  ipcMain.handle('get-cached-matches', () => getCachedMatches())
  ipcMain.handle('get-upcoming-matches', async (_, days: number) => fetchUpcomingMatches(days))
  ipcMain.handle('get-match-summary', async (_, matchId: string) => fetchMatchSummary(matchId))
  ipcMain.handle('get-standings', async () => fetchStandings())
  ipcMain.handle('get-bracket', async () => fetchBracket())
  ipcMain.handle('get-matches-by-date', async (_, dateStr: string) => fetchMatchesWithGoals(dateStr))

  ipcMain.handle('get-prompt-queue', () => getPromptQueue())
  ipcMain.handle('add-prompt', (_, text: string) => {
    addPrompt(text)
    win.webContents.send('prompts:update', getPromptQueue())
  })
  ipcMain.handle('delete-prompt', (_, index: number) => {
    deletePrompt(index)
    win.webContents.send('prompts:update', getPromptQueue())
  })
  ipcMain.handle('clear-prompts', () => {
    clearPrompts()
    win.webContents.send('prompts:update', [])
  })

  ipcMain.handle('cast:get-devices', () => getDevices())
  ipcMain.handle('cast:refresh', (_, deviceId: string) => refreshStatus(deviceId))
  ipcMain.handle('cast:scan', () => scanNow())
  ipcMain.handle('cast:open-spectrum', () => {
    const url = getWatchProviderUrl()
    if (getWatchMethod() === 'airplay') {
      execFile('open', ['-a', 'Safari', url])
    } else {
      shell.openExternal(url)
    }
  })
  ipcMain.handle('set-watch-provider-url', (_, url: string) => {
    setWatchProviderUrl(url)
    win.webContents.send('settings:update', getSettings())
  })
  ipcMain.handle('set-watch-method', (_, method: 'browser' | 'airplay') => {
    setWatchMethod(method)
    win.webContents.send('settings:update', getSettings())
  })
  ipcMain.handle('open-url', (_, url: string) => shell.openExternal(url))
  ipcMain.handle('get-team-page', async (_, teamId: string) => fetchTeamPage(teamId))
  ipcMain.handle('get-player-page', async (_, playerId: string) => fetchPlayerPage(playerId))
}
