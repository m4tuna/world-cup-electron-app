import Store from 'electron-store'

interface Schema {
  notificationMinutes: number
  soundEnabled: boolean
  unsubscribedMatches: string[]
  windowBounds: { x: number; y: number; width: number; height: number } | null
  promptQueue: string[]
  watchProviderUrl: string
  watchMethod: 'browser' | 'airplay'
}

export const store = new Store<Schema>({
  defaults: {
    notificationMinutes: 30,
    soundEnabled: true,
    unsubscribedMatches: [],
    windowBounds: null,
    promptQueue: [],
    watchProviderUrl: 'https://watch.spectrum.net',
    watchMethod: 'browser',
  },
})

export function getSettings() {
  return {
    notificationMinutes: store.get('notificationMinutes'),
    soundEnabled: store.get('soundEnabled'),
    unsubscribedMatches: store.get('unsubscribedMatches'),
    watchProviderUrl: store.get('watchProviderUrl'),
    watchMethod: store.get('watchMethod'),
  }
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
  const current = store.get('unsubscribedMatches')
  if (!current.includes(matchId)) {
    store.set('unsubscribedMatches', [...current, matchId])
  }
}

export function resubscribeMatch(matchId: string) {
  const current = store.get('unsubscribedMatches')
  store.set('unsubscribedMatches', current.filter((id) => id !== matchId))
}

export function resetSubscriptions() {
  store.set('unsubscribedMatches', [])
}

export function isUnsubscribed(matchId: string): boolean {
  return store.get('unsubscribedMatches').includes(matchId)
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
