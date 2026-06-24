import { net } from 'electron'

export interface GoalScorer {
  playerId?: string
  playerName: string
  clock: string
  teamId: string
  isPenalty: boolean
  isOwnGoal: boolean
}

export interface MatchOddsInline {
  homeMoneyLine: number
  awayMoneyLine: number
  drawMoneyLine: number
  overUnder: number
  homeIsFavorite: boolean
}

export interface Match {
  id: string
  status: 'pre' | 'in' | 'post'
  statusDetail: string
  clock: string
  date: Date
  homeTeam: Team
  awayTeam: Team
  homeScore: number
  awayScore: number
  broadcasts: string[]
  venue: string
  city: string
  goalScorers: GoalScorer[]
  odds?: MatchOddsInline
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

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world'
const ESPN_V2_BASE = 'https://site.api.espn.com/apis/v2/sports/soccer/fifa.world'
const SPORTSDB_BASE = 'https://www.thesportsdb.com/api/v1/json/3'

function espnBase(sport: string, league: string) {
  return `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}`
}
function espnV2Base(sport: string, league: string) {
  return `https://site.api.espn.com/apis/v2/sports/${sport}/${league}`
}

const FLAG_MAP: Record<string, string> = {
  ARG: '🇦🇷', BRA: '🇧🇷', FRA: '🇫🇷', GER: '🇩🇪', ENG: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  ESP: '🇪🇸', POR: '🇵🇹', NED: '🇳🇱', BEL: '🇧🇪', URU: '🇺🇾',
  MEX: '🇲🇽', USA: '🇺🇸', CAN: '🇨🇦', JAP: '🇯🇵', JPN: '🇯🇵', KOR: '🇰🇷',
  MAR: '🇲🇦', SEN: '🇸🇳', GHA: '🇬🇭', NGA: '🇳🇬', CMR: '🇨🇲',
  CRO: '🇭🇷', SRB: '🇷🇸', SUI: '🇨🇭', DEN: '🇩🇰', POL: '🇵🇱',
  AUS: '🇦🇺', NZL: '🇳🇿', QAT: '🇶🇦', ECU: '🇪🇨', TUN: '🇹🇳',
  IRN: '🇮🇷', SAU: '🇸🇦', COL: '🇨🇴', CHI: '🇨🇱', PER: '🇵🇪',
  PAR: '🇵🇾', BOL: '🇧🇴', VEN: '🇻🇪', PAN: '🇵🇦', CRC: '🇨🇷',
  HON: '🇭🇳', JAM: '🇯🇲', TRI: '🇹🇹', SLV: '🇸🇻', GTM: '🇬🇹',
  HAI: '🇭🇹', ALB: '🇦🇱', AUT: '🇦🇹', HUN: '🇭🇺', ROU: '🇷🇴',
  SVK: '🇸🇰', SVN: '🇸🇮', CZE: '🇨🇿', UKR: '🇺🇦', GRE: '🇬🇷',
  TUR: '🇹🇷', IRQ: '🇮🇶', JOR: '🇯🇴', OMA: '🇴🇲', UAE: '🇦🇪',
  KWT: '🇰🇼', EGY: '🇪🇬', ALG: '🇩🇿', MLI: '🇲🇱', CIV: '🇨🇮',
  COD: '🇨🇩', ANG: '🇦🇴', NOR: '🇳🇴', SWE: '🇸🇪', FIN: '🇫🇮',
  ISL: '🇮🇸', IRL: '🇮🇪', SCO: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', WAL: '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
  UZB: '🇺🇿',
}

const STAR_PLAYER_MAP: Record<string, string> = {
  // Heavyweights
  ARG: 'Lionel Messi',
  FRA: 'Kylian Mbappe',
  BRA: 'Vinicius Junior',
  POR: 'Cristiano Ronaldo',
  ENG: 'Jude Bellingham',
  ESP: 'Lamine Yamal',
  GER: 'Jamal Musiala',
  NED: 'Virgil van Dijk',
  BEL: 'Kevin De Bruyne',
  URU: 'Federico Valverde',
  CRO: 'Luka Modric',
  // CONCACAF
  USA: 'Christian Pulisic',
  MEX: 'Santiago Gimenez',
  CAN: 'Alphonso Davies',
  PAN: 'Adalberto Carrasquilla',
  CRC: 'Joel Campbell',
  HON: 'Romell Quioto',
  JAM: 'Leon Bailey',
  // South America
  COL: 'James Rodriguez',
  ECU: 'Moises Caicedo',
  // Africa
  MAR: 'Achraf Hakimi',
  SEN: 'Sadio Mane',
  NGA: 'Victor Osimhen',
  GHA: 'Mohammed Kudus',
  CMR: 'Andre Onana',
  EGY: 'Mohamed Salah',
  ALG: 'Riyad Mahrez',
  CIV: 'Franck Kessie',
  MLI: 'Yves Bissouma',
  TUN: 'Wahbi Khazri',
  // Asia / Oceania
  JPN: 'Takefusa Kubo',
  JAP: 'Takefusa Kubo',
  KOR: 'Son Heung-min',
  AUS: 'Harry Souttar',
  NZL: 'Chris Wood',
  QAT: 'Akram Afif',
  IRQ: 'Aymen Hussein',
  JOR: 'Musa Al-Taamari',
  SAU: 'Salem Al-Dawsari',
  // Europe
  NOR: 'Erling Haaland',
  POL: 'Robert Lewandowski',
  SUI: 'Granit Xhaka',
  DEN: 'Christian Eriksen',
  SWE: 'Viktor Gyokeres',
  AUT: 'David Alaba',
  HUN: 'Dominik Szoboszlai',
  SRB: 'Dusan Vlahovic',
  CZE: 'Patrik Schick',
  SVN: 'Jan Oblak',
  SVK: 'Milan Skriniar',
  ROU: 'Razvan Marin',
  UKR: 'Mykhailo Mudryk',
  TUR: 'Hakan Calhanoglu',
  GRE: 'Kostas Tsimikas',
  SCO: 'Scott McTominay',
  WAL: 'Brennan Johnson',
  ISL: 'Albert Gudmundsson',
  IRL: 'Evan Ferguson',
  UZB: 'Eldor Shomurodov',
}

async function fetchJSON(url: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const req = net.request(url)
    let body = ''
    req.on('response', (response) => {
      response.on('data', (chunk) => { body += chunk.toString() })
      response.on('end', () => {
        try { resolve(JSON.parse(body)) }
        catch (e) { reject(e) }
      })
    })
    req.on('error', reject)
    req.end()
  })
}

