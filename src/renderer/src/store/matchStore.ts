import { create } from 'zustand'
import type { Match, Settings } from '../types'

interface MatchStore {
  todayMatches: Match[]
  upcomingMatches: Match[]
  settings: Settings
  activeTab: 'live' | 'schedule' | 'standings' | 'bracket'
  prompts: string[]
  setTodayMatches: (matches: Match[]) => void
  setUpcomingMatches: (matches: Match[]) => void
  setSettings: (settings: Settings) => void
  setActiveTab: (tab: 'live' | 'schedule' | 'standings' | 'bracket') => void
  setPrompts: (prompts: string[]) => void
}

export const useMatchStore = create<MatchStore>((set) => ({
  todayMatches: [],
  upcomingMatches: [],
  settings: { notificationMinutes: 30, soundEnabled: true, unsubscribedMatches: [], watchProviderUrl: 'https://watch.spectrum.net', watchMethod: 'browser' },
  activeTab: 'live',
  prompts: [],
  setTodayMatches: (matches) => set({ todayMatches: matches }),
  setUpcomingMatches: (matches) => set({ upcomingMatches: matches }),
  setSettings: (incoming) => set((state) => ({ settings: { ...state.settings, ...incoming } })),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setPrompts: (prompts) => set({ prompts: prompts }),
}))
