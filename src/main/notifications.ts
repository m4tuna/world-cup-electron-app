import { Notification, BrowserWindow } from 'electron'
import type { Match } from './api'

const firedNotifications = new Set<string>()

export function maybeNotify(match: Match, minutesBefore: number, soundEnabled: boolean, win: BrowserWindow | null) {
  const key = `${match.id}-${minutesBefore}`
  if (firedNotifications.has(key)) return

  const now = Date.now()
  const matchTime = match.date.getTime()
  const triggerTime = matchTime - minutesBefore * 60 * 1000
  const windowMs = 35 * 1000 // fire within 35s window

  if (now >= triggerTime && now < triggerTime + windowMs) {
    firedNotifications.add(key)

    const home = match.homeTeam
    const away = match.awayTeam
    const channel = match.broadcasts[0] ?? 'Check listings'
    const title = `⚽ Match Starting in ${minutesBefore} min!`
    const body = `${home.flagEmoji} ${home.name} vs ${away.flagEmoji} ${away.name}\n📺 ${channel}`

    const notification = new Notification({ title, body, silent: !soundEnabled })
    notification.on('click', () => { win?.show(); win?.focus() })
    notification.show()

    if (soundEnabled && win) {
      win.webContents.send('play-sound')
    }
  }
}

export function clearFiredNotification(matchId: string) {
  for (const key of firedNotifications) {
    if (key.startsWith(matchId)) firedNotifications.delete(key)
  }
}