function flagEmoji(abbr: string): string {
  return FLAG_MAP[abbr.toUpperCase()] ?? '🏳️'
}

function parseCompetitor(c: Record<string, unknown>): Team {
  const team = c.team as Record<string, unknown> | undefined
  const teamAbbr = String(team?.abbreviation ?? c.abbreviation ?? '')
  return {
    id: String(c.id ?? team?.id ?? ''),
    name: String(c.displayName ?? team?.displayName ?? teamAbbr),
    abbreviation: teamAbbr,
    flagEmoji: flagEmoji(teamAbbr),
    teamLogo: team?.logo as string | undefined,
    starPlayer: STAR_PLAYER_MAP[teamAbbr.toUpperCase()] ?? '',
  }
}

async function fetchGoalScorers(eventId: string, sport = 'soccer', league = 'fifa.world'): Promise<GoalScorer[]> {
  try {
    const base = sport === 'soccer' ? espnBase(sport, league) : ESPN_BASE
    const data = await fetchJSON(`${base}/summary?event=${eventId}`) as Record<string, unknown>
    const header = data.header as Record<string, unknown> | undefined
    const comps = (header?.competitions as unknown[])?.[0] as Record<string, unknown> | undefined
    const details = (comps?.details as unknown[]) ?? []

    return details
      .filter((d) => (d as Record<string, unknown>).scoringPlay)
      .map((d) => {
        const detail = d as Record<string, unknown>
        const participants = (detail.participants as unknown[]) ?? []
        const scorer = (participants[0] as Record<string, unknown>)?.athlete as Record<string, unknown> | undefined
        const team = detail.team as Record<string, unknown> | undefined
        const typeText = String((detail.type as Record<string, unknown>)?.text ?? '')
        const pid = String(scorer?.id ?? '')
        return {
          playerId: pid || undefined,
          playerName: String(scorer?.shortName ?? scorer?.displayName ?? ''),
          clock: String((detail.clock as Record<string, unknown>)?.displayValue ?? ''),
          teamId: String(team?.id ?? ''),
          isPenalty: typeText.toLowerCase().includes('penalty'),
          isOwnGoal: typeText.toLowerCase().includes('own'),
        }
      })
  } catch {
    return []
  }
}

