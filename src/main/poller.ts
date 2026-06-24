import { BrowserWindow } from 'electron'
import { fetchMatchesWithGoals, fetchPlayerPhoto, type Match } from './api'
import { store, isMatchSubscribed, getNotifyGoal, getNotifyHalfTime, getNotifyFullTime, getActiveLeagueId, getEnabledLeagueIds } from './store'
import { getLeagueConfig } from './leagues'
import { maybeNotify, fireScoreNotification, fireHalfTimeNotification, fireFullTimeNotification } from './notifications'
import { updateTray } from './tray'

let pollTimer: NodeJS.Timeout | null = null
let cachedMatches: Match[] = []
let allLiveMatches: Match[] = []   // live across ALL enabled leagues (for tray)
let enriching = false

interface MatchState {
  homeScore: number
  awayScore: number
  statusDetail: string
  status: string
}
const matchPrevState = new Map<string, MatchState>()

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

function detectMatchEvents(match: Match, prev: MatchState, leagueId: string, win: BrowserWindow | null) {
  const league = getLeagueConfig(leagueId)
  const notifyGoal = getNotifyGoal()
  const notifyHalfTime = getNotifyHalfTime()
  const notifyFullTime = getNotifyFullTime()

  if (notifyGoal.enabled && league.notifyOnScore) {
    if (match.homeScore > prev.homeScore) {
      const homeGoals = match.goalScorers.filter((g) => g.teamId === match.homeTeam.id)
      const scorer = homeGoals[homeGoals.length - 1]?.playerName ?? match.homeTeam.name
      fireScoreNotification(match, scorer, match.homeTeam.name, notifyGoal, win, league)
    }
    if (match.awayScore > prev.awayScore) {
      const awayGoals = match.goalScorers.filter((g) => g.teamId === match.awayTeam.id)
      const scorer = awayGoals[awayGoals.length - 1]?.playerName ?? match.awayTeam.name
      fireScoreNotification(match, scorer, match.awayTeam.name, notifyGoal, win, league)
    }
  }

  if (notifyHalfTime.enabled) {
    const isHT = match.statusDetail.toLowerCase().includes('half time') || match.statusDetail.toLowerCase() === 'ht'
    const wasHT = prev.statusDetail.toLowerCase().includes('half time') || prev.statusDetail.toLowerCase() === 'ht'
    if (isHT && !wasHT) {
      fireHalfTimeNotification(match, notifyHalfTime, win)
    }
  }

  if (notifyFullTime.enabled) {
    if (match.status === 'post' && prev.status === 'in') {
      fireFullTimeNotification(match, notifyFullTime, win)
    }
  }
}

async function pollLeague(leagueId: string, win: BrowserWindow | null, isActive: boolean): Promise<Match[]> {
  const cfg = getLeagueConfig(leagueId)
  const now = new Date()
  const today = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
  const matches = await fetchMatchesWithGoals(today, cfg.espnSport, cfg.espnLeague)

  const notifyMinutes = store.get('notificationMinutes')
  const soundEnabled = store.get('soundEnabled')

  for (const match of matches) {
    if (match.status === 'pre' && isMatchSubscribed(match.id, match.homeTeam.abbreviation, match.awayTeam.abbreviation, leagueId)) {
      maybeNotify(match, notifyMinutes, soundEnabled, win, cfg)
    }

    const prev = matchPrevState.get(`${leagueId}:${match.id}`)
    if (prev && isMatchSubscribed(match.id, match.homeTeam.abbreviation, match.awayTeam.abbreviation, leagueId)) {
      detectMatchEvents(match, prev, leagueId, win)
    }

    matchPrevState.set(`${leagueId}:${match.id}`, {
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      statusDetail: match.statusDetail,
      status: match.status,
    })
  }

  return matches
}

async function poll(win: BrowserWindow | null) {
  try {
    const activeLeagueId = getActiveLeagueId()
    const enabledLeagueIds = getEnabledLeagueIds()

    // Poll all enabled leagues for notifications; collect active league for display
    const pollResults = await Promise.allSettled(
      enabledLeagueIds.map((id) => pollLeague(id, win, id === activeLeagueId))
    )

    const activeIdx = enabledLeagueIds.indexOf(activeLeagueId)
    const activeResult = activeIdx >= 0 ? pollResults[activeIdx] : null
    const activeMatches = activeResult?.status === 'fulfilled' ? activeResult.value : cachedMatches

    cachedMatches = activeMatches

    // Tray shows live subscribed matches across ALL enabled leagues
    allLiveMatches = pollResults.flatMap((r, i) => {
      if (r.status !== 'fulfilled') return []
      const leagueId = enabledLeagueIds[i]
      return r.value.filter((m) =>
        m.status === 'in' &&
        isMatchSubscribed(m.id, m.homeTeam.abbreviation, m.awayTeam.abbreviation, leagueId)
      )
    })
    updateTray(allLiveMatches)

    if (win) {
      win.webContents.send('matches:update', activeMatches)
    }

    enrichWithPhotos(activeMatches).then(() => {
      if (win) win.webContents.send('matches:update', activeMatches)
    })
  } catch (err) {
    console.error('Poll error:', err)
  }

  const hasLive = allLiveMatches.length > 0 || cachedMatches.some((m) => m.status === 'in')
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

export function triggerPoll(win: BrowserWindow | null) {
  if (pollTimer) clearTimeout(pollTimer)
  poll(win)
}
