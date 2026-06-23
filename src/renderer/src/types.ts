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

export interface Settings {
  notificationMinutes: number
  soundEnabled: boolean
  unsubscribedMatches: string[]
}
