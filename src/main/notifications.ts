import { Notification, BrowserWindow } from 'electron'
import type { Match } from './api'
import type { LeagueConfig } from './leagues'
import { sendPhoneNotification } from './phone'

const firedNotifications = new Set<string>()
const firedEvents = new Set<string>()

const SPORT_ICONS: Record<string, string> = {
  soccer: '⚽', basketball: '🏀', baseball: '⚾', hockey: '🏒',
}

export function maybeNotify(match: Match, minutesBefore: number, soundEnabled: boolean, win: BrowserWindow | null, league?: LeagueConfig) {
  const key = `${match.id}-${minutesBefore}`
  if (firedNotifications.has(key)) return

  const now = Date.now()
  const matchTime = match.date.getTime()
  const triggerTime = matchTime - minutesBefore * 60 * 1000
  if (now >= triggerTime && now < matchTime) {
    firedNotifications.add(key)

    const home = match.homeTeam
    const away = match.awayTeam
    const channel = match.broadcasts[0] ?? 'Check listings'
    const icon = league ? (SPORT_ICONS[league.espnSport] ?? '🏆') : '⚽'
    const title = `${icon} Match Starting in ${minutesBefore} min!`
    const body = `${home.flagEmoji} ${home.name} vs ${away.flagEmoji} ${away.name}\n📺 ${channel}`

    const notification = new Notification({ title, body, silent: !soundEnabled })
    notification.on('click', () => { win?.show(); win?.focus() })
    notification.show()

    if (soundEnabled && win) {
      win.webContents.send('play-sound')
    }

    const phoneBody = [match.homeTeam.name, 'vs', match.awayTeam.name, channel ? `· 📺 ${channel}` : ''].filter(Boolean).join(' ')
    sendPhoneNotification(title, phoneBody, 'soccer,bell', 'high', {
      event: 'kickoff',
      homeTeam: match.homeTeam.name,
      homeFlag: match.homeTeam.flagEmoji,
      awayTeam: match.awayTeam.name,
      awayFlag: match.awayTeam.flagEmoji,
      homeScore: match.homeScore ?? 0,
      awayScore: match.awayScore ?? 0,
      channel,
    })
  }
}

export function clearFiredNotification(matchId: string) {
  for (const key of firedNotifications) {
    if (key.startsWith(matchId)) firedNotifications.delete(key)
  }
}

interface EventConfig {
  native: boolean
  sound: boolean
  soundId: string
}

export function fireScoreNotification(
  match: Match,
  scorer: string,
  teamName: string,
  config: EventConfig,
  win: BrowserWindow | null,
  league?: LeagueConfig,
) {
  const key = `score-${match.id}-${match.homeScore}-${match.awayScore}`
  if (firedEvents.has(key)) return
  firedEvents.add(key)

  const icon = league ? (SPORT_ICONS[league.espnSport] ?? '⚽') : '⚽'
  const scoreTitle = `${icon} GOAL! ${match.homeTeam.flagEmoji} ${match.homeScore}–${match.awayScore} ${match.awayTeam.flagEmoji}`
  const scoreBody = `${scorer} scores for ${teamName}!`

  if (config.native) {
    const n = new Notification({ title: scoreTitle, body: scoreBody, silent: true })
    n.on('click', () => { win?.show(); win?.focus() })
    n.show()
  }

  if (config.sound && config.soundId !== 'none' && win) {
    win.webContents.send('play-event-sound', config.soundId)
  }

  sendPhoneNotification(scoreTitle, scoreBody, 'soccer', 'high', {
    event: 'goal',
    homeTeam: match.homeTeam.name,
    homeFlag: match.homeTeam.flagEmoji,
    awayTeam: match.awayTeam.name,
    awayFlag: match.awayTeam.flagEmoji,
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    scorer,
    scorerTeam: teamName,
  })
}

export function fireGoalNotification(
  match: Match,
  scorer: string,
  teamName: string,
  config: EventConfig,
  win: BrowserWindow | null,
) {
  return fireScoreNotification(match, scorer, teamName, config, win)
}

export function fireHalfTimeNotification(
  match: Match,
  config: EventConfig,
  win: BrowserWindow | null,
) {
  const key = `halftime-${match.id}`
  if (firedEvents.has(key)) return
  firedEvents.add(key)

  const htTitle = `🕐 Half Time`
  const htBody = `${match.homeTeam.flagEmoji} ${match.homeTeam.name} ${match.homeScore}–${match.awayScore} ${match.awayTeam.flagEmoji} ${match.awayTeam.name}`

  if (config.native) {
    const n = new Notification({ title: htTitle, body: htBody, silent: true })
    n.on('click', () => { win?.show(); win?.focus() })
    n.show()
  }

  if (config.sound && config.soundId !== 'none' && win) {
    win.webContents.send('play-event-sound', config.soundId)
  }

  sendPhoneNotification(htTitle, htBody, 'stopwatch', 'default', {
    event: 'halftime',
    homeTeam: match.homeTeam.name,
    homeFlag: match.homeTeam.flagEmoji,
    awayTeam: match.awayTeam.name,
    awayFlag: match.awayTeam.flagEmoji,
    homeScore: match.homeScore,
    awayScore: match.awayScore,
  })
}

export function fireFullTimeNotification(
  match: Match,
  config: EventConfig,
  win: BrowserWindow | null,
) {
  const key = `fulltime-${match.id}`
  if (firedEvents.has(key)) return
  firedEvents.add(key)

  const winner =
    match.homeScore > match.awayScore ? match.homeTeam :
    match.awayScore > match.homeScore ? match.awayTeam : null
  const ftTitle = `🏁 Full Time — ${match.homeTeam.abbreviation} ${match.homeScore}–${match.awayScore} ${match.awayTeam.abbreviation}`
  const ftBody = winner
    ? `${winner.flagEmoji} ${winner.name} win! Final: ${match.homeScore}–${match.awayScore}`
    : `Draw! ${match.homeTeam.flagEmoji} ${match.homeScore}–${match.awayScore} ${match.awayTeam.flagEmoji}`

  if (config.native) {
    const n = new Notification({ title: ftTitle, body: ftBody, silent: true })
    n.on('click', () => { win?.show(); win?.focus() })
    n.show()
  }

  if (config.sound && config.soundId !== 'none' && win) {
    win.webContents.send('play-event-sound', config.soundId)
  }

  sendPhoneNotification(ftTitle, ftBody, 'checkered_flag', 'default', {
    event: 'fulltime',
    homeTeam: match.homeTeam.name,
    homeFlag: match.homeTeam.flagEmoji,
    awayTeam: match.awayTeam.name,
    awayFlag: match.awayTeam.flagEmoji,
    homeScore: match.homeScore,
    awayScore: match.awayScore,
  })
}