export async function fetchMatches(dateStr?: string, sport = 'soccer', league = 'fifa.world'): Promise<Match[]> {
  const base = espnBase(sport, league)
  const url = dateStr
    ? `${base}/scoreboard?dates=${dateStr}`
    : `${base}/scoreboard`

  const data = await fetchJSON(url) as Record<string, unknown>
  const events = (data.events as unknown[]) ?? []

  return events.map((event) => {
    const e = event as Record<string, unknown>
    const comps = (e.competitions as unknown[])?.[0] as Record<string, unknown>
    const competitors = (comps?.competitors as unknown[]) ?? []
    const statusObj = (e.status as Record<string, unknown>) ?? {}
    const statusType = (statusObj.type as Record<string, unknown>) ?? {}
    const broadcasts = ((comps?.broadcasts as unknown[]) ?? [])
      .flatMap((b: unknown) => {
        const br = b as Record<string, unknown>
        return (br.names as string[]) ?? [br.name as string].filter(Boolean)
      })

    const home = competitors.find((c) => (c as Record<string, unknown>).homeAway === 'home') as Record<string, unknown> | undefined
    const away = competitors.find((c) => (c as Record<string, unknown>).homeAway === 'away') as Record<string, unknown> | undefined
    const rawStatus = String(statusType.state ?? 'pre')
    const status: Match['status'] = rawStatus === 'in' ? 'in' : rawStatus === 'post' ? 'post' : 'pre'

    const oddsArr = (comps?.odds as unknown[]) ?? []
    let odds: MatchOddsInline | undefined
    const oddsObj = oddsArr.find((x) => x !== null) as Record<string, unknown> | undefined
    if (oddsObj) {
      const o = oddsObj
      const homeOdds = o.homeTeamOdds as Record<string, unknown> | undefined
      const awayOdds = o.awayTeamOdds as Record<string, unknown> | undefined
      const drawOdds = o.drawOdds as Record<string, unknown> | undefined
      const homeML = Number(homeOdds?.moneyLine ?? 0)
      const awayML = Number(awayOdds?.moneyLine ?? 0)
      const drawML = Number(drawOdds?.moneyLine ?? 0)
      if (homeML || awayML || drawML) {
        odds = {
          homeMoneyLine: homeML,
          awayMoneyLine: awayML,
          drawMoneyLine: drawML,
          overUnder: Number(o.overUnder ?? 0),
          homeIsFavorite: Boolean(homeOdds?.favorite),
        }
      }
    }

    return {
      id: String(e.id ?? ''),
      status,
      statusDetail: String(statusType.shortDetail ?? statusType.description ?? ''),
      clock: String(statusObj.displayClock ?? ''),
      date: new Date(e.date as string),
      homeTeam: home ? parseCompetitor(home) : { id: '', name: 'TBD', abbreviation: 'TBD', flagEmoji: '🏳️', starPlayer: '' },
      awayTeam: away ? parseCompetitor(away) : { id: '', name: 'TBD', abbreviation: 'TBD', flagEmoji: '🏳️', starPlayer: '' },
      homeScore: parseInt(String(home?.score ?? '0')) || 0,
      awayScore: parseInt(String(away?.score ?? '0')) || 0,
      broadcasts,
      venue: String((comps?.venue as Record<string, unknown>)?.fullName ?? ''),
      city: String(((comps?.venue as Record<string, unknown>)?.address as Record<string, unknown>)?.city ?? ''),
      goalScorers: [],
      odds,
    } satisfies Match
  })
}

export async function fetchMatchesWithGoals(dateStr?: string, sport = 'soccer', league = 'fifa.world'): Promise<Match[]> {
  const matches = await fetchMatches(dateStr, sport, league)

  if (sport !== 'soccer') return matches

  const withGoals = await Promise.all(
    matches.map(async (m) => {
      if (m.status === 'pre') return m
      const goals = await fetchGoalScorers(m.id, sport, league)
      return { ...m, goalScorers: goals }
    })
  )
  return withGoals
}

export async function fetchUpcomingMatches(days = 7, sport = 'soccer', league = 'fifa.world'): Promise<Match[]> {
  const results: Match[] = []
  const today = new Date()
  for (let i = 0; i < days; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
    try {
      const matches = await fetchMatches(dateStr, sport, league)
      results.push(...matches)
    } catch {
      // skip failed date
    }
  }
  const seen = new Set<string>()
  return results.filter((m) => { if (seen.has(m.id)) return false; seen.add(m.id); return true })
}

export interface MatchPlayer {
  id: string
  name: string
  shortName: string
  jersey: string
  position: string
  starter: boolean
  subbedIn: boolean
  subbedOut: boolean
}

export interface MatchEvent {
  type: 'goal' | 'ownGoal' | 'penalty' | 'yellowCard' | 'redCard' | 'sub'
  clock: string
  teamId: string
  playerId?: string
  playerName: string
  assistName?: string
  assistPlayerId?: string
  playerOut?: string
  playerOutId?: string
}

export interface MatchStat {
  label: string
  home: string
  away: string
}

export interface CommentaryEntry {
  sequence: number
  time: string       // "14'" or ""
  timeValue: number  // seconds
  text: string
  type: string       // 'goal', 'foul', 'substitution', etc.
  teamName: string   // team displayName or ""
}

export interface MatchOdds {
  spreadDetails: string  // "FRA -2.5"
  overUnder: number
  homeMoneyLine: number  // -1200
  awayMoneyLine: number  // +2500
  drawMoneyLine: number  // +1100
  homeIsFavorite: boolean
}

export interface MatchSummaryData {
  homeTeamId: string
  awayTeamId: string
  homeLineup: MatchPlayer[]
  awayLineup: MatchPlayer[]
  stats: MatchStat[]
  events: MatchEvent[]
  commentary: CommentaryEntry[]
  odds: MatchOdds | null
  attendance: number | null
  venueName: string
}

