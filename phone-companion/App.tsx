import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator, Platform, RefreshControl,
  ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native'
import Constants from 'expo-constants'
import * as Clipboard from 'expo-clipboard'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

// ── Types ──────────────────────────────────────────────────────────────

type Tab = 'scoreboard' | 'standings' | 'setup'

interface Team { id: string; name: string; abbreviation: string; flagEmoji: string }
interface GoalScorer { playerName: string; clock: string; teamId: string; isPenalty: boolean; isOwnGoal: boolean }
interface Match {
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
  goalScorers: GoalScorer[]
}
interface StandingsEntry {
  name: string; abbreviation: string; flagEmoji: string
  played: number; w: number; d: number; l: number
  gf: number; ga: number; gd: number; pts: number
  advanceStatus: 'advance' | 'bubble' | 'eliminated' | null
}
interface StandingsGroup { name: string; entries: StandingsEntry[] }
interface NotifMatch {
  event: string; homeTeam: string; homeFlag: string; awayTeam: string; awayFlag: string
  homeScore: number; awayScore: number; scorer?: string; scorerTeam?: string; channel?: string
  notifTitle: string; notifBody: string
}
type Status = 'loading' | 'ok' | 'denied' | 'no-project' | 'error'

// ── Data ──────────────────────────────────────────────────────────────

const ESPN = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world'
const ESPNV2 = 'https://site.api.espn.com/apis/v2/sports/soccer/fifa.world'

const FLAGS: Record<string, string> = {
  ARG:'🇦🇷',BRA:'🇧🇷',FRA:'🇫🇷',GER:'🇩🇪',ENG:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',ESP:'🇪🇸',POR:'🇵🇹',NED:'🇳🇱',
  BEL:'🇧🇪',URU:'🇺🇾',MEX:'🇲🇽',USA:'🇺🇸',CAN:'🇨🇦',JAP:'🇯🇵',JPN:'🇯🇵',KOR:'🇰🇷',
  MAR:'🇲🇦',SEN:'🇸🇳',GHA:'🇬🇭',NGA:'🇳🇬',CMR:'🇨🇲',CRO:'🇭🇷',SRB:'🇷🇸',SUI:'🇨🇭',
  DEN:'🇩🇰',POL:'🇵🇱',AUS:'🇦🇺',NZL:'🇳🇿',ECU:'🇪🇨',TUN:'🇹🇳',IRN:'🇮🇷',SAU:'🇸🇦',
  COL:'🇨🇴',PAN:'🇵🇦',CRC:'🇨🇷',HON:'🇭🇳',JAM:'🇯🇲',SLV:'🇸🇻',GTM:'🇬🇹',HAI:'🇭🇹',
  NOR:'🇳🇴',SWE:'🇸🇪',AUT:'🇦🇹',HUN:'🇭🇺',SRB2:'🇷🇸',CZE:'🇨🇿',UKR:'🇺🇦',GRE:'🇬🇷',
  TUR:'🇹🇷',IRQ:'🇮🇶',JOR:'🇯🇴',EGY:'🇪🇬',ALG:'🇩🇿',MLI:'🇲🇱',CIV:'🇨🇮',SCO:'🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  WAL:'🏴󠁧󠁢󠁷󠁬󠁳󠁿',ISL:'🇮🇸',IRL:'🇮🇪',UZB:'🇺🇿',
}

function flag(abbr: string) { return FLAGS[abbr?.toUpperCase()] ?? '🏳️' }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseTeam(c: any): Team {
  const team = c.team ?? c
  const abbr = String(team.abbreviation ?? '')
  return { id: String(c.id ?? team.id ?? ''), name: String(c.displayName ?? team.displayName ?? abbr), abbreviation: abbr, flagEmoji: flag(abbr) }
}

const TBD: Team = { id: '', name: 'TBD', abbreviation: 'TBD', flagEmoji: '🏳️' }

