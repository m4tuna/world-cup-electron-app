import { useEffect, useRef } from 'react'
import { useMatchStore } from '../store/matchStore'
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
      getTeamPage: (teamId: string) => Promise<unknown>
      getPlayerPage: (playerId: string) => Promise<unknown>
      onCastDevices: (cb: (devices: unknown[]) => void) => () => void
    }
  }
}

export function useMatches() {
  const { setTodayMatches, setUpcomingMatches, setSettings } = useMatchStore()
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    audioRef.current = new Audio('/sounds/whistle.wav')
  }, [])

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
    const unsubSound = window.api.onPlaySound(() => {
      audioRef.current?.play().catch(() => {})
    })

    return () => {
      unsubMatches()
      unsubSettings()
      unsubSound()
    }
  }, [setTodayMatches, setUpcomingMatches, setSettings])
}
