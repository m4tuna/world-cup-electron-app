export interface GoalScorer {
  playerName: string
  clock: string
  teamId: string
  isPenalty: boolean
  isOwnGoal: boolean
}

export interface Team {
  id: string
  name: string
  abbreviation: string
  flagEmoji: string
  teamLogo?: string
  starPlayer: string
  starPlayerPhoto?: string
}

export interface Match {
  id: string
  status: 'pre' | 'in' | 'post'
  statusDetail: string
  clock: string
  date: string
  homeTeam: Team
  awayTeam: Team
  homeScore: number
  awayScore: number
  broadcasts: string[]
  venue: string
  city: string
  goalScorers: GoalScorer[]
}

export interface CastDeviceStatus {
  appName: string | null
  appId: string | null
  statusText: string | null
  isPlaying: boolean
  volume: number
  muted: boolean
}

export interface CastDevice {
  id: string
  name: string
  ip: string
  port: number
  status: CastDeviceStatus | null
  lastSeen: number
}

export interface StandingsEntry {
  teamId: string
  name: string
  abbreviation: string
  flagEmoji: string
  played: number
  w: number
  d: number
  l: number
  gf: number
  ga: number
  gd: number
  pts: number
}

export interface StandingsGroup {
  name: string
  entries: StandingsEntry[]
}

export interface BracketTeam {
  id: string
  name: string
  abbreviation: string
  flagEmoji: string
  score?: number
  winner?: boolean
}

export interface BracketMatchup {
  id: string
  date: string
  status: 'pre' | 'in' | 'post'
  home: BracketTeam
  away: BracketTeam
}

export interface BracketRound {
  name: string
  matchups: BracketMatchup[]
}

export interface Settings {
  notificationMinutes: number
  soundEnabled: boolean
  unsubscribedMatches: string[]
}