async function fetchMatches(): Promise<Match[]> {
  const res = await fetch(`${ESPN}/scoreboard`)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await res.json()
  return (data.events ?? []).map((e: any) => {
    const comp = e.competitions?.[0] ?? {}
    const competitors = comp.competitors ?? []
    const statusType = e.status?.type ?? {}
    const home = competitors.find((c: any) => c.homeAway === 'home')
    const away = competitors.find((c: any) => c.homeAway === 'away')
    const rawState = String(statusType.state ?? 'pre')
    const status: Match['status'] = rawState === 'in' ? 'in' : rawState === 'post' ? 'post' : 'pre'
    const broadcasts = (comp.broadcasts ?? []).flatMap((b: any) => b.names ?? [b.name].filter(Boolean))
    return {
      id: String(e.id ?? ''),
      status,
      statusDetail: String(statusType.shortDetail ?? statusType.description ?? ''),
      clock: String(e.status?.displayClock ?? ''),
      date: new Date(e.date ?? ''),
      homeTeam: home ? parseTeam(home) : TBD,
      awayTeam: away ? parseTeam(away) : TBD,
      homeScore: parseInt(String(home?.score ?? '0')) || 0,
      awayScore: parseInt(String(away?.score ?? '0')) || 0,
      broadcasts,
      venue: String(comp.venue?.fullName ?? ''),
      goalScorers: [],
    }
  })
}

async function fetchGoalScorers(matchId: string): Promise<GoalScorer[]> {
  try {
    const res = await fetch(`${ESPN}/summary?event=${matchId}`)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json()
    const details = data.header?.competitions?.[0]?.details ?? []
    return (details as any[]).filter((d: any) => d.scoringPlay).map((d: any) => ({
      playerName: String(d.participants?.[0]?.athlete?.shortName ?? d.participants?.[0]?.athlete?.displayName ?? ''),
      clock: String(d.clock?.displayValue ?? ''),
      teamId: String(d.team?.id ?? ''),
      isPenalty: String(d.type?.text ?? '').toLowerCase().includes('penalty'),
      isOwnGoal: String(d.type?.text ?? '').toLowerCase().includes('own'),
    }))
  } catch { return [] }
}

async function fetchStandings(): Promise<StandingsGroup[]> {
  const res = await fetch(`${ESPNV2}/standings`)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await res.json()
  return ((data.children ?? []) as any[]).map((group: any) => {
    const entries: StandingsEntry[] = ((group.standings?.entries ?? []) as any[]).map((e: any) => {
      const stats = (e.stats ?? []) as any[]
      const gs = (name: string) => Number(stats.find((s: any) => s.name === name)?.value ?? 0)
      const abbr = String(e.team?.abbreviation ?? '')
      const note = String(e.note?.description ?? '').toLowerCase()
      let advanceStatus: StandingsEntry['advanceStatus'] = null
      if (note.includes('advance') || note.includes('round of')) advanceStatus = 'advance'
      else if (note.includes('best') || note.includes('bubble')) advanceStatus = 'bubble'
      else if (note.includes('eliminat')) advanceStatus = 'eliminated'
      return {
        name: String(e.team?.displayName ?? abbr), abbreviation: abbr, flagEmoji: flag(abbr),
        played: gs('gamesPlayed'), w: gs('wins'), d: gs('ties'), l: gs('losses'),
        gf: gs('pointsFor'), ga: gs('pointsAgainst'), gd: gs('pointDifferential'), pts: gs('points'),
        advanceStatus,
      }
    }).sort((a: StandingsEntry, b: StandingsEntry) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)
    return { name: String(group.name ?? ''), entries }
  }).filter((g: StandingsGroup) => g.entries.length > 0)
}

// ── Theme ─────────────────────────────────────────────────────────────

const C = {
  bg: '#08080c',
  card: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.08)',
  text: '#fff',
  dim: 'rgba(255,255,255,0.45)',
  dimmer: 'rgba(255,255,255,0.25)',
  live: '#ef4444',
  liveB: 'rgba(239,68,68,0.12)',
  liveBorder: 'rgba(239,68,68,0.3)',
  green: 'rgba(74,222,128,0.9)',
  greenB: 'rgba(74,222,128,0.1)',
  greenBorder: 'rgba(74,222,128,0.35)',
}

