import Store from 'electron-store'

interface EventNotif {
  enabled: boolean
  native: boolean
  sound: boolean
  soundId: string
}

interface Schema {
  notificationMinutes: number
  soundEnabled: boolean
  unsubscribedMatches: string[]
  subscribedMatches: string[]
  windowBounds: { x: number; y: number; width: number; height: number } | null
  promptQueue: string[]
  watchProviderUrl: string
  watchMethod: 'browser' | 'airplay'
  notifyGoal: EventNotif
  notifyHalfTime: EventNotif
  notifyFullTime: EventNotif
  favoriteTeams: string[]
  phoneNotifyEnabled: boolean
  expoPushToken: string
  activeLeagueId: string
  enabledLeagueIds: string[]
  teamSubscriptions: Record<string, string[]>
}

export const store = new Store<Schema>({
  defaults: {
    notificationMinutes: 30,
    soundEnabled: true,
    unsubscribedMatches: [],
    subscribedMatches: [],
    windowBounds: null,
    promptQueue: [],
    watchProviderUrl: 'https://watch.spectrum.net',
    watchMethod: 'browser',
    notifyGoal: { enabled: true, native: true, sound: true, soundId: 'airhorn' },
    notifyHalfTime: { enabled: false, native: true, sound: false, soundId: 'chime' },
    notifyFullTime: { enabled: true, native: true, sound: true, soundId: 'chime' },
    favoriteTeams: [],
    phoneNotifyEnabled: false,
    expoPushToken: '',
    activeLeagueId: 'fifa.world',
    enabledLeagueIds: ['fifa.world'],
    teamSubscriptions: {},
  },
})

export function getSettings() {
  return {
    notificationMinutes: store.get('notificationMinutes'),
    soundEnabled: store.get('soundEnabled'),
    unsubscribedMatches: store.get('unsubscribedMatches'),
    subscribedMatches: store.get('subscribedMatches'),
    watchProviderUrl: store.get('watchProviderUrl'),
    watchMethod: store.get('watchMethod'),
    notifyGoal: store.get('notifyGoal'),
    notifyHalfTime: store.get('notifyHalfTime'),
    notifyFullTime: store.get('notifyFullTime'),
    favoriteTeams: store.get('favoriteTeams'),
    phoneNotifyEnabled: store.get('phoneNotifyEnabled'),
    expoPushToken: store.get('expoPushToken'),
    activeLeagueId: store.get('activeLeagueId'),
    enabledLeagueIds: store.get('enabledLeagueIds'),
    teamSubscriptions: store.get('teamSubscriptions'),
  }
}

export function setFavoriteTeams(abbrs: string[]) { store.set('favoriteTeams', abbrs) }

export function getActiveLeagueId() { return store.get('activeLeagueId') }
export function setActiveLeagueId(id: string) { store.set('activeLeagueId', id) }
export function getEnabledLeagueIds() { return store.get('enabledLeagueIds') }
export function setEnabledLeagueIds(ids: string[]) { store.set('enabledLeagueIds', ids) }
export function getTeamSubscriptions() { return store.get('teamSubscriptions') }
export function setTeamSubscriptions(subs: Record<string, string[]>) { store.set('teamSubscriptions', subs) }
export function setPhoneNotifyEnabled(v: boolean) { store.set('phoneNotifyEnabled', v) }
export function setExpoPushToken(token: string) { store.set('expoPushToken', token.trim()) }

export function getNotifyGoal(): EventNotif { return store.get('notifyGoal') }
export function getNotifyHalfTime(): EventNotif { return store.get('notifyHalfTime') }
export function getNotifyFullTime(): EventNotif { return store.get('notifyFullTime') }

export function setNotifyEvent(event: 'notifyGoal' | 'notifyHalfTime' | 'notifyFullTime', config: EventNotif) {
  store.set(event, config)
}

export function getWatchProviderUrl() {
  return store.get('watchProviderUrl')
}

export function setWatchProviderUrl(url: string) {
  store.set('watchProviderUrl', url)
}

export function getWatchMethod(): 'browser' | 'airplay' {
  return store.get('watchMethod')
}

export function setWatchMethod(method: 'browser' | 'airplay') {
  store.set('watchMethod', method)
}

export function setNotificationMinutes(minutes: number) {
  store.set('notificationMinutes', Math.max(5, Math.min(60, minutes)))
}

export function setSoundEnabled(enabled: boolean) {
  store.set('soundEnabled', enabled)
}

export function unsubscribeMatch(matchId: string) {
  const unsubbed = store.get('unsubscribedMatches')
  if (!unsubbed.includes(matchId)) store.set('unsubscribedMatches', [...unsubbed, matchId])
  store.set('subscribedMatches', store.get('subscribedMatches').filter((id) => id !== matchId))
}

export function resubscribeMatch(matchId: string) {
  store.set('unsubscribedMatches', store.get('unsubscribedMatches').filter((id) => id !== matchId))
  const subbed = store.get('subscribedMatches')
  if (!subbed.includes(matchId)) store.set('subscribedMatches', [...subbed, matchId])
}

export function resetSubscriptions() {
  store.set('unsubscribedMatches', [])
  store.set('subscribedMatches', [])
}

export function isMatchSubscribed(matchId: string, homeAbbr: string, awayAbbr: string, leagueId = 'fifa.world'): boolean {
  if (store.get('unsubscribedMatches').includes(matchId)) return false
  if (store.get('subscribedMatches').includes(matchId)) return true
  const subs = store.get('teamSubscriptions')
  const leagueFavs = subs[leagueId] ?? []
  const globalFavs = leagueId === 'fifa.world' ? store.get('favoriteTeams') : []
  const favTeams = [...new Set([...leagueFavs, ...globalFavs])]
  if (favTeams.length > 0) return favTeams.includes(homeAbbr) || favTeams.includes(awayAbbr)
  return false
}

export function getPromptQueue(): string[] {
  return store.get('promptQueue')
}

export function addPrompt(text: string) {
  const trimmed = text.trim()
  if (!trimmed) return
  const current = store.get('promptQueue')
  store.set('promptQueue', [trimmed, ...current])
}

export function deletePrompt(index: number) {
  const current = store.get('promptQueue')
  store.set('promptQueue', current.filter((_, i) => i !== index))
}

export function clearPrompts() {
  store.set('promptQueue', [])
}
