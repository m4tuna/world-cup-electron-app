import { useEffect } from 'react'
import { useMatchStore } from '../store/matchStore'
import { playSound } from '../lib/sounds'
import type { Match, Settings } from '../types'

declare global {
  interface Window {
    api: {
      getSettings: () => Promise<Settings>
      setNotificationMinutes: (m: number) => Promise<void>
      setSoundEnabled: (e: boolean) => Promise<void>
      unsubscribeMatch: (id: string) => Promise<void>
      resubscribeMatch: (id: string) => Promise<void>
      resetSubscriptions: () => Promise<void>
      getCachedMatches: () => Promise<Match[]>
      getUpcomingMatches: (days: number) => Promise<Match[]>
      getPromptQueue: () => Promise<unknown>
      addPrompt: (text: string) => Promise<void>
      deletePrompt: (index: number) => Promise<void>
      clearPrompts: () => Promise<void>
      onMatchesUpdate: (cb: (matches: Match[]) => void) => () => void
      onSettingsUpdate: (cb: (s: Settings) => void) => () => void
      onPromptsUpdate: (cb: (p: string[]) => void) => () => void
      onPlaySound: (cb: () => void) => () => void
      getCastDevices: () => Promise<unknown[]>
      refreshCastDevice: (id: string) => Promise<void>
      scanCastDevices: () => Promise<void>
      resizePanel: (h: number) => void
      setPanelWidth?: (w: number) => void
      getMatchSummary: (matchId: string) => Promise<unknown>
      getStandings: () => Promise<unknown[]>
      getBracket: () => Promise<unknown[]>
      getMatchesByDate: (dateStr: string) => Promise<unknown[]>
      openSpectrum: () => Promise<void>
      openUrl: (url: string) => Promise<void>
      setWatchProviderUrl: (url: string) => Promise<void>
      setWatchMethod: (method: 'browser' | 'airplay') => Promise<void>
      getTeamPage: (teamId: string) => Promise<unknown>
      getPlayerPage: (playerId: string) => Promise<unknown>
      onCastDevices: (cb: (devices: unknown[]) => void) => () => void
      setNotifyEvent: (event: string, config: object) => Promise<void>
      openNotificationPrefs: () => Promise<void>
      previewNotification: (event: string) => Promise<void>
      onEventSound: (cb: (soundId: string) => void) => () => void
      getNewsFeed: () => Promise<unknown[]>
      getArticleHtml: (url: string) => Promise<string>
      getLeaders: (season: number) => Promise<unknown[]>
      setFavoriteTeams: (abbrs: string[]) => Promise<void>
      setPhoneNotifyEnabled: (v: boolean) => Promise<void>
      setExpoPushToken: (token: string) => Promise<void>
      testPhoneNotification: () => Promise<void>
      getTeams: (sport: string, league: string) => Promise<{ id: string; abbreviation: string; name: string; logo?: string }[]>
      setActiveLeague: (leagueId: string) => Promise<void>
      setEnabledLeagues: (ids: string[]) => Promise<void>
      setTeamSubscriptions: (subs: Record<string, string[]>) => Promise<void>
    }
  }
}

export function useMatches() {
  const { setTodayMatches, setUpcomingMatches, setSettings } = useMatchStore()

  useEffect(() => {
    window.api.getCachedMatches().then((matches) => {
      if (matches?.length) setTodayMatches(matches)
    })
    window.api.getSettings().then((s) => {
      if (s) setSettings(s)
    })
    window.api.getUpcomingMatches(7).then((matches) => {
      if (matches?.length) setUpcomingMatches(matches)
    })

    const unsubMatches = window.api.onMatchesUpdate(setTodayMatches)
    const unsubSettings = window.api.onSettingsUpdate(setSettings)
    const unsubSound = window.api.onPlaySound(() => playSound('whistle'))
    const unsubEventSound = window.api.onEventSound((soundId) => playSound(soundId))

    return () => {
      unsubMatches()
      unsubSettings()
      unsubSound()
      unsubEventSound()
    }
  }, [setTodayMatches, setUpcomingMatches, setSettings])
}