function fmtTime(d: Date) { return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) }
function fmtDate(d: Date) { return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }

// ── MatchCard ─────────────────────────────────────────────────────────

function MatchCard({ match, onPress }: { match: Match; onPress: () => void }) {
  const live = match.status === 'in'
  const post = match.status === 'post'
  return (
    <TouchableOpacity style={mc.card} onPress={onPress} activeOpacity={0.7}>
      <View style={mc.row}>
        <View style={mc.team}>
          <Text style={mc.flag}>{match.homeTeam.flagEmoji}</Text>
          <Text style={[mc.name, live && mc.nameActive]} numberOfLines={1}>{match.homeTeam.name}</Text>
        </View>
        <View style={mc.center}>
          {match.status === 'pre'
            ? <Text style={mc.timeText}>{fmtTime(match.date)}</Text>
            : <Text style={[mc.score, live && mc.scoreLive]}>{match.homeScore}–{match.awayScore}</Text>
          }
          <View style={[mc.badge, live ? mc.badgeLive : post ? mc.badgePost : mc.badgePre]}>
            <Text style={[mc.badgeTxt, live ? mc.liveTxt : mc.dimTxt]}>
              {live ? (match.clock || match.statusDetail) : post ? 'FT' : fmtDate(match.date)}
            </Text>
          </View>
        </View>
        <View style={[mc.team, mc.teamR]}>
          <Text style={mc.flag}>{match.awayTeam.flagEmoji}</Text>
          <Text style={[mc.name, mc.nameR, live && mc.nameActive]} numberOfLines={1}>{match.awayTeam.name}</Text>
        </View>
      </View>
      {match.broadcasts[0] ? <Text style={mc.broadcast}>📺 {match.broadcasts[0]}</Text> : null}
    </TouchableOpacity>
  )
}
const mc = StyleSheet.create({
  card: { backgroundColor: C.card, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: C.border },
  row: { flexDirection: 'row', alignItems: 'center' },
  team: { flex: 1, alignItems: 'center', gap: 4 },
  teamR: { alignItems: 'center' },
  flag: { fontSize: 28 },
  name: { fontSize: 11, color: C.dim, textAlign: 'center', fontWeight: '600' },
  nameR: { textAlign: 'center' },
  nameActive: { color: '#fff' },
  center: { alignItems: 'center', paddingHorizontal: 8, gap: 5, minWidth: 84 },
  score: { fontSize: 24, fontWeight: '900', color: C.text, letterSpacing: -0.5 },
  scoreLive: { color: '#fff' },
  timeText: { fontSize: 20, fontWeight: '800', color: C.text },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  badgeLive: { backgroundColor: C.liveB, borderColor: C.liveBorder },
  badgePost: { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: C.border },
  badgePre: { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: C.border },
  badgeTxt: { fontSize: 10, fontWeight: '700' },
  liveTxt: { color: C.live },
  dimTxt: { color: C.dimmer },
  broadcast: { fontSize: 10, color: C.dimmer, marginTop: 6, textAlign: 'center' },
})

// ── MatchDetail ────────────────────────────────────────────────────────