export async function fetchMatchSummary(eventId: string): Promise<MatchSummaryData> {
  const data = await fetchJSON(`${ESPN_BASE}/summary?event=${eventId}`) as Record<string, unknown>

  // ── Team IDs ─────────────────────────────────────────────────────
  const header = data.header as Record<string, unknown> | undefined
  const comps = (header?.competitions as unknown[])?.[0] as Record<string, unknown> | undefined
  const competitors = (comps?.competitors as unknown[]) ?? []
  const homeComp = competitors.find((c) => (c as Record<string, unknown>).homeAway === 'home') as Record<string, unknown> | undefined
  const awayComp = competitors.find((c) => (c as Record<string, unknown>).homeAway === 'away') as Record<string, unknown> | undefined
  const homeTeamId = String(homeComp?.id ?? (competitors[0] as Record<string, unknown> | undefined)?.id ?? '')
  const awayTeamId = String(awayComp?.id ?? (competitors[1] as Record<string, unknown> | undefined)?.id ?? '')

  // ── Events from keyEvents (goals, cards, subs) ───────────────────
  const INCLUDED_TYPES = new Set(['goal', 'own-goal', 'penalty-scored', 'yellow-card', 'red-card', 'substitution'])
  const keyEvents = (data.keyEvents as unknown[]) ?? []
  const events: MatchEvent[] = keyEvents
    .filter((e) => INCLUDED_TYPES.has(String((e as Record<string, unknown>).type && ((e as Record<string, unknown>).type as Record<string, unknown>).type)))
    .map((e) => {
      const ev = e as Record<string, unknown>
      const typeType = String((ev.type as Record<string, unknown>)?.type ?? '')
      const participants = (ev.participants as unknown[]) ?? []
      const primary = (participants[0] as Record<string, unknown>)?.athlete as Record<string, unknown> | undefined
      const secondary = (participants[1] as Record<string, unknown>)?.athlete as Record<string, unknown> | undefined
      const team = ev.team as Record<string, unknown> | undefined
      const clock = String((ev.clock as Record<string, unknown>)?.displayValue ?? '').replace(/'$/, '')

      let type: MatchEvent['type'] = 'goal'
      if (typeType === 'own-goal') type = 'ownGoal'
      else if (typeType === 'penalty-scored') type = 'penalty'
      else if (typeType === 'yellow-card') type = 'yellowCard'
      else if (typeType === 'red-card') type = 'redCard'
      else if (typeType === 'substitution') type = 'sub'

      return {
        type,
        clock,
        teamId: String(team?.id ?? ''),
        playerId: String(primary?.id ?? '') || undefined,
        playerName: String(primary?.displayName ?? ''),
        assistName: type === 'goal' && secondary ? String(secondary.displayName ?? '') : undefined,
        assistPlayerId: type === 'goal' && secondary ? String(secondary.id ?? '') || undefined : undefined,
        playerOut: type === 'sub' && secondary ? String(secondary.displayName ?? '') : undefined,
        playerOutId: type === 'sub' && secondary ? String(secondary.id ?? '') || undefined : undefined,
      }
    })
    .filter((e) => e.playerName)

  // ── Lineups ─────────────────────────────────────────────────────
  const rosters = (data.rosters as unknown[]) ?? []
  const homeLineup: MatchPlayer[] = []
  const awayLineup: MatchPlayer[] = []

  for (const r of rosters) {
    const roster = r as Record<string, unknown>
    const teamId = String((roster.team as Record<string, unknown>)?.id ?? '')
    const players = ((roster.roster as unknown[]) ?? []).map((p) => {
      const player = p as Record<string, unknown>
      const athlete = player.athlete as Record<string, unknown> | undefined
      const posObj = player.position as Record<string, unknown> | undefined
      return {
        id: String(athlete?.id ?? ''),
        name: String(athlete?.displayName ?? ''),
        shortName: String(athlete?.shortName ?? athlete?.displayName ?? ''),
        jersey: String(player.jersey ?? ''),
        position: String(posObj?.abbreviation ?? ''),
        starter: Boolean(player.starter),
        subbedIn: Boolean(player.subbedIn),
        subbedOut: Boolean(player.subbedOut),
      }
    })
    if (teamId === homeTeamId) homeLineup.push(...players)
    else awayLineup.push(...players)
  }

  // ── Stats ───────────────────────────────────────────────────────
  const boxTeams = ((data.boxscore as Record<string, unknown>)?.teams as unknown[]) ?? []
  const STAT_KEYS = [
    'possessionPct', 'totalShots', 'shotsOnTarget', 'wonCorners',
    'saves', 'foulsCommitted', 'yellowCards', 'offsides',
    'totalPasses', 'passPct', 'effectiveTackles', 'interceptions',
  ]
  const stats: MatchStat[] = []
  if (boxTeams.length >= 2) {
    const homeBox = (boxTeams as Record<string, unknown>[]).find((t) => t.homeAway === 'home') ?? boxTeams[0] as Record<string, unknown>
    const awayBox = (boxTeams as Record<string, unknown>[]).find((t) => t.homeAway === 'away') ?? boxTeams[1] as Record<string, unknown>
    const homeStats = (homeBox.statistics as unknown[]) ?? []
    const awayStats = (awayBox.statistics as unknown[]) ?? []
    for (const key of STAT_KEYS) {
      const h = (homeStats as Record<string, unknown>[]).find((s) => s.name === key)
      const a = (awayStats as Record<string, unknown>[]).find((s) => s.name === key)
      if (h && a) stats.push({ label: String(h.label ?? key), home: String(h.displayValue ?? ''), away: String(a.displayValue ?? '') })
    }
  }

  // ── Commentary ───────────────────────────────────────────────────
  const rawCommentary = (data.commentary as unknown[]) ?? []
  const commentary: CommentaryEntry[] = rawCommentary
    .filter((c) => String((c as Record<string, unknown>).text ?? '').trim())
    .map((c) => {
      const entry = c as Record<string, unknown>
      const play = entry.play as Record<string, unknown> | undefined
      const playType = String((play?.type as Record<string, unknown>)?.type ?? '')
      const teamName = String((play?.team as Record<string, unknown>)?.displayName ?? '')
      return {
        sequence: Number(entry.sequence ?? 0),
        time: String((entry.time as Record<string, unknown>)?.displayValue ?? ''),
        timeValue: Number((entry.time as Record<string, unknown>)?.value ?? 0),
        text: String(entry.text ?? ''),
        type: playType,
        teamName,
      }
    })
    .reverse()

  // ── Odds ─────────────────────────────────────────────────────────
  const oddsArr = (data.odds as unknown[]) ?? []
  let odds: MatchOdds | null = null
  if (oddsArr.length > 0) {
    const o = oddsArr[0] as Record<string, unknown>
    const homeOdds = o.homeTeamOdds as Record<string, unknown> | undefined
    const awayOdds = o.awayTeamOdds as Record<string, unknown> | undefined
    const drawOdds = o.drawOdds as Record<string, unknown> | undefined
    odds = {
      spreadDetails: String(o.details ?? ''),
      overUnder: Number(o.overUnder ?? 0),
      homeMoneyLine: Number(homeOdds?.moneyLine ?? 0),
      awayMoneyLine: Number(awayOdds?.moneyLine ?? 0),
      drawMoneyLine: Number(drawOdds?.moneyLine ?? 0),
      homeIsFavorite: Boolean(homeOdds?.favorite),
    }
  }

  // ── Attendance + Venue ───────────────────────────────────────────
  const gameInfo = data.gameInfo as Record<string, unknown> | undefined
  const attendance = Number(gameInfo?.attendance ?? 0) || null
  const venueName = String((gameInfo?.venue as Record<string, unknown>)?.fullName ?? '')

  return { homeTeamId, awayTeamId, homeLineup, awayLineup, stats, events, commentary, odds, attendance, venueName }
}

// ── Standings ────────────────────────────────────────────────────────

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
  advanceStatus: 'advance' | 'bubble' | 'eliminated' | null
}

