import { useState, useEffect } from 'react'
import type { Match } from '../types'

interface MatchPlayer {
  name: string; shortName: string; jersey: string; position: string
  starter: boolean; subbedIn: boolean; subbedOut: boolean
}
interface MatchEvent {
  type: 'goal' | 'ownGoal' | 'penalty' | 'yellowCard' | 'redCard' | 'sub'
  clock: string; teamId: string; playerName: string; assistName?: string; playerOut?: string
}
interface MatchStat { label: string; home: string; away: string }
interface CommentaryEntry {
  sequence: number; time: string; timeValue: number
  text: string; type: string; teamName: string
}
interface MatchOdds {
  spreadDetails: string; overUnder: number
  homeMoneyLine: number; awayMoneyLine: number; drawMoneyLine: number
  homeIsFavorite: boolean
}
interface Summary {
  homeTeamId: string; awayTeamId: string
  homeLineup: MatchPlayer[]; awayLineup: MatchPlayer[]
  stats: MatchStat[]; events: MatchEvent[]
  commentary: CommentaryEntry[]; odds: MatchOdds | null
  attendance: number | null; venueName: string
}

type Tab = 'feed' | 'lineups' | 'stats'

const STAT_GROUPS: { label: string; keys: string[] }[] = [
  { label: 'Attack', keys: ['Possession', 'SHOTS', 'ON GOAL', 'Corner Kicks'] },
  { label: 'Defense', keys: ['Saves', 'Fouls', 'Yellow Cards', 'Offsides'] },
  { label: 'Passing', keys: ['Passes', 'Pass Completion %', 'Tackles', 'Interceptions'] },
]

function fmt(ml: number) { return ml > 0 ? `+${ml}` : `${ml}` }
function fmtAttend(n: number) { return n.toLocaleString() }

// ── Momentum graph ───────────────────────────────────────────────────
const ATTACK_TYPES = new Set(['shot-off-target', 'shot-on-target', 'shot-blocked', 'shot-hit-woodwork', 'goal', 'corner-awarded'])

function MomentumGraph({ commentary, homeTeamName, awayTeamName, match }: {
  commentary: CommentaryEntry[]; homeTeamName: string; awayTeamName: string; match: Match
}) {
  const BUCKET = 300  // 5 minutes in seconds
  const NUM = 19
  const buckets = Array.from({ length: NUM }, () => ({ home: 0, away: 0 }))
  // Track goal moments for markers
  const goalMarkers: { bucket: number; isHome: boolean }[] = []

  for (const c of commentary) {
    const isAttack = ATTACK_TYPES.has(c.type)
    const isGoal = c.type === 'goal'
    const bucketIdx = Math.min(Math.floor(c.timeValue / BUCKET), NUM - 1)
    if (isAttack) {
      if (c.teamName === homeTeamName) buckets[bucketIdx].home++
      else if (c.teamName) buckets[bucketIdx].away++
    }
    if (isGoal) {
      goalMarkers.push({ bucket: bucketIdx, isHome: c.teamName === homeTeamName })
    }
  }

  const maxCount = Math.max(1, ...buckets.map(b => b.home + b.away))
  const W = 280; const H = 60; const CY = H / 2
  const BAR_MAX = CY - 8; const barW = W / NUM; const gap = 1.5

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ fontSize: '13px' }}>{match.homeTeam.flagEmoji}</span>
          <span style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(74,222,128,0.8)' }}>{match.homeTeam.abbreviation}</span>
        </div>
        <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', alignSelf: 'center' }}>Momentum</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(96,165,250,0.8)' }}>{match.awayTeam.abbreviation}</span>
          <span style={{ fontSize: '13px' }}>{match.awayTeam.flagEmoji}</span>
        </div>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
        {/* Center line */}
        <line x1="0" y1={CY} x2={W} y2={CY} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        {/* HT divider */}
        <line x1={W / 2} y1={4} x2={W / 2} y2={H - 4} stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeDasharray="2,2" />
        <text x={W / 2} y={H - 1} textAnchor="middle" fontSize="6" fill="rgba(255,255,255,0.2)">HT</text>
        {/* Bars */}
        {buckets.map((b, i) => {
          const x = i * barW
          const homeH = (b.home / maxCount) * BAR_MAX
          const awayH = (b.away / maxCount) * BAR_MAX
          return (
            <g key={i}>
              {homeH > 0.5 && <rect x={x + gap / 2} y={CY - homeH} width={barW - gap} height={homeH} fill="rgba(74,222,128,0.5)" rx="1" />}
              {awayH > 0.5 && <rect x={x + gap / 2} y={CY} width={barW - gap} height={awayH} fill="rgba(96,165,250,0.45)" rx="1" />}
            </g>
          )
        })}
        {/* Goal markers */}
        {goalMarkers.map((g, i) => {
          const cx = (g.bucket + 0.5) * barW
          return <circle key={i} cx={cx} cy={CY} r="3" fill={g.isHome ? 'rgba(74,222,128,0.9)' : 'rgba(96,165,250,0.9)'} />
        })}
      </svg>
    </div>
  )
}