function MatchDetail({ match: init, onBack }: { match: Match; onBack: () => void }) {
  const [match, setMatch] = useState(init)
  const [loading, setLoading] = useState(init.status !== 'pre')
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = useCallback(async () => {
    const scorers = await fetchGoalScorers(init.id)
    if (init.status === 'in') {
      try {
        const fresh = await fetchMatches()
        const u = fresh.find(m => m.id === init.id)
        setMatch(u ? { ...u, goalScorers: scorers } : m => ({ ...m, goalScorers: scorers }))
      } catch { setMatch(m => ({ ...m, goalScorers: scorers })) }
    } else {
      setMatch(m => ({ ...m, goalScorers: scorers }))
    }
    setLoading(false)
  }, [init.id, init.status])

  useEffect(() => {
    if (init.status !== 'pre') load()
    if (init.status === 'in') timer.current = setInterval(load, 30000)
    return () => { if (timer.current) clearInterval(timer.current) }
  }, [load, init.status])

  const live = match.status === 'in'
  const post = match.status === 'post'

  return (
    <View style={md.root}>
      <StatusBar barStyle="light-content" />
      <TouchableOpacity style={md.back} onPress={onBack}>
        <Text style={md.backTxt}>← Back</Text>
      </TouchableOpacity>

      {live && (
        <View style={md.livePill}>
          <View style={md.liveDot} />
          <Text style={md.liveTxt}>{match.clock || 'Live'}</Text>
        </View>
      )}
      {post && (
        <View style={md.ftPill}>
          <Text style={md.ftTxt}>Full Time</Text>
        </View>
      )}

      {/* Score header */}
      <View style={md.scoreRow}>
        <View style={md.teamBlock}>
          <Text style={md.bigFlag}>{match.homeTeam.flagEmoji}</Text>
          <Text style={md.teamName}>{match.homeTeam.name}</Text>
        </View>
        {match.status === 'pre' ? (
          <View style={md.mid}>
            <Text style={md.kickTime}>{fmtTime(match.date)}</Text>
            <Text style={md.kickDate}>{fmtDate(match.date)}</Text>
          </View>
        ) : (
          <View style={md.mid}>
            <Text style={md.bigScore}>{match.homeScore}</Text>
            <Text style={md.dash}>–</Text>
            <Text style={md.bigScore}>{match.awayScore}</Text>
          </View>
        )}
        <View style={md.teamBlock}>
          <Text style={md.bigFlag}>{match.awayTeam.flagEmoji}</Text>
          <Text style={md.teamName}>{match.awayTeam.name}</Text>
        </View>
      </View>

      <ScrollView style={md.scroll} contentContainerStyle={md.scrollContent} showsVerticalScrollIndicator={false}>
        {loading && <ActivityIndicator color={C.dim} style={{ marginVertical: 24 }} />}

        {!loading && match.goalScorers.length > 0 && (
          <View style={md.section}>
            <Text style={md.sectionTitle}>Goals</Text>
            {match.goalScorers.map((g, i) => (
              <View key={i} style={md.goalRow}>
                <Text style={md.goalClock}>{g.clock}'</Text>
                <Text style={md.goalIcon}>{g.isOwnGoal ? '🔴' : g.isPenalty ? '⚽ P' : '⚽'}</Text>
                <Text style={md.goalName}>{g.playerName}{g.isOwnGoal ? ' (OG)' : ''}</Text>
              </View>
            ))}
          </View>
        )}

        {(match.venue || match.broadcasts[0]) && (
          <View style={md.section}>
            {match.venue ? <Text style={md.meta}>🏟 {match.venue}</Text> : null}
            {match.broadcasts[0] ? <Text style={md.meta}>📺 {match.broadcasts[0]}</Text> : null}
          </View>
        )}
      </ScrollView>
    </View>
  )
}
const md = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg, paddingTop: 54 },
  back: { position: 'absolute', top: 56, left: 20, zIndex: 10 },
  backTxt: { fontSize: 16, color: C.dim, fontWeight: '600' },
  livePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center',
    backgroundColor: C.liveB, borderWidth: 1, borderColor: C.liveBorder,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, marginTop: 8,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.live },
  liveTxt: { fontSize: 12, color: C.live, fontWeight: '700' },
  ftPill: {
    alignSelf: 'center', marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: C.border,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
  },
  ftTxt: { fontSize: 12, color: C.dimmer, fontWeight: '600' },
  scoreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 28 },
  teamBlock: { flex: 1, alignItems: 'center', gap: 8 },
  bigFlag: { fontSize: 52 },
  teamName: { fontSize: 13, color: C.dim, fontWeight: '700', textAlign: 'center' },
  mid: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, gap: 4 },
  bigScore: { fontSize: 44, fontWeight: '900', color: C.text, lineHeight: 52 },
  dash: { fontSize: 30, color: C.dimmer, fontWeight: '300' },
  kickTime: { fontSize: 28, fontWeight: '900', color: C.text },
  kickDate: { fontSize: 12, color: C.dim, marginTop: 2 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },
  section: { backgroundColor: C.card, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.border },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: C.dimmer, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  goalRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5 },
  goalClock: { fontSize: 12, color: C.dimmer, width: 28, textAlign: 'right' },
  goalIcon: { fontSize: 14 },
  goalName: { fontSize: 13, color: C.text, fontWeight: '500', flex: 1 },
  meta: { fontSize: 13, color: C.dim, paddingVertical: 4 },
})

