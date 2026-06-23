import { BrowserWindow } from 'electron'
import { fetchMatchesWithGoals, fetchPlayerPhoto, type Match } from './api'
import { store, isUnsubscribed } from './store'
import { maybeNotify } from './notifications'
import { updateTray } from './tray'

let pollTimer: NodeJS.Timeout | null = null
let cachedMatches: Match[] = []
let enriching = false

export function getCachedMatches() { return cachedMatches }

async function enrichWithPhotos(matches: Match[]) {
  if (enriching) return
  enriching = true
  try {
    for (const match of matches) {
      for (const team of [match.homeTeam, match.awayTeam]) {
        if (team.starPlayer && !team.starPlayerPhoto) {
          const photo = await fetchPlayerPhoto(team.starPlayer)
          if (photo) team.starPlayerPhoto = photo
        }
      }
    }
  } finally {
    enriching = false
  }
}

async function poll(win: BrowserWindow | null) {
  try {
    const now = new Date()
    const today = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
    const matches = await fetchMatchesWithGoals(today)
    cachedMatches = matches

    const liveMatches = matches.filter((m) => m.status === 'in')
    updateTray(liveMatches)

    if (win) {
      win.webContents.send('matches:update', matches)
    }

    const notifyMinutes = store.get('notificationMinutes')
    const soundEnabled = store.get('soundEnabled')
    for (const match of matches) {
      if (match.status !== 'pre') continue
      if (isUnsubscribed(match.id)) continue
      maybeNotify(match, notifyMinutes, soundEnabled, win)
    }

    enrichWithPhotos(matches).then(() => {
      if (win) win.webContents.send('matches:update', matches)
    })
  } catch (err) {
    console.error('Poll error:', err)
  }

  const hasLive = cachedMatches.some((m) => m.status === 'in')
  schedulePoll(win, hasLive ? 60_000 : 300_000)
}

function schedulePoll(win: BrowserWindow | null, delay: number) {
  if (pollTimer) clearTimeout(pollTimer)
  pollTimer = setTimeout(() => poll(win), delay)
}

export function startPolling(win: BrowserWindow | null) {
  poll(win)
}

export function stopPolling() {
  if (pollTimer) { clearTimeout(pollTimer); pollTimer = null }
}