// ── SVG icons for feed ───────────────────────────────────────────────
function FeedIcon({ type, dim }: { type: string; dim: boolean }) {
  const sz = dim ? 10 : 13
  const sw = 1.6
  const base = { width: sz, height: sz, viewBox: '0 0 14 14', fill: 'none', strokeWidth: sw, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, style: { flexShrink: 0, display: 'block' } }

  if (type === 'goal' || type === 'penalty-scored') return (
    <svg {...base} stroke="rgba(74,222,128,0.9)">
      <circle cx="7" cy="7" r="5.5"/>
      <polygon points="7,3.5 9.4,5.3 8.5,7.9 5.5,7.9 4.6,5.3" strokeWidth="1.1" stroke="rgba(74,222,128,0.55)" fill="rgba(74,222,128,0.18)"/>
    </svg>
  )
  if (type === 'own-goal') return (
    <svg {...base} stroke="rgba(239,68,68,0.9)">
      <circle cx="7" cy="7" r="5.5"/>
      <polygon points="7,3.5 9.4,5.3 8.5,7.9 5.5,7.9 4.6,5.3" strokeWidth="1.1" stroke="rgba(239,68,68,0.55)" fill="rgba(239,68,68,0.18)"/>
    </svg>
  )
  if (type === 'yellow-card') return (
    <svg {...base} stroke="rgba(251,191,36,0.9)">
      <rect x="3.5" y="1.5" width="7" height="11" rx="1.5" fill="rgba(251,191,36,0.85)" strokeWidth="1"/>
    </svg>
  )
  if (type === 'red-card') return (
    <svg {...base} stroke="rgba(239,68,68,0.9)">
      <rect x="3.5" y="1.5" width="7" height="11" rx="1.5" fill="rgba(239,68,68,0.85)" strokeWidth="1"/>
    </svg>
  )
  if (type === 'substitution') return (
    <svg {...base} stroke="currentColor">
      <path d="M4.5 9 L4.5 4" stroke="rgba(74,222,128,0.8)"/>
      <path d="M2.5 5.8 L4.5 4 L6.5 5.8" stroke="rgba(74,222,128,0.8)"/>
      <path d="M9.5 5 L9.5 10" stroke="rgba(239,68,68,0.7)"/>
      <path d="M7.5 8.2 L9.5 10 L11.5 8.2" stroke="rgba(239,68,68,0.7)"/>
    </svg>
  )
  if (type === 'shot-on-target') return (
    <svg {...base} stroke="rgba(255,255,255,0.65)">
      <circle cx="7" cy="7" r="5"/>
      <circle cx="7" cy="7" r="2"/>
      <line x1="7" y1="1" x2="7" y2="3.5"/>
      <line x1="7" y1="10.5" x2="7" y2="13"/>
      <line x1="1" y1="7" x2="3.5" y2="7"/>
      <line x1="10.5" y1="7" x2="13" y2="7"/>
    </svg>
  )
  if (type === 'shot-hit-woodwork') return (
    <svg {...base} stroke="rgba(251,146,60,0.85)" strokeWidth="2.2">
      <path d="M2.5 12 L2.5 2.5 L11.5 2.5"/>
      <circle cx="2.5" cy="2.5" r="1.5" fill="rgba(251,146,60,0.8)" stroke="none"/>
    </svg>
  )
  if (type === 'corner-awarded') return (
    <svg {...base} stroke="rgba(255,255,255,0.4)">
      <line x1="3" y1="13" x2="3" y2="2"/>
      <path d="M3 2 L11 5.5 L3 9"/>
    </svg>
  )
  if (type === 'shot-off-target' || type === 'shot-blocked') return (
    <svg {...base} stroke="rgba(255,255,255,0.22)" strokeWidth="1.4">
      <line x1="4" y1="4" x2="10" y2="10"/>
      <line x1="10" y1="4" x2="4" y2="10"/>
    </svg>
  )
  if (type === 'foul') return (
    <svg {...base} stroke="rgba(255,255,255,0.28)" strokeWidth="1.4">
      <circle cx="8.5" cy="5.5" r="3"/>
      <line x1="5.5" y1="6" x2="2" y2="9"/>
      <circle cx="1.5" cy="9.5" r="1.2" fill="rgba(255,255,255,0.2)" stroke="none"/>
    </svg>
  )
  if (type === 'offside') return (
    <svg {...base} stroke="rgba(255,255,255,0.35)" strokeWidth="1.4">
      <line x1="5" y1="12" x2="9" y2="2"/>
      <line x1="3" y1="12" x2="11" y2="12" strokeWidth="1" stroke="rgba(255,255,255,0.15)"/>
    </svg>
  )
  if (type.startsWith('var')) return (
    <svg {...base} stroke="rgba(167,139,250,0.8)">
      <rect x="1.5" y="3" width="11" height="7" rx="1.5"/>
      <line x1="5" y1="13" x2="9" y2="13"/>
      <line x1="7" y1="10" x2="7" y2="13"/>
      <polygon points="5.5,5.2 5.5,8.2 9,6.7" fill="rgba(167,139,250,0.5)" stroke="none"/>
    </svg>
  )
  return null
}