// ── ScoreboardTab ──────────────────────────────────────────────────────

function ScoreboardTab({ onMatchPress }: { onMatchPress: (m: Match) => void }) {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try { setMatches(await fetchMatches()) } catch {}
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => {
    load()
    timer.current = setInterval(() => load(true), 60000)
    return () => { if (timer.current) clearInterval(timer.current) }
  }, [load])

  const live = matches.filter(m => m.status === 'in')
  const pre  = matches.filter(m => m.status === 'pre')
  const post = matches.filter(m => m.status === 'post')

  if (loading) return <View style={tab.center}><ActivityIndicator color={C.dim} size="large" /></View>
  if (!matches.length) return <View style={tab.center}><Text style={tab.empty}>No matches today</Text></View>

  return (
    <ScrollView
      style={tab.scroll}
      contentContainerStyle={tab.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true) }} tintColor={C.dim} />}
    >
      {live.length > 0 && (
        <>
          <View style={tab.liveHeader}><View style={tab.liveDot} /><Text style={tab.section}>Live Now</Text></View>
          {live.map(m => <MatchCard key={m.id} match={m} onPress={() => onMatchPress(m)} />)}
        </>
      )}
      {pre.length > 0 && (
        <>
          <Text style={tab.section}>Upcoming</Text>
          {pre.map(m => <MatchCard key={m.id} match={m} onPress={() => onMatchPress(m)} />)}
        </>
      )}
      {post.length > 0 && (
        <>
          <Text style={tab.section}>Results</Text>
          {post.map(m => <MatchCard key={m.id} match={m} onPress={() => onMatchPress(m)} />)}
        </>
      )}
    </ScrollView>
  )
}
const tab = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { fontSize: 14, color: C.dimmer },
  section: { fontSize: 11, fontWeight: '700', color: C.dimmer, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, marginTop: 4 },
  liveHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10, marginTop: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.live },
})

// ── StandingsTab ───────────────────────────────────────────────────────