export interface StandingsGroup {
  name: string
  entries: StandingsEntry[]
}

export async function fetchStandings(sport = 'soccer', league = 'fifa.world'): Promise<StandingsGroup[]> {
  const data = await fetchJSON(`${espnV2Base(sport, league)}/standings`) as Record<string, unknown>
  const children = (data.children as unknown[]) ?? []

  const groups: StandingsGroup[] = []
  for (const child of children) {
    const group = child as Record<string, unknown>
    const rawEntries = ((group.standings as Record<string, unknown>)?.entries as unknown[]) ?? []
    const entries: StandingsEntry[] = rawEntries.map((entry) => {
      const e = entry as Record<string, unknown>
      const team = e.team as Record<string, unknown> | undefined
      const stats = (e.stats as Record<string, unknown>[]) ?? []
      const getStat = (name: string) => Number(stats.find((s) => s.name === name)?.value ?? 0)
      const abbr = String(team?.abbreviation ?? '')
      const noteDesc = String((e.note as Record<string, unknown>)?.description ?? '').toLowerCase()
      let advanceStatus: StandingsEntry['advanceStatus'] = null
      if (noteDesc.includes('advance') || noteDesc.includes('round of')) advanceStatus = 'advance'
      else if (noteDesc.includes('best') || noteDesc.includes('bubble')) advanceStatus = 'bubble'
      else if (noteDesc.includes('eliminat')) advanceStatus = 'eliminated'

      return {
        teamId: String(team?.id ?? ''),
        name: String(team?.displayName ?? abbr),
        abbreviation: abbr,
        flagEmoji: flagEmoji(abbr),
        played: getStat('gamesPlayed'),
        w: getStat('wins'),
        d: getStat('ties'),
        l: getStat('losses'),
        gf: getStat('pointsFor'),
        ga: getStat('pointsAgainst'),
        gd: getStat('pointDifferential'),
        pts: getStat('points'),
        advanceStatus,
      }
    }).sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)
    if (entries.length > 0) groups.push({ name: String(group.name ?? ''), entries })
  }
  return groups
}

// ── Bracket ──────────────────────────────────────────────────────────

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
  venue?: string
}

export interface BracketRound {
  name: string
  matchups: BracketMatchup[]
}

const ROUND_ORDER = ['round-of-32', 'round-of-16', 'quarterfinals', 'semifinals', 'third-place-match', 'final']
const ROUND_NAMES: Record<string, string> = {
  'round-of-32': 'Round of 32',
  'round-of-16': 'Round of 16',
  'quarterfinals': 'Quarterfinals',
  'semifinals': 'Semifinals',
  'third-place-match': '3rd Place',
  'final': 'Final',
}

