import { ipcMain, BrowserWindow, shell, Notification } from 'electron'
import { execFile } from 'child_process'
import { fetchUpcomingMatches, fetchMatchSummary, fetchStandings, fetchBracket, fetchMatchesWithGoals, fetchTeamPage, fetchPlayerPage, fetchLeaders, fetchTeams } from './api'
import { fetchNewsFeed, fetchArticleHtml } from './news'
import {
  getSettings, setNotificationMinutes, setSoundEnabled,
  unsubscribeMatch, resubscribeMatch, resetSubscriptions,
  getPromptQueue, addPrompt, deletePrompt, clearPrompts,
  getWatchProviderUrl, setWatchProviderUrl, getWatchMethod, setWatchMethod,
  setNotifyEvent, setFavoriteTeams, setPhoneNotifyEnabled, setExpoPushToken,
  getActiveLeagueId, setActiveLeagueId, getEnabledLeagueIds, setEnabledLeagueIds,
  getTeamSubscriptions, setTeamSubscriptions,
} from './store'
import { getLeagueConfig } from './leagues'
import { getCachedMatches, triggerPoll } from './poller'
import { getDevices, refreshStatus, scanNow } from './cast'
import { sendPhoneNotification } from './phone'

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
  ipcMain.handle('get-upcoming-matches', async (_, days: number) => {
    const cfg = getLeagueConfig(getActiveLeagueId())
    return fetchUpcomingMatches(days, cfg.espnSport, cfg.espnLeague)
  })
  ipcMain.handle('get-match-summary', async (_, matchId: string) => fetchMatchSummary(matchId))
  ipcMain.handle('get-standings', async () => {
    const cfg = getLeagueConfig(getActiveLeagueId())
    return fetchStandings(cfg.espnSport, cfg.espnLeague)
  })
  ipcMain.handle('get-bracket', async () => fetchBracket())
  ipcMain.handle('get-matches-by-date', async (_, dateStr: string) => {
    const cfg = getLeagueConfig(getActiveLeagueId())
    return fetchMatchesWithGoals(dateStr, cfg.espnSport, cfg.espnLeague)
  })

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
  ipcMain.handle('set-notify-event', (_, event: string, config: { enabled: boolean; native: boolean; sound: boolean; soundId: string }) => {
    setNotifyEvent(event as 'notifyGoal' | 'notifyHalfTime' | 'notifyFullTime', config)
    win.webContents.send('settings:update', getSettings())
  })
  ipcMain.handle('open-notification-prefs', () => {
    shell.openExternal('x-apple.systempreferences:com.apple.preference.notifications')
  })
  ipcMain.handle('preview-notification', (_, event: string) => {
    const samples: Record<string, { title: string; body: string }> = {
      notifyGoal:     { title: '⚽ GOAL! 🇦🇷 1–0 🇫🇷', body: 'Messi scores for Argentina!' },
      notifyHalfTime: { title: '🕐 Half Time', body: '🇺🇸 USA 9–0 🇫🇷 France' },
      notifyFullTime: { title: '🏁 Full Time — GER 7–1 BRA', body: '🇩🇪 Germany win! Final: 7–1' },
    }
    const data = samples[event] ?? samples['notifyGoal']
    const n = new Notification({ title: data.title, body: data.body, silent: true })
    n.on('click', () => { win?.show(); win?.focus() })
    n.show()
    sendPhoneNotification(data.title, data.body, '', 'default')
  })
  ipcMain.handle('set-favorite-teams', (_, abbrs: string[]) => {
    setFavoriteTeams(abbrs)
    win.webContents.send('settings:update', getSettings())
  })
  ipcMain.handle('set-phone-notify-enabled', (_, v: boolean) => {
    setPhoneNotifyEnabled(v)
    win.webContents.send('settings:update', getSettings())
  })
  ipcMain.handle('set-expo-push-token', (_, token: string) => {
    setExpoPushToken(token)
    win.webContents.send('settings:update', getSettings())
  })
  ipcMain.handle('test-phone-notification', () => {
    sendPhoneNotification(
      '⚽ Test — World Cup Notifier',
      'Phone notifications are working! 🎉',
      'soccer,white_check_mark',
      'default',
    )
  })
  ipcMain.handle('get-teams', async (_, sport: string, league: string) => fetchTeams(sport, league))
  ipcMain.handle('get-news-feed', () => fetchNewsFeed())
  ipcMain.handle('get-article-html', (_, url: string) => fetchArticleHtml(url))
  ipcMain.handle('get-leaders', (_, season: number) => fetchLeaders(season))
  ipcMain.handle('open-url', (_, url: string) => shell.openExternal(url))
  ipcMain.handle('get-team-page', async (_, teamId: string) => fetchTeamPage(teamId))
  ipcMain.handle('get-player-page', async (_, playerId: string) => fetchPlayerPage(playerId))

  ipcMain.handle('set-active-league', (_, leagueId: string) => {
    setActiveLeagueId(leagueId)
    const enabled = getEnabledLeagueIds()
    if (!enabled.includes(leagueId)) {
      setEnabledLeagueIds([...enabled, leagueId])
    }
    win.webContents.send('settings:update', getSettings())
    triggerPoll(win)
  })
  ipcMain.handle('set-enabled-leagues', (_, ids: string[]) => {
    setEnabledLeagueIds(ids)
    win.webContents.send('settings:update', getSettings())
  })
  ipcMain.handle('set-team-subscriptions', (_, subs: Record<string, string[]>) => {
    setTeamSubscriptions(subs)
    win.webContents.send('settings:update', getSettings())
  })
}