function StandingsTab() {
  const [groups, setGroups] = useState<StandingsGroup[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchStandings().then(g => { setGroups(g); setLoading(false) }).catch(() => setLoading(false)) }, [])

  if (loading) return <View style={st.center}><ActivityIndicator color={C.dim} size="large" /></View>

  return (
    <ScrollView style={st.scroll} contentContainerStyle={st.content}>
      {groups.map(group => (
        <View key={group.name} style={st.group}>
          <Text style={st.groupName}>{group.name}</Text>
          <View style={st.hRow}>
            <Text style={[st.hCell, st.colTeam]}>Team</Text>
            {['P','W','D','L','GD','PTS'].map(h => <Text key={h} style={st.hCell}>{h}</Text>)}
          </View>
          {group.entries.map((e, i) => {
            const barColor = e.advanceStatus === 'advance' ? '#22c55e'
              : e.advanceStatus === 'bubble' ? '#eab308'
              : e.advanceStatus === 'eliminated' ? C.live : 'transparent'
            return (
              <View key={e.abbreviation} style={[st.row, i < group.entries.length - 1 && st.rowBorder]}>
                <View style={[st.advBar, { backgroundColor: barColor }]} />
                <View style={[st.cell, st.colTeam, { flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
                  <Text style={st.entryFlag}>{e.flagEmoji}</Text>
                  <Text style={st.teamTxt} numberOfLines={1}>{e.abbreviation}</Text>
                </View>
                <Text style={st.cell}>{e.played}</Text>
                <Text style={st.cell}>{e.w}</Text>
                <Text style={st.cell}>{e.d}</Text>
                <Text style={st.cell}>{e.l}</Text>
                <Text style={st.cell}>{e.gd > 0 ? `+${e.gd}` : e.gd}</Text>
                <Text style={[st.cell, st.ptsTxt]}>{e.pts}</Text>
              </View>
            )
          })}
        </View>
      ))}
    </ScrollView>
  )
}
const st = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  group: { backgroundColor: C.card, borderRadius: 14, marginBottom: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  groupName: { fontSize: 12, fontWeight: '800', color: '#fff', padding: 12, paddingBottom: 8, letterSpacing: 0.3 },
  hRow: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: C.border },
  hCell: { flex: 1, fontSize: 10, color: C.dimmer, fontWeight: '700', textAlign: 'center', textTransform: 'uppercase' },
  row: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10, alignItems: 'center', position: 'relative' },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  advBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  cell: { flex: 1, fontSize: 12, color: C.dim, textAlign: 'center' },
  colTeam: { flex: 2.5, textAlign: 'left' },
  ptsTxt: { color: '#fff', fontWeight: '800' },
  entryFlag: { fontSize: 14 },
  teamTxt: { fontSize: 12, color: C.text, fontWeight: '600' },
})

// ── SetupTab ───────────────────────────────────────────────────────────

function SetupTab() {
  const [token, setToken] = useState('')
  const [status, setStatus] = useState<Status>('loading')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function register() {
      if (!Device.isDevice) { setStatus('error'); return }
      const { status: existing } = await Notifications.getPermissionsAsync()
      const final = existing === 'granted' ? existing : (await Notifications.requestPermissionsAsync()).status
      if (final !== 'granted') { setStatus('denied'); return }
      const projectId = Constants.expoConfig?.extra?.eas?.projectId
      if (!projectId) { setStatus('no-project'); return }
      try { const { data } = await Notifications.getExpoPushTokenAsync({ projectId }); setToken(data); setStatus('ok') }
      catch { setStatus('error') }
    }
    register()
  }, [])

  async function copy() { await Clipboard.setStringAsync(token); setCopied(true); setTimeout(() => setCopied(false), 2500) }

  return (
    <ScrollView style={su.scroll} contentContainerStyle={su.content}>
      <Text style={su.heading}>Push Notifications</Text>
      <Text style={su.sub}>Copy your token and paste it into the desktop app → Settings → Phone Notifications to receive live alerts.</Text>

      {status === 'loading' && <ActivityIndicator color={C.dim} style={{ marginTop: 20 }} />}
      {status === 'denied' && (
        <View style={su.msg}>
          <Text style={su.msgTitle}>Permission denied</Text>
          <Text style={su.msgBody}>Go to iOS Settings → Notifications → Expo Go and enable Allow Notifications.</Text>
        </View>
      )}
      {(status === 'no-project' || status === 'error') && (
        <View style={su.msg}>
          <Text style={su.msgTitle}>{status === 'no-project' ? 'Setup needed' : 'Could not get token'}</Text>
          <Text style={su.msgBody}>Run <Text style={su.code}>npx eas-cli init</Text> in phone-companion/ and sign in with <Text style={su.code}>npx expo login</Text>.</Text>
        </View>
      )}
      {status === 'ok' && token && (
        <View style={su.card}>
          <Text style={su.cardLabel}>Your push token</Text>
          <Text style={su.token} selectable>{token}</Text>
          <TouchableOpacity style={[su.btn, copied && su.btnDone]} onPress={copy} activeOpacity={0.75}>
            <Text style={[su.btnTxt, copied && su.btnTxtDone]}>{copied ? '✓  Copied!' : 'Copy token'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  )
}
const su = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  heading: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 8 },
  sub: { fontSize: 13, color: C.dim, lineHeight: 19, marginBottom: 24 },
  msg: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 16, gap: 6, marginBottom: 16 },
  msgTitle: { fontSize: 14, fontWeight: '700', color: 'rgba(239,68,68,0.85)' },
  msgBody: { fontSize: 13, color: C.dim, lineHeight: 19 },
  code: { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', color: C.green, fontSize: 12 },
  card: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 18, gap: 14 },
  cardLabel: { fontSize: 12, color: C.dimmer, textAlign: 'center' },
  token: { fontSize: 11, color: '#fff', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', lineHeight: 18, textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 8, padding: 10 },
  btn: { backgroundColor: C.greenB, borderWidth: 1, borderColor: C.greenBorder, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  btnDone: { backgroundColor: 'rgba(74,222,128,0.18)', borderColor: 'rgba(74,222,128,0.6)' },
  btnTxt: { fontSize: 15, fontWeight: '700', color: C.green },
  btnTxtDone: { color: 'rgba(74,222,128,1)' },
})