export async function fetchBracket(): Promise<BracketRound[]> {
  try {
    // Fetch all knockout rounds via scoreboard date range
    const data = await fetchJSON(`${ESPN_BASE}/scoreboard?dates=20260628-20260719`) as Record<string, unknown>
    const events = (data.events as unknown[]) ?? []

    const parseBracketTeam = (c: Record<string, unknown> | undefined, state: string): BracketTeam => {
      if (!c) return { id: '', name: 'TBD', abbreviation: 'TBD', flagEmoji: '🏳️' }
      const team = c.team as Record<string, unknown> | undefined
      const abbr = String(team?.abbreviation ?? '')
      const displayName = String(team?.displayName ?? abbr)
      // Real teams have short abbreviations (ARG, FRA). Slots have placeholders like "2A", "1C".
      const isRealTeam = /^[A-Z]{2,3}$/.test(abbr)
      return {
        id: String(team?.id ?? ''),
        name: displayName,
        abbreviation: abbr || 'TBD',
        flagEmoji: isRealTeam ? flagEmoji(abbr) : '🏳️',
        score: state !== 'pre' ? parseInt(String(c.score ?? '0')) || 0 : undefined,
        winner: Boolean(c.winner),
      }
    }

    const roundMap = new Map<string, BracketMatchup[]>()

    for (const event of events) {
      const e = event as Record<string, unknown>
      const slug = String((e.season as Record<string, unknown>)?.slug ?? '')
      if (!slug || !ROUND_ORDER.includes(slug)) continue

      const comp = ((e.competitions as unknown[])?.[0]) as Record<string, unknown> | undefined
      if (!comp) continue

      const competitors = (comp.competitors as unknown[]) ?? []
      const home = competitors.find((c) => (c as Record<string, unknown>).homeAway === 'home') as Record<string, unknown> | undefined
      const away = competitors.find((c) => (c as Record<string, unknown>).homeAway === 'away') as Record<string, unknown> | undefined
      const state = String(((comp.status as Record<string, unknown>)?.type as Record<string, unknown>)?.state ?? 'pre')

      const venueStr = String((comp.venue as Record<string, unknown>)?.fullName ?? '')
      const matchup: BracketMatchup = {
        id: String(e.id ?? ''),
        date: String(e.date ?? ''),
        status: state === 'in' ? 'in' : state === 'post' ? 'post' : 'pre',
        home: parseBracketTeam(home, state),
        away: parseBracketTeam(away, state),
        venue: venueStr || undefined,
      }

      if (!roundMap.has(slug)) roundMap.set(slug, [])
      roundMap.get(slug)!.push(matchup)
    }

    return ROUND_ORDER
      .filter((slug) => roundMap.has(slug))
      .map((slug) => ({ name: ROUND_NAMES[slug], matchups: roundMap.get(slug)! }))
  } catch {
    return []
  }
}

// ── Team page ─────────────────────────────────────────────────────────

export interface TeamPageAthlete {
  id: string
  name: string
  shortName: string
  jersey: string
  position: string
  photoUrl?: string
}

export interface TeamPageData {
  id: string
  name: string
  abbreviation: string
  flagEmoji: string
  logoUrl?: string
  coach?: string
  record?: string
  athletes: TeamPageAthlete[]
}

export async function fetchTeamPage(teamId: string): Promise<TeamPageData> {
  try {
    const data = await fetchJSON(`${ESPN_BASE}/teams/${teamId}?enable=roster`) as Record<string, unknown>
    const team = data.team as Record<string, unknown> | undefined
    if (!team) throw new Error('no team')

    const abbr = String(team.abbreviation ?? '')
    const logos = (team.logos as Record<string, unknown>[]) ?? []
    const logoUrl = logos[0]?.href as string | undefined

    const coachArr = (team.coaches as Record<string, unknown>[]) ?? []
    const coachObj = coachArr[0] as Record<string, unknown> | undefined
    const coachName = coachObj
      ? String((coachObj.coach as Record<string, unknown>)?.displayName ?? coachObj.displayName ?? '')
      : undefined

    const recordItems = ((team.record as Record<string, unknown>)?.items as Record<string, unknown>[]) ?? []
    const record = recordItems[0] ? String(recordItems[0].summary ?? '') : undefined

    const raw = (team.athletes as Record<string, unknown>[]) ?? []
    const athletes: TeamPageAthlete[] = raw.map((a) => {
      const posObj = a.position as Record<string, unknown> | undefined
      const headshot = a.headshot as Record<string, unknown> | undefined
      return {
        id: String(a.id ?? ''),
        name: String(a.displayName ?? ''),
        shortName: String(a.shortName ?? a.displayName ?? ''),
        jersey: String(a.jersey ?? ''),
        position: String(posObj?.abbreviation ?? posObj?.displayName ?? ''),
        photoUrl: headshot?.href as string | undefined,
      }
    })

    return {
      id: String(team.id ?? teamId),
      name: String(team.displayName ?? abbr),
      abbreviation: abbr,
      flagEmoji: flagEmoji(abbr),
      logoUrl,
      coach: coachName || undefined,
      record: record || undefined,
      athletes,
    }
  } catch {
    return { id: teamId, name: 'Unknown', abbreviation: '', flagEmoji: '🏳️', athletes: [] }
  }
}

