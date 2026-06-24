import { create } from 'zustand'
import type { Match, Settings } from '../types'

export type AppTab = 'scoreboard' | 'standings' | 'bracket' | 'leaders' | 'news'

interface MatchStore {
  todayMatches: Match[]
  upcomingMatches: Match[]
  settings: Settings
  activeTab: AppTab
  prompts: string[]
  setTodayMatches: (matches: Match[]) => void
  setUpcomingMatches: (matches: Match[]) => void
  setSettings: (settings: Settings) => void
  setActiveTab: (tab: AppTab) => void
  setPrompts: (prompts: string[]) => void
}

export const useMatchStore = create<MatchStore>((set) => ({
  todayMatches: [],
  upcomingMatches: [],
  settings: {
    notificationMinutes: 30,
    soundEnabled: true,
    unsubscribedMatches: [],
    watchProviderUrl: 'https://watch.spectrum.net',
    watchMethod: 'browser',
    notifyGoal: { enabled: true, native: true, sound: true, soundId: 'airhorn' },
    notifyHalfTime: { enabled: false, native: true, sound: false, soundId: 'chime' },
    notifyFullTime: { enabled: true, native: true, sound: true, soundId: 'chime' },
    favoriteTeams: [],
    subscribedMatches: [],
    phoneNotifyEnabled: false,
    expoPushToken: '',
    activeLeagueId: 'fifa.world',
    enabledLeagueIds: ['fifa.world'],
    teamSubscriptions: {},
  },
  activeTab: 'scoreboard',
  prompts: [],
  setTodayMatches: (matches) => set({ todayMatches: matches }),
  setUpcomingMatches: (matches) => set({ upcomingMatches: matches }),
  setSettings: (incoming) => set((state) => ({ settings: { ...state.settings, ...incoming } })),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setPrompts: (prompts) => set({ prompts: prompts }),
}))