// ── NotifMatchView (quick view from notification tap) ──────────────────

function NotifMatchView({ data, onClose }: { data: NotifMatch; onClose: () => void }) {
  const scored = data.event === 'goal' || data.event === 'halftime' || data.event === 'fulltime'
  const labels: Record<string, string> = { kickoff: 'Upcoming Kickoff', goal: 'Goal', halftime: 'Half Time', fulltime: 'Full Time' }
  const icons: Record<string, string>  = { kickoff: '⚽', goal: '⚽', halftime: '🕐', fulltime: '🏁' }
  return (
    <View style={nm.root}>
      <StatusBar barStyle="light-content" />
      <TouchableOpacity style={nm.back} onPress={onClose}><Text style={nm.backTxt}>← Back</Text></TouchableOpacity>
      <View style={nm.pill}>
        <Text style={nm.pillIcon}>{icons[data.event] ?? '⚽'}</Text>
        <Text style={nm.pillLabel}>{labels[data.event] ?? data.event}</Text>
      </View>
      <View style={nm.card}>
        <View style={nm.teams}>
          <View style={nm.teamCol}><Text style={nm.bigFlag}>{data.homeFlag}</Text><Text style={nm.teamName}>{data.homeTeam}</Text></View>
          {scored
            ? <View style={nm.scoreBox}><Text style={nm.score}>{data.homeScore}</Text><Text style={nm.dash}>–</Text><Text style={nm.score}>{data.awayScore}</Text></View>
            : <Text style={nm.vs}>vs</Text>
          }
          <View style={nm.teamCol}><Text style={nm.bigFlag}>{data.awayFlag}</Text><Text style={nm.teamName}>{data.awayTeam}</Text></View>
        </View>
        {data.event === 'goal' && data.scorer && (
          <View style={nm.extra}><Text style={nm.extraTxt}>⚽ {data.scorer} · {data.scorerTeam}</Text></View>
        )}
        {data.event === 'kickoff' && data.channel && (
          <View style={nm.extra}><Text style={nm.extraTxt}>📺 {data.channel}</Text></View>
        )}
      </View>
      <Text style={nm.body}>{data.notifBody}</Text>
    </View>
  )
}
const nm = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', padding: 28 },
  back: { position: 'absolute', top: 60, left: 24 },
  backTxt: { fontSize: 15, color: C.dim, fontWeight: '600' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: C.border, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 28 },
  pillIcon: { fontSize: 14 },
  pillLabel: { fontSize: 12, color: C.dim, fontWeight: '600', letterSpacing: 0.3 },
  card: { width: '100%', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 20, padding: 24, gap: 16 },
  teams: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  teamCol: { alignItems: 'center', flex: 1, gap: 8 },
  bigFlag: { fontSize: 48 },
  teamName: { fontSize: 13, fontWeight: '700', color: C.dim, textAlign: 'center' },
  scoreBox: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8 },
  score: { fontSize: 40, fontWeight: '900', color: '#fff', lineHeight: 48 },
  dash: { fontSize: 28, color: C.dimmer, fontWeight: '300' },
  vs: { fontSize: 18, color: C.dimmer, fontWeight: '300', paddingHorizontal: 12 },
  extra: { borderTopWidth: 1, borderTopColor: C.border, paddingTop: 14, alignItems: 'center' },
  extraTxt: { fontSize: 13, color: C.dim, textAlign: 'center' },
  body: { marginTop: 20, fontSize: 12, color: C.dimmer, textAlign: 'center', lineHeight: 18, paddingHorizontal: 16 },
})