// ── Player page ───────────────────────────────────────────────────────

export interface PlayerTournamentStats {
  appearances: number
  goals: number
  keyPasses: number
  shots: number
  passPct: string
  yellowCards: number
  redCards: number
}

export interface PlayerPageData {
  id: string
  name: string
  shortName: string
  position: string
  jersey: string
  nationality: string
  age?: number
  dateOfBirth?: string
  height?: string
  weight?: string
  photoUrl?: string
  teamName?: string
  teamAbbr?: string
  teamId?: string
  tournamentStats?: PlayerTournamentStats
}

export async function fetchPlayerPage(playerId: string): Promise<PlayerPageData> {
  try {
    const data = await fetchJSON(
      `https://sports.core.api.espn.com/v2/sports/soccer/athletes/${playerId}?lang=en&region=us`
    ) as Record<string, unknown>

    const position = data.position as Record<string, unknown> | undefined
    const headshot = data.headshot as Record<string, unknown> | undefined

    // Age from dateOfBirth
    let age: number | undefined
    let dateOfBirth: string | undefined
    const dobStr = String(data.dateOfBirth ?? '')
    if (dobStr) {
      try {
        const dob = new Date(dobStr)
        const now = new Date()
        age = now.getFullYear() - dob.getFullYear()
        if (now < new Date(now.getFullYear(), dob.getMonth(), dob.getDate())) age--
        dateOfBirth = dob.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      } catch { /* ignore */ }
    }

    // Team — may be a $ref link or inline object
    let teamName: string | undefined
    let teamAbbr: string | undefined
    let teamId: string | undefined
    const teamRef = data.team as Record<string, unknown> | undefined
    if (teamRef && !String(teamRef.$ref ?? '')) {
      teamName = String(teamRef.displayName ?? teamRef.name ?? '')
      teamAbbr = String(teamRef.abbreviation ?? '')
      teamId = String(teamRef.id ?? '')
    }

    // World Cup tournament stats
    let tournamentStats: PlayerTournamentStats | undefined
    try {
      const sData = await fetchJSON(
        `https://sports.core.api.espn.com/v2/sports/soccer/leagues/fifa.world/seasons/2026/athletes/${playerId}/statistics?lang=en&region=us`
      ) as Record<string, unknown>
      const cats = ((sData.splits as Record<string, unknown>)?.categories as unknown[]) ?? []
      // prefer `value` (raw number) over `displayValue` (pre-formatted string)
      const getStat = (catName: string, statName: string): number => {
        const cat = (cats as Record<string, unknown>[]).find((c) => c.name === catName)
        const stat = ((cat?.stats as unknown[]) ?? []) as Record<string, unknown>[]
        const found = stat.find((s) => s.name === statName)
        return Number(found?.value ?? found?.displayValue ?? 0) || 0
      }
      const apps = getStat('general', 'appearances')
      if (apps > 0) {
        const attemptsIn = getStat('offensive', 'attemptsInBox')
        const attemptsOut = getStat('offensive', 'attemptsOutBox')
        const passPctRaw = getStat('general', 'passPct')
        tournamentStats = {
          appearances: apps,
          goals: getStat('offensive', 'totalGoals'),
          keyPasses: getStat('offensive', 'shotAssists'),
          shots: attemptsIn + attemptsOut,
          // passPct is a 0–1 decimal in `value`; multiply to get display percentage
          passPct: passPctRaw > 0 ? `${Math.round(passPctRaw * 100)}%` : '',
          yellowCards: getStat('general', 'yellowCards'),
          redCards: getStat('general', 'redCards'),
        }
      }
    } catch { /* stats optional */ }

    return {
      id: playerId,
      name: String(data.displayName ?? data.fullName ?? ''),
      shortName: String(data.shortName ?? data.displayName ?? ''),
      position: String(position?.displayName ?? position?.abbreviation ?? ''),
      jersey: String(data.jersey ?? ''),
      nationality: String(data.displayCountry ?? data.citizenship ?? ''),
      age,
      dateOfBirth,
      height: String(data.displayHeight ?? ''),
      weight: String(data.displayWeight ?? ''),
      photoUrl: headshot?.href as string | undefined,
      teamName: teamName || undefined,
      teamAbbr: teamAbbr || undefined,
      teamId: teamId || undefined,
      tournamentStats,
    }
  } catch {
    return { id: playerId, name: 'Unknown Player', shortName: '', position: '', jersey: '', nationality: '' }
  }
}

// ── Leaders ───────────────────────────────────────────────────────────

export interface PlayerLeader {
  playerId: string
  name: string
  shortName: string
  nationality: string
  flagEmoji: string
  photoUrl?: string
  goals: number
  assists: number
  shotsOnTarget: number
  yellowCards: number
  redCards: number
  foulsCommitted: number
}