// ── Commentary feed entry ────────────────────────────────────────────
function feedStyle(type: string): { bg: string; border: string; textColor: string; dim: boolean } {
  if (type === 'goal' || type === 'penalty-scored') return { bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)', textColor: 'rgba(255,255,255,0.92)', dim: false }
  if (type === 'own-goal') return { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', textColor: 'rgba(255,255,255,0.92)', dim: false }
  if (type === 'yellow-card') return { bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.3)', textColor: 'rgba(255,255,255,0.85)', dim: false }
  if (type === 'red-card') return { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.35)', textColor: 'rgba(255,255,255,0.85)', dim: false }
  if (type === 'substitution') return { bg: 'rgba(96,165,250,0.07)', border: 'rgba(96,165,250,0.2)', textColor: 'rgba(255,255,255,0.8)', dim: false }
  if (type === 'shot-hit-woodwork') return { bg: 'rgba(251,146,60,0.08)', border: 'rgba(251,146,60,0.25)', textColor: 'rgba(255,255,255,0.8)', dim: false }
  if (type === 'shot-on-target') return { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.1)', textColor: 'rgba(255,255,255,0.7)', dim: false }
  if (type === 'var---referee-decision-cancelled' || type.startsWith('var-')) return { bg: 'rgba(167,139,250,0.07)', border: 'rgba(167,139,250,0.2)', textColor: 'rgba(255,255,255,0.7)', dim: false }
  return { bg: 'transparent', border: 'transparent', textColor: 'rgba(255,255,255,0.38)', dim: true }
}


function isAnnouncement(entry: CommentaryEntry): boolean {
  return !entry.type && !entry.teamName
}

// ── Lineup column ────────────────────────────────────────────────────
function LineupColumn({ players, side, teamAbbr, flagEmoji }: {
  players: MatchPlayer[]; side: 'home' | 'away'; teamAbbr: string; flagEmoji: string
}) {
  const starters = players.filter((p) => p.starter)
  const bench = players.filter((p) => !p.starter)

  const Row = ({ p }: { p: MatchPlayer }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexDirection: side === 'away' ? 'row-reverse' : 'row', padding: '3px 0' }}>
      <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(255,255,255,0.07)', fontSize: '8px', fontWeight: 700, color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {p.jersey}
      </span>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: '11px', fontWeight: p.starter ? 600 : 400, color: p.subbedIn ? 'rgba(74,222,128,0.9)' : p.subbedOut ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.82)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: side === 'away' ? 'right' : 'left' }}>
          {p.shortName || p.name}
          {p.subbedIn && <span style={{ fontSize: '9px', marginLeft: '3px', color: 'rgba(74,222,128,0.7)' }}>↑</span>}
          {p.subbedOut && <span style={{ fontSize: '9px', marginLeft: '3px' }}>↓</span>}
        </p>
        <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.42)', margin: 0, textAlign: side === 'away' ? 'right' : 'left' }}>{p.position}</p>
      </div>
    </div>
  )

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px', flexDirection: side === 'away' ? 'row-reverse' : 'row' }}>
        <span style={{ fontSize: '15px' }}>{flagEmoji}</span>
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>{teamAbbr}</span>
      </div>
      {starters.map((p, i) => <Row key={i} p={p} />)}
      {bench.length > 0 && (
        <>
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '5px 0' }} />
          <p style={{ fontSize: '8px', color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px', textAlign: side === 'away' ? 'right' : 'left' }}>Bench</p>
          {bench.map((p, i) => <Row key={i} p={p} />)}
        </>
      )}
    </div>
  )
}