// ── TabBar ─────────────────────────────────────────────────────────────

function TabBar({ tab: active, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'scoreboard', label: 'Scores', icon: '⚽' },
    { id: 'standings', label: 'Standings', icon: '📊' },
    { id: 'setup',     label: 'Setup',    icon: '🔔' },
  ]
  return (
    <View style={tb.bar}>
      {tabs.map(t => (
        <TouchableOpacity key={t.id} style={tb.tabItem} onPress={() => setTab(t.id)} activeOpacity={0.7}>
          <Text style={tb.icon}>{t.icon}</Text>
          <Text style={[tb.label, active === t.id && tb.labelActive]}>{t.label}</Text>
          {active === t.id && <View style={tb.dot} />}
        </TouchableOpacity>
      ))}
    </View>
  )
}
const tb = StyleSheet.create({
  bar: { flexDirection: 'row', backgroundColor: 'rgba(10,10,15,0.98)', borderTopWidth: 1, borderTopColor: C.border, paddingBottom: Platform.OS === 'ios' ? 24 : 8, paddingTop: 8 },
  tabItem: { flex: 1, alignItems: 'center', gap: 2 },
  icon: { fontSize: 18 },
  label: { fontSize: 10, color: C.dimmer, fontWeight: '600' },
  labelActive: { color: '#fff' },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: C.green, marginTop: 1 },
})

// ── App ────────────────────────────────────────────────────────────────

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('scoreboard')
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [notifMatch, setNotifMatch]       = useState<NotifMatch | null>(null)

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(response => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d = response.notification.request.content.data as any
      const title = response.notification.request.content.title ?? ''
      const body  = response.notification.request.content.body  ?? ''
      if (d?.homeTeam && d?.awayTeam) {
        setNotifMatch({
          event: d.event ?? 'goal',
          homeTeam: d.homeTeam, homeFlag: d.homeFlag ?? '',
          awayTeam: d.awayTeam, awayFlag: d.awayFlag ?? '',
          homeScore: d.homeScore ?? 0, awayScore: d.awayScore ?? 0,
          scorer: d.scorer, scorerTeam: d.scorerTeam, channel: d.channel,
          notifTitle: title, notifBody: body,
        })
      }
    })
    return () => sub.remove()
  }, [])

  if (notifMatch)    return <NotifMatchView data={notifMatch} onClose={() => setNotifMatch(null)} />
  if (selectedMatch) return <MatchDetail match={selectedMatch} onBack={() => setSelectedMatch(null)} />

  return (
    <View style={app.root}>
      <StatusBar barStyle="light-content" />
      <View style={app.header}>
        <Text style={app.headerIcon}>⚽</Text>
        <View>
          <Text style={app.title}>World Cup 2026</Text>
          <Text style={app.sub}>USA · Canada · Mexico</Text>
        </View>
      </View>
      <View style={app.content}>
        {activeTab === 'scoreboard' && <ScoreboardTab onMatchPress={setSelectedMatch} />}
        {activeTab === 'standings'  && <StandingsTab />}
        {activeTab === 'setup'      && <SetupTab />}
      </View>
      <TabBar tab={activeTab} setTab={setActiveTab} />
    </View>
  )
}

const app = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  headerIcon: { fontSize: 22 },
  title: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  sub: { fontSize: 11, color: C.dimmer, marginTop: 1 },
  content: { flex: 1 },
})