const leaderCache = new Map<string, { data: PlayerLeader[]; ts: number }>()
const LEADER_TTL = 5 * 60 * 1000
const CORE_BASE = 'https://sports.core.api.espn.com/v2/sports/soccer/leagues/fifa.world'

export async function fetchLeaders(season = 2026): Promise<PlayerLeader[]> {
  const key = String(season)
  const cached = leaderCache.get(key)
  if (cached && Date.now() - cached.ts < LEADER_TTL) return cached.data

  const data = await fetchJSON(
    `${CORE_BASE}/seasons/${season}/types/1/leaders?lang=en&region=us`
  ) as Record<string, unknown>

  const categories = (data.categories as Record<string, unknown>[]) ?? []

  const statFields: Record<string, string> = {
    goals: 'goals',
    assists: 'assists',
    shotsOnTarget: 'shotsOnTarget',
    yellowCards: 'yellowCards',
    redCards: 'redCards',
    foulsCommitted: 'foulsCommitted',
  }

  const playerStats = new Map<string, {
    goals: number; assists: number; shotsOnTarget: number;
    yellowCards: number; redCards: number; foulsCommitted: number
  }>()

  for (const cat of categories) {
    const field = statFields[String(cat.name ?? '')]
    if (!field) continue
    for (const leader of (cat.leaders as Record<string, unknown>[]) ?? []) {
      const ref = String((leader.athlete as Record<string, unknown>)?.$ref ?? '')
      const id = ref.match(/athletes\/(\d+)/)?.[1]
      if (!id) continue
      if (!playerStats.has(id)) {
        playerStats.set(id, { goals: 0, assists: 0, shotsOnTarget: 0, yellowCards: 0, redCards: 0, foulsCommitted: 0 })
      }
      ;(playerStats.get(id)! as Record<string, number>)[field] = Number(leader.value ?? 0)
    }
  }

  const ids = Array.from(playerStats.keys())
  const athleteResults = await Promise.allSettled(
    ids.map(id => fetchJSON(`${CORE_BASE}/seasons/${season}/athletes/${id}?lang=en&region=us`))
  )

  const players: PlayerLeader[] = []
  for (let i = 0; i < ids.length; i++) {
    const res = athleteResults[i]
    if (res.status !== 'fulfilled') continue
    const a = res.value as Record<string, unknown>
    const id = ids[i]
    const stats = playerStats.get(id)!
    const flagHref = String((a.flag as Record<string, unknown>)?.href ?? '')
    const countryCode = flagHref.match(/countries\/\d+\/([a-z]+)\.png/i)?.[1]?.toUpperCase() ?? ''
    players.push({
      playerId: id,
      name: String(a.displayName ?? a.fullName ?? ''),
      shortName: String(a.shortName ?? a.displayName ?? ''),
      nationality: String(a.displayCountry ?? a.citizenship ?? a.nationality ?? ''),
      flagEmoji: flagEmoji(countryCode),
      photoUrl: `https://a.espncdn.com/i/headshots/soccer/players/full/${id}.png`,
      ...stats,
    })
  }

  players.sort((a, b) => b.goals - a.goals || b.assists - a.assists)
  leaderCache.set(key, { data: players, ts: Date.now() })
  return players
}

// ────────────────────────────────────────────────────────────────────
const playerPhotoCache = new Map<string, string>()

export interface TeamInfo {
  id: string
  abbreviation: string
  name: string
  logo?: string
}

export async function fetchTeams(sport: string, league: string): Promise<TeamInfo[]> {
  try {
    const data = await fetchJSON(`${espnBase(sport, league)}/teams?limit=100`) as Record<string, unknown>
    const sports = (data.sports as Record<string, unknown>[]) ?? []
    const leagues = (sports[0]?.leagues as Record<string, unknown>[]) ?? []
    const teams = (leagues[0]?.teams as Record<string, unknown>[]) ?? []
    return teams.map((t) => {
      const team = t.team as Record<string, unknown>
      const logos = (team.logos as Record<string, unknown>[]) ?? []
      return {
        id: String(team.id ?? ''),
        abbreviation: String(team.abbreviation ?? ''),
        name: String(team.displayName ?? ''),
        logo: logos[0]?.href as string | undefined,
      }
    }).sort((a, b) => a.name.localeCompare(b.name))
  } catch {
    return []
  }
}

export async function fetchPlayerPhoto(playerName: string): Promise<string | null> {
  if (playerPhotoCache.has(playerName)) return playerPhotoCache.get(playerName)!
  try {
    const encoded = encodeURIComponent(playerName)
    const data = await fetchJSON(`${SPORTSDB_BASE}/searchplayers.php?p=${encoded}`) as Record<string, unknown>
    const players = (data.player as unknown[]) ?? []
    if (!players.length) return null
    const player = players[0] as Record<string, unknown>
    const photo = (player.strThumb as string) || (player.strCutout as string) || null
    if (photo) playerPhotoCache.set(playerName, photo)
    return photo
  } catch {
    return null
  }
}