// ── Stat bar ─────────────────────────────────────────────────────────
function StatBar({ label, home, away }: MatchStat) {
  const toNum = (v: string) => parseFloat(v.replace('%', '')) || 0
  const h = toNum(home); const a = toNum(away)
  const total = h + a || 1
  const homePct = Math.round((h / total) * 100)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', alignItems: 'baseline' }}>
        <span style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600, fontVariantNumeric: 'tabular-nums', minWidth: '32px' }}>{home}</span>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', fontWeight: 500, textAlign: 'center', flex: 1 }}>{label}</span>
        <span style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600, fontVariantNumeric: 'tabular-nums', minWidth: '32px', textAlign: 'right' }}>{away}</span>
      </div>
      <div style={{ height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden', display: 'flex' }}>
        <div style={{ width: `${homePct}%`, background: 'linear-gradient(90deg, rgba(74,222,128,0.5), rgba(74,222,128,0.7))', transition: 'width 0.4s' }} />
        <div style={{ flex: 1, background: 'linear-gradient(90deg, rgba(96,165,250,0.6), rgba(96,165,250,0.45))' }} />
      </div>
    </div>
  )
}

export default function MatchDetail({ match, onBack }: { match: Match; onBack: () => void }) {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [tab, setTab] = useState<Tab>('feed')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const data = await window.api.getMatchSummary(match.id)
        if (!cancelled) { setSummary(data as Summary); setLoading(false) }
      } catch {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    const interval = match.status === 'in' ? setInterval(load, 30_000) : null
    return () => { cancelled = true; if (interval) clearInterval(interval) }
  }, [match.id, match.status])

  const isLive = match.status === 'in'
  const isPost = match.status === 'post'
  const homeWins = isPost && match.homeScore > match.awayScore
  const awayWins = isPost && match.awayScore > match.homeScore
  const homePhoto = match.homeTeam.starPlayerPhoto || match.homeTeam.teamLogo
  const awayPhoto = match.awayTeam.starPlayerPhoto || match.awayTeam.teamLogo

  const TABS: { id: Tab; label: string }[] = [
    { id: 'feed', label: 'Feed' },
    { id: 'lineups', label: 'Lineups' },
    { id: 'stats', label: 'Stats' },
  ]

  // Group stats by category
  const statsByLabel = Object.fromEntries((summary?.stats ?? []).map(s => [s.label, s]))
  const groupedStats = STAT_GROUPS.map(g => ({
    label: g.label,
    stats: g.keys.map(k => statsByLabel[k]).filter(Boolean),
  })).filter(g => g.stats.length > 0)
  const ungrouped = (summary?.stats ?? []).filter(s => !STAT_GROUPS.flatMap(g => g.keys).includes(s.label))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>

      {/* ── Back + Score header ── */}
      <div style={{ flexShrink: 0, padding: '10px 20px 0' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.55)', cursor: 'pointer', fontSize: '12px', padding: '0 0 8px', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'inherit' }}>
          ← Back
        </button>

        {/* Score card with player photo bg */}
        <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', marginBottom: '12px' }}>
          {/* Player photos */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', pointerEvents: 'none' }}>
            {homePhoto && <div style={{ flex: 1, backgroundImage: `url(${homePhoto})`, backgroundSize: 'cover', backgroundPosition: 'center top', opacity: 0.65 }} />}
            {awayPhoto && <div style={{ flex: 1, backgroundImage: `url(${awayPhoto})`, backgroundSize: 'cover', backgroundPosition: 'center top', opacity: 0.65 }} />}
          </div>
          {/* Dark gradient overlay */}
          <div style={{ position: 'absolute', inset: 0, background: isLive ? 'linear-gradient(135deg, rgba(3,18,8,0.86) 0%, rgba(2,12,6,0.90) 100%)' : 'linear-gradient(135deg, rgba(8,10,16,0.86) 0%, rgba(5,7,12,0.90) 100%)' }} />

          {/* Content */}
          <div style={{ position: 'relative', zIndex: 1, padding: '14px 16px 12px' }}>
            {/* Venue */}
            {(summary?.venueName || match.city) && (
              <p style={{ textAlign: 'center', fontSize: '9px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>
                {match.city && <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{match.city}</span>}
                {match.city && summary?.venueName && ' · '}
                {summary?.venueName}
              </p>
            )}

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: '12px' }}>
              {/* Home */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px', opacity: awayWins ? 0.55 : 1 }}>
                <span style={{ fontSize: '32px' }}>{match.homeTeam.flagEmoji}</span>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#fff' }}>{match.homeTeam.abbreviation}</span>
                {summary?.events.filter(e => e.teamId === summary.homeTeamId && (e.type === 'goal' || e.type === 'ownGoal' || e.type === 'penalty')).map((g, i) => (
                  <p key={i} style={{ fontSize: '9px', color: 'rgba(255,255,255,0.75)', margin: 0, textAlign: 'right' }}>
                    {g.clock}' {g.playerName}{g.type === 'penalty' ? ' (P)' : g.type === 'ownGoal' ? ' (OG)' : ''}
                  </p>
                ))}
              </div>

              {/* Score center */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', paddingTop: '4px' }}>
                {(isLive || isPost) ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '48px', fontWeight: 900, lineHeight: 1, fontVariantNumeric: 'tabular-nums', color: homeWins ? 'rgba(74,222,128,0.95)' : awayWins ? 'rgba(255,255,255,0.35)' : '#fff' }}>{match.homeScore}</span>
                    <span style={{ fontSize: '22px', color: 'rgba(255,255,255,0.45)', fontWeight: 300 }}>–</span>
                    <span style={{ fontSize: '48px', fontWeight: 900, lineHeight: 1, fontVariantNumeric: 'tabular-nums', color: awayWins ? 'rgba(74,222,128,0.95)' : homeWins ? 'rgba(255,255,255,0.35)' : '#fff' }}>{match.awayScore}</span>
                  </div>
                ) : (
                  <span style={{ fontSize: '22px', color: 'rgba(255,255,255,0.5)', fontWeight: 300, padding: '12px 0' }}>vs</span>
                )}
                {isLive && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(239,68,68,0.14)', border: '1px solid rgba(239,68,68,0.32)', padding: '2px 8px', borderRadius: '20px' }}>
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#ef4444', display: 'block' }} />
                    <span style={{ fontSize: '10px', color: '#f87171', fontWeight: 600 }}>{match.clock || 'LIVE'}</span>
                  </div>
                )}
                {isPost && <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.65)', fontWeight: 500, letterSpacing: '0.06em' }}>FULL TIME</span>}
              </div>

              {/* Away */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '3px', opacity: homeWins ? 0.55 : 1 }}>
                <span style={{ fontSize: '32px' }}>{match.awayTeam.flagEmoji}</span>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#fff' }}>{match.awayTeam.abbreviation}</span>
                {summary?.events.filter(e => e.teamId === summary.awayTeamId && (e.type === 'goal' || e.type === 'ownGoal' || e.type === 'penalty')).map((g, i) => (
                  <p key={i} style={{ fontSize: '9px', color: 'rgba(255,255,255,0.75)', margin: 0 }}>
                    {g.clock}' {g.playerName}{g.type === 'penalty' ? ' (P)' : g.type === 'ownGoal' ? ' (OG)' : ''}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '3px', marginBottom: '10px' }}>
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: '5px 0', borderRadius: '7px', border: 'none', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', background: tab === t.id ? 'rgba(255,255,255,0.1)' : 'transparent', color: tab === t.id ? '#fff' : 'rgba(255,255,255,0.35)' }}>
              {t.label}
            </button>
          ))}
        </div>
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)' }} />
      </div>

      {/* ── Content ── */}
      <div style={{ overflowY: 'auto', overflowX: 'hidden', padding: '0 20px 16px' }}>

        {loading && (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>Loading…</div>
        )}

        {/* ── FEED ── */}
        {!loading && tab === 'feed' && (
          <div style={{ paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {(!summary || summary.commentary.length === 0) && (
              <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.45)', fontSize: '12px', padding: '24px 0' }}>
                {match.status === 'pre' ? 'Commentary will appear once the match starts' : 'No commentary available'}
              </p>
            )}
            {(summary?.commentary ?? []).map((c, i) => {
              if (isAnnouncement(c)) {
                return (
                  <div key={i} style={{ textAlign: 'center', padding: '6px 0 4px' }}>
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.38)', fontStyle: 'italic' }}>{c.text}</span>
                  </div>
                )
              }
              const s = feedStyle(c.type)
              const isDim = s.dim
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '8px',
                  padding: isDim ? '3px 6px' : '7px 10px',
                  borderRadius: '9px',
                  background: s.bg,
                  border: `1px solid ${s.border}`,
                }}>
                  {/* Time */}
                  <span style={{
                    fontSize: '10px', fontWeight: 600, color: isDim ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.45)',
                    flexShrink: 0, minWidth: '24px', fontVariantNumeric: 'tabular-nums', paddingTop: '1px',
                  }}>{c.time}</span>
                  {/* Icon */}
                  <div style={{ paddingTop: '1px', flexShrink: 0 }}><FeedIcon type={c.type} dim={isDim} /></div>
                  {/* Text */}
                  <span style={{ fontSize: isDim ? '10px' : '11px', color: s.textColor, lineHeight: 1.45, flex: 1 }}>{c.text}</span>
                </div>
              )
            })}
          </div>
        )}

        {/* ── LINEUPS ── */}
        {!loading && tab === 'lineups' && (
          <div style={{ paddingTop: '14px' }}>
            {summary && (summary.homeLineup.length > 0 || summary.awayLineup.length > 0) ? (
              <div style={{ display: 'flex', gap: '14px' }}>
                <LineupColumn players={summary.homeLineup} side="home" teamAbbr={match.homeTeam.abbreviation} flagEmoji={match.homeTeam.flagEmoji} />
                <div style={{ width: '1px', background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />
                <LineupColumn players={summary.awayLineup} side="away" teamAbbr={match.awayTeam.abbreviation} flagEmoji={match.awayTeam.flagEmoji} />
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.45)', fontSize: '12px', padding: '24px 0' }}>
                {match.status === 'pre' ? 'Lineups not announced yet' : 'Lineup data unavailable'}
              </p>
            )}
          </div>
        )}

        {/* ── STATS ── */}
        {!loading && tab === 'stats' && (
          <div style={{ paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Momentum graph */}
            {summary && summary.commentary.length > 0 && (
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '12px 14px' }}>
                <MomentumGraph
                  commentary={summary.commentary}
                  homeTeamName={match.homeTeam.name}
                  awayTeamName={match.awayTeam.name}
                  match={match}
                />
              </div>
            )}

            {/* Odds */}
            {summary?.odds && (
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '12px 14px' }}>
                <p style={{ fontSize: '9px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>DraftKings Odds</p>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                  {[
                    { label: match.homeTeam.abbreviation, ml: summary.odds.homeMoneyLine, flag: match.homeTeam.flagEmoji, fav: summary.odds.homeIsFavorite },
                    { label: 'Draw', ml: summary.odds.drawMoneyLine, flag: '🤝', fav: false },
                    { label: match.awayTeam.abbreviation, ml: summary.odds.awayMoneyLine, flag: match.awayTeam.flagEmoji, fav: !summary.odds.homeIsFavorite },
                  ].map((item) => (
                    <div key={item.label} style={{ flex: 1, background: item.fav ? 'rgba(74,222,128,0.08)' : 'rgba(255,255,255,0.04)', border: item.fav ? '1px solid rgba(74,222,128,0.2)' : '1px solid rgba(255,255,255,0.07)', borderRadius: '9px', padding: '8px 6px', textAlign: 'center' }}>
                      <div style={{ fontSize: '16px', marginBottom: '3px' }}>{item.flag}</div>
                      <div style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '3px' }}>{item.label}</div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: item.ml < 0 ? 'rgba(74,222,128,0.9)' : 'rgba(255,255,255,0.8)', fontVariantNumeric: 'tabular-nums' }}>{fmt(item.ml)}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'rgba(255,255,255,0.48)' }}>
                  <span>Spread: <span style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>{summary.odds.spreadDetails}</span></span>
                  <span>O/U: <span style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>{summary.odds.overUnder}</span></span>
                </div>
              </div>
            )}

            {/* Attendance */}
            {summary?.attendance && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>👥</span>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)' }}>
                  <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>{fmtAttend(summary.attendance)}</span> in attendance
                </span>
              </div>
            )}

            {/* Stats — grouped */}
            {(groupedStats.length > 0 || ungrouped.length > 0) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Team header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontSize: '15px' }}>{match.homeTeam.flagEmoji}</span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>{match.homeTeam.abbreviation}</span>
                  </div>
                  <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Stats</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>{match.awayTeam.abbreviation}</span>
                    <span style={{ fontSize: '15px' }}>{match.awayTeam.flagEmoji}</span>
                  </div>
                </div>

                {groupedStats.map((g) => (
                  <div key={g.label}>
                    <p style={{ fontSize: '9px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>{g.label}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {g.stats.map((s, i) => <StatBar key={i} {...s} />)}
                    </div>
                  </div>
                ))}
                {ungrouped.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {ungrouped.map((s, i) => <StatBar key={i} {...s} />)}
                  </div>
                )}
              </div>
            )}

            {!summary || (summary.stats.length === 0 && !summary.odds) && (
              <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.45)', fontSize: '12px', padding: '24px 0' }}>
                {match.status === 'pre' ? 'Stats available once the match starts' : 'Stats unavailable'}
              </p>
            )}

          </div>
        )}
      </div>
    </div>
  )
}
