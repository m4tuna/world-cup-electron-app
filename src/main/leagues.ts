export interface LeagueConfig {
  id: string
  espnSport: string
  espnLeague: string
  notifyOnScore: boolean
  isSoccer: boolean
}

export const LEAGUE_CONFIGS: LeagueConfig[] = [
  { id: 'fifa.world', espnSport: 'soccer', espnLeague: 'fifa.world', notifyOnScore: true, isSoccer: true },
  { id: 'eng.1', espnSport: 'soccer', espnLeague: 'eng.1', notifyOnScore: true, isSoccer: true },
  { id: 'esp.1', espnSport: 'soccer', espnLeague: 'esp.1', notifyOnScore: true, isSoccer: true },
  { id: 'ita.1', espnSport: 'soccer', espnLeague: 'ita.1', notifyOnScore: true, isSoccer: true },
  { id: 'ger.1', espnSport: 'soccer', espnLeague: 'ger.1', notifyOnScore: true, isSoccer: true },
  { id: 'fra.1', espnSport: 'soccer', espnLeague: 'fra.1', notifyOnScore: true, isSoccer: true },
  { id: 'uefa.champions', espnSport: 'soccer', espnLeague: 'uefa.champions', notifyOnScore: true, isSoccer: true },
  { id: 'usa.1', espnSport: 'soccer', espnLeague: 'usa.1', notifyOnScore: true, isSoccer: true },
  { id: 'mex.1', espnSport: 'soccer', espnLeague: 'mex.1', notifyOnScore: true, isSoccer: true },
  { id: 'nba', espnSport: 'basketball', espnLeague: 'nba', notifyOnScore: false, isSoccer: false },
  { id: 'mlb', espnSport: 'baseball', espnLeague: 'mlb', notifyOnScore: false, isSoccer: false },
  { id: 'nhl', espnSport: 'hockey', espnLeague: 'nhl', notifyOnScore: true, isSoccer: false },
]

export function getLeagueConfig(id: string): LeagueConfig {
  return LEAGUE_CONFIGS.find((l) => l.id === id) ?? LEAGUE_CONFIGS[0]
}
