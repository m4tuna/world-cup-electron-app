export type SportType = 'soccer' | 'basketball' | 'baseball' | 'hockey'

export interface League {
  id: string
  name: string
  shortName: string
  icon: string
  sport: SportType
  espnSport: string
  espnLeague: string
  hasStandings: boolean
  hasBracket: boolean
  hasLeaders: boolean
  notifyOnScore: boolean
  scoreLabel: string
  scoreEmoji: string
}

export const LEAGUES: League[] = [
  // ── Soccer ──────────────────────────────────────────────────────────
  { id: 'fifa.world', name: 'World Cup 2026', shortName: 'World Cup', icon: '🏆', sport: 'soccer', espnSport: 'soccer', espnLeague: 'fifa.world', hasStandings: true, hasBracket: true, hasLeaders: true, notifyOnScore: true, scoreLabel: 'Goal', scoreEmoji: '⚽' },
  { id: 'eng.1', name: 'Premier League', shortName: 'Prem. League', icon: '⚽', sport: 'soccer', espnSport: 'soccer', espnLeague: 'eng.1', hasStandings: true, hasBracket: false, hasLeaders: false, notifyOnScore: true, scoreLabel: 'Goal', scoreEmoji: '⚽' },
  { id: 'esp.1', name: 'La Liga', shortName: 'La Liga', icon: '⚽', sport: 'soccer', espnSport: 'soccer', espnLeague: 'esp.1', hasStandings: true, hasBracket: false, hasLeaders: false, notifyOnScore: true, scoreLabel: 'Goal', scoreEmoji: '⚽' },
  { id: 'ita.1', name: 'Serie A', shortName: 'Serie A', icon: '⚽', sport: 'soccer', espnSport: 'soccer', espnLeague: 'ita.1', hasStandings: true, hasBracket: false, hasLeaders: false, notifyOnScore: true, scoreLabel: 'Goal', scoreEmoji: '⚽' },
  { id: 'ger.1', name: 'Bundesliga', shortName: 'Bundesliga', icon: '⚽', sport: 'soccer', espnSport: 'soccer', espnLeague: 'ger.1', hasStandings: true, hasBracket: false, hasLeaders: false, notifyOnScore: true, scoreLabel: 'Goal', scoreEmoji: '⚽' },
  { id: 'fra.1', name: 'Ligue 1', shortName: 'Ligue 1', icon: '⚽', sport: 'soccer', espnSport: 'soccer', espnLeague: 'fra.1', hasStandings: true, hasBracket: false, hasLeaders: false, notifyOnScore: true, scoreLabel: 'Goal', scoreEmoji: '⚽' },
  { id: 'uefa.champions', name: 'Champions League', shortName: 'UCL', icon: '🌟', sport: 'soccer', espnSport: 'soccer', espnLeague: 'uefa.champions', hasStandings: true, hasBracket: true, hasLeaders: false, notifyOnScore: true, scoreLabel: 'Goal', scoreEmoji: '⚽' },
  { id: 'usa.1', name: 'MLS', shortName: 'MLS', icon: '⚽', sport: 'soccer', espnSport: 'soccer', espnLeague: 'usa.1', hasStandings: true, hasBracket: false, hasLeaders: false, notifyOnScore: true, scoreLabel: 'Goal', scoreEmoji: '⚽' },
  { id: 'mex.1', name: 'Liga MX', shortName: 'Liga MX', icon: '⚽', sport: 'soccer', espnSport: 'soccer', espnLeague: 'mex.1', hasStandings: true, hasBracket: false, hasLeaders: false, notifyOnScore: true, scoreLabel: 'Goal', scoreEmoji: '⚽' },
  // ── Basketball ───────────────────────────────────────────────────────
  { id: 'nba', name: 'NBA', shortName: 'NBA', icon: '🏀', sport: 'basketball', espnSport: 'basketball', espnLeague: 'nba', hasStandings: true, hasBracket: false, hasLeaders: false, notifyOnScore: false, scoreLabel: 'Score', scoreEmoji: '🏀' },
  // ── Baseball ─────────────────────────────────────────────────────────
  { id: 'mlb', name: 'MLB', shortName: 'MLB', icon: '⚾', sport: 'baseball', espnSport: 'baseball', espnLeague: 'mlb', hasStandings: true, hasBracket: false, hasLeaders: false, notifyOnScore: false, scoreLabel: 'Run', scoreEmoji: '⚾' },
  // ── Hockey ───────────────────────────────────────────────────────────
  { id: 'nhl', name: 'NHL', shortName: 'NHL', icon: '🏒', sport: 'hockey', espnSport: 'hockey', espnLeague: 'nhl', hasStandings: true, hasBracket: false, hasLeaders: false, notifyOnScore: true, scoreLabel: 'Goal', scoreEmoji: '🏒' },
]

export function getLeague(id: string): League {
  return LEAGUES.find((l) => l.id === id) ?? LEAGUES[0]
}

export const SPORT_GROUPS: { label: string; sport: SportType }[] = [
  { label: 'Soccer', sport: 'soccer' },
  { label: 'Basketball', sport: 'basketball' },
  { label: 'Baseball', sport: 'baseball' },
  { label: 'Hockey', sport: 'hockey' },
]
