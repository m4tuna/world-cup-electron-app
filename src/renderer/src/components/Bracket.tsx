import { useState, useEffect, Fragment } from 'react'
import type { BracketRound, BracketMatchup, BracketTeam } from '../types'

const CARD_W = 152
const CONN_W = 28
const LABEL_H = 52   // tall enough to hold trophy SVG in Final column

const ROUND_ABBR: Record<string, string> = {
  'Round of 32': 'R32',
  'Round of 16': 'R16',
  'Quarterfinals': 'QF',
  'Semifinals': 'SF',
  'Final': 'FINAL',
}

const ROUND_PROMINENCE: Record<string, number> = {
  'Round of 32': 0,
  'Round of 16': 1,
  'Quarterfinals': 2,
  'Semifinals': 3,
  'Final': 4,
}

function isSlot(abbr: string) {
  return !abbr || abbr === 'TBD' || /^\d/.test(abbr) || abbr === '3RD'
}

function fmtDate(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return (
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  )
}

// ── World Cup Trophy SVG ──────────────────────────────────────────────
function TrophySVG({ size = 40 }: { size?: number }) {
  const h = Math.round(size * 1.4)
  return (
    <svg width={size} height={h} viewBox="0 0 52 72" fill="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="tg" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#fef9c3" />
          <stop offset="40%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#92400e" />
        </linearGradient>
        <radialGradient id="tgglobe" cx="38%" cy="32%" r="65%">
          <stop offset="0%" stopColor="#fffde7" />
          <stop offset="100%" stopColor="#d97706" />
        </radialGradient>
        <filter id="tglow">
          <feGaussianBlur stdDeviation="1.5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Base tiers */}
      <rect x="5" y="64" width="42" height="6" rx="3" fill="url(#tg)" />
      <rect x="11" y="57" width="30" height="9" rx="2" fill="url(#tg)" opacity="0.85" />

      {/* Stem */}
      <path d="M22 57 L22 49 Q22 45 26 45 Q30 45 30 49 L30 57 Z" fill="url(#tg)" />

      {/* Ring where arms meet stem */}
      <ellipse cx="26" cy="48" rx="13" ry="3" fill="url(#tg)" opacity="0.45" />

      {/* Left arm */}
      <path
        d="M13 47 C 1 35 1 17 13 9"
        stroke="url(#tg)" strokeWidth="5.5" strokeLinecap="round" fill="none"
        filter="url(#tglow)"
      />
      {/* Right arm */}
      <path
        d="M39 47 C 51 35 51 17 39 9"
        stroke="url(#tg)" strokeWidth="5.5" strokeLinecap="round" fill="none"
        filter="url(#tglow)"
      />

      {/* Globe */}
      <circle cx="26" cy="9" r="10" fill="url(#tgglobe)" filter="url(#tglow)" />
      {/* Globe meridian */}
      <ellipse cx="26" cy="9" rx="4.5" ry="10" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="0.8" />
      {/* Globe equator */}
      <line x1="16" y1="9" x2="36" y2="9" stroke="rgba(255,255,255,0.28)" strokeWidth="0.8" />
      {/* Globe parallels */}
      <path d="M17 4.5 Q26 7 35 4.5" stroke="rgba(255,255,255,0.16)" strokeWidth="0.7" fill="none" />
      <path d="M17 13.5 Q26 11 35 13.5" stroke="rgba(255,255,255,0.16)" strokeWidth="0.7" fill="none" />
    </svg>
  )
}

type TeamClickFn = (teamId: string, teamName: string, flagEmoji: string) => void

// ── Compact match card ────────────────────────────────────────────────
function CompactCard({ m, isFinal, onTeamClick, favoriteTeams }: { m: BracketMatchup; isFinal?: boolean; onTeamClick?: TeamClickFn; favoriteTeams?: string[] }) {
  const isPost = m.status === 'post'
  const isLive = m.status === 'in'
  const homeWins = isPost && (m.home.winner ?? false)
  const awayWins = isPost && (m.away.winner ?? false)
  const showScore = isPost || isLive

  const borderColor = isFinal
    ? 'rgba(251,191,36,0.5)'
    : isLive ? 'rgba(34,197,94,0.45)' : 'rgba(255,255,255,0.1)'
  const bgColor = isFinal
    ? 'rgba(251,191,36,0.05)'
    : isLive ? 'rgba(34,197,94,0.05)' : 'rgba(255,255,255,0.03)'
  const shadow = isFinal
    ? '0 0 18px rgba(251,191,36,0.15), 0 2px 8px rgba(0,0,0,0.4)'
    : isLive ? '0 0 12px rgba(34,197,94,0.18), 0 2px 8px rgba(0,0,0,0.4)' : '0 1px 4px rgba(0,0,0,0.3)'

  return (
    <div style={{
      width: '100%',
      border: `1px solid ${borderColor}`,
      borderRadius: '9px',
      overflow: 'hidden',
      background: bgColor,
      boxShadow: shadow,
    }}>
      {([m.home, m.away] as BracketTeam[]).map((team, ti) => {
        const wins = ti === 0 ? homeWins : awayWins
        const loses = ti === 0 ? awayWins : homeWins
        const slot = isSlot(team.abbreviation)
        const canClick = !slot && !!team.id && !!onTeamClick
        const isFav = !!favoriteTeams?.length && !slot && favoriteTeams.includes(team.abbreviation)
        return (
          <div
            key={ti}
            onClick={canClick ? (e) => { e.stopPropagation(); onTeamClick!(team.id!, team.name, team.flagEmoji) } : undefined}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: isFinal ? '9px 11px' : '7px 9px',
              borderBottom: ti === 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              background: isFav
                ? 'rgba(251,191,36,0.1)'
                : wins ? 'rgba(74,222,128,0.08)'
                : loses ? 'rgba(0,0,0,0.15)' : 'transparent',
              cursor: canClick ? 'pointer' : 'default',
            }}
          >
            <span style={{
              fontSize: isFinal ? '17px' : '15px',
              opacity: slot ? 0.2 : loses ? 0.45 : 1,
              flexShrink: 0, lineHeight: 1,
            }}>
              {team.flagEmoji}
            </span>
            <span style={{
              flex: 1,
              fontSize: slot ? '8px' : isFinal ? '12px' : '11px',
              fontWeight: isFav || wins ? 800 : slot ? 400 : 600,
              color: slot
                ? 'rgba(255,255,255,0.2)'
                : isFav ? 'rgba(251,191,36,0.95)'
                : wins ? '#ffffff'
                : loses ? 'rgba(255,255,255,0.22)'
                : 'rgba(255,255,255,0.85)',
              fontStyle: slot ? 'italic' : 'normal',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              letterSpacing: slot ? 0 : '-0.015em',
            }}>
              {slot ? team.name : team.abbreviation}
            </span>
            {showScore && team.score !== undefined && (
              <span style={{
                fontSize: isFinal ? '20px' : '15px',
                fontWeight: 900,
                fontVariantNumeric: 'tabular-nums',
                color: wins
                  ? 'rgba(74,222,128,0.95)'
                  : loses ? 'rgba(255,255,255,0.2)'
                  : 'rgba(255,255,255,0.9)',
                minWidth: '14px', textAlign: 'right', lineHeight: 1,
              }}>
                {team.score}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── SVG staple connector ──────────────────────────────────────────────
function BracketConnector({
  numPairs, pairSlotH, prominence = 0,
}: {
  numPairs: number
  pairSlotH: number
  prominence?: number  // 0–4; higher = closer to Final
}) {
  const totalH = numPairs * 2 * pairSlotH
  const half = pairSlotH / 2
  const cx = CONN_W / 2
  // Lines get progressively brighter as they approach the Final
  const alpha = 0.12 + prominence * 0.06
  const goldMix = prominence >= 3 ? prominence - 2 : 0  // 0, 0, 0, 1, 2
  const color = goldMix > 0
    ? `rgba(${Math.round(255)},${Math.round(191 + goldMix * 8)},${Math.round(36)},${alpha + goldMix * 0.05})`
    : `rgba(255,255,255,${alpha})`
  const sw = 1 + prominence * 0.1

  return (
    <svg
      width={CONN_W}
      height={totalH}
      style={{ display: 'block', flexShrink: 0, overflow: 'visible' }}
    >
      {Array.from({ length: numPairs }, (_, p) => {
        const topY = p * 2 * pairSlotH + half
        const botY = p * 2 * pairSlotH + pairSlotH + half
        const midY = (topY + botY) / 2
        return (
          <g key={p}>
            <line x1={0} y1={topY} x2={cx} y2={topY} stroke={color} strokeWidth={sw} />
            <line x1={cx} y1={topY} x2={cx} y2={botY} stroke={color} strokeWidth={sw} />
            <line x1={0} y1={botY} x2={cx} y2={botY} stroke={color} strokeWidth={sw} />
            <line x1={cx} y1={midY} x2={CONN_W} y2={midY} stroke={color} strokeWidth={sw} />
          </g>
        )
      })}
    </svg>
  )
}

// ── Round label ───────────────────────────────────────────────────────
function RoundLabel({
  round, done, hasLive,
}: {
  round: BracketRound
  done: number
  hasLive: boolean
}) {
  const isFinal = round.name === 'Final'
  const prom = ROUND_PROMINENCE[round.name] ?? 0

  if (isFinal) {
    return (
      <div style={{
        height: LABEL_H,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: '3px', position: 'relative',
      }}>
        {hasLive && (
          <span style={{
            position: 'absolute', top: '6px', right: '6px',
            width: '6px', height: '6px', borderRadius: '50%',
            background: '#22c55e', boxShadow: '0 0 6px rgba(34,197,94,0.9)',
          }} />
        )}
        <TrophySVG size={28} />
        <span style={{
          fontSize: '8px', fontWeight: 900, letterSpacing: '0.12em',
          color: 'rgba(251,191,36,0.85)', textTransform: 'uppercase',
          lineHeight: 1,
        }}>FINAL</span>
        {done > 0 && (
          <span style={{ fontSize: '7px', color: 'rgba(74,222,128,0.65)', fontWeight: 700, letterSpacing: '0.04em' }}>
            {done}/{round.matchups.length}
          </span>
        )}
      </div>
    )
  }

  // brightness scales from 0.28 (R32) to 0.65 (SF)
  const labelOpacity = 0.28 + prom * 0.1

  return (
    <div style={{
      height: LABEL_H,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: '5px', position: 'relative',
    }}>
      {hasLive && (
        <span style={{
          position: 'absolute', top: '8px', right: '6px',
          width: '5px', height: '5px', borderRadius: '50%',
          background: '#22c55e', boxShadow: '0 0 5px rgba(34,197,94,0.85)',
        }} />
      )}
      <span style={{
        fontSize: '9px', fontWeight: 800,
        color: `rgba(255,255,255,${labelOpacity})`,
        textTransform: 'uppercase', letterSpacing: '0.08em',
      }}>
        {ROUND_ABBR[round.name] ?? round.name}
      </span>
      {done > 0 && (
        <span style={{ fontSize: '7px', color: 'rgba(74,222,128,0.6)', fontWeight: 700 }}>
          {done}/{round.matchups.length}
        </span>
      )}
    </div>
  )
}

// ── Full horizontal bracket tree ──────────────────────────────────────
function BracketTree({ rounds, onTeamClick, favoriteTeams }: { rounds: BracketRound[]; onTeamClick?: TeamClickFn; favoriteTeams?: string[] }) {
  if (rounds.length === 0) return null

  const firstCount = rounds[0].matchups.length
  const BASE_SLOT = firstCount >= 16 ? 70 : firstCount >= 8 ? 84 : firstCount >= 4 ? 96 : 108

  return (
    <div style={{ overflowX: 'auto', overflowY: 'visible', paddingBottom: '6px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        {rounds.map((round, ri) => {
          const slotH = BASE_SLOT * Math.pow(2, ri)
          const isLast = ri === rounds.length - 1
          const isFinal = round.name === 'Final'
          const done = round.matchups.filter(m => m.status === 'post').length
          const hasLive = round.matchups.some(m => m.status === 'in')
          const numPairs = Math.max(1, Math.floor(round.matchups.length / 2))
          const prom = ROUND_PROMINENCE[round.name] ?? 0

          return (
            <Fragment key={round.name}>
              {/* Column */}
              <div style={{
                width: CARD_W, flexShrink: 0,
                background: isFinal
                  ? 'radial-gradient(ellipse at 50% 40%, rgba(251,191,36,0.07) 0%, transparent 68%)'
                  : 'transparent',
                borderRadius: isFinal ? '12px' : '0',
              }}>
                <RoundLabel round={round} done={done} hasLive={hasLive} />

                {round.matchups.map((m) => (
                  <div
                    key={m.id}
                    style={{ height: slotH, display: 'flex', alignItems: 'center', padding: '4px 2px' }}
                  >
                    <CompactCard m={m} isFinal={isFinal} onTeamClick={onTeamClick} favoriteTeams={favoriteTeams} />
                  </div>
                ))}
              </div>

              {/* Connector */}
              {!isLast && (
                <div style={{ flexShrink: 0 }}>
                  <div style={{ height: LABEL_H }} />
                  <BracketConnector numPairs={numPairs} pairSlotH={slotH} prominence={prom} />
                </div>
              )}
            </Fragment>
          )
        })}
      </div>
    </div>
  )
}

// ── Standalone card for 3rd place ─────────────────────────────────────
function StandaloneCard({ m, onTeamClick, favoriteTeams }: { m: BracketMatchup; onTeamClick?: TeamClickFn; favoriteTeams?: string[] }) {
  const isPost = m.status === 'post'
  const isLive = m.status === 'in'
  const homeWins = isPost && (m.home.winner ?? false)
  const awayWins = isPost && (m.away.winner ?? false)
  const showScore = isPost || isLive
  const accent = isLive ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)'

  return (
    <div style={{ borderRadius: '11px', overflow: 'hidden', border: `1px solid ${accent}`, background: 'rgba(255,255,255,0.02)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 12px', background: 'rgba(255,255,255,0.03)', borderBottom: `1px solid ${accent}` }}>
        <span style={{ fontSize: '9px', fontWeight: 700, color: isLive ? 'rgba(34,197,94,0.9)' : 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          {isLive ? '● Live' : '3rd Place'}
        </span>
        <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)' }}>{fmtDate(m.date)}</span>
      </div>
      {([m.home, m.away] as BracketTeam[]).map((team, ti) => {
        const wins = ti === 0 ? homeWins : awayWins
        const loses = ti === 0 ? awayWins : homeWins
        const slot = isSlot(team.abbreviation)
        const canClick = !slot && !!team.id && !!onTeamClick
        const isFav = !!favoriteTeams?.length && !slot && favoriteTeams.includes(team.abbreviation)
        return (
          <div key={ti}
            onClick={canClick ? (e) => { e.stopPropagation(); onTeamClick!(team.id, team.name, team.flagEmoji) } : undefined}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px',
              borderBottom: ti === 0 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              background: isFav ? 'rgba(251,191,36,0.1)' : wins ? 'rgba(74,222,128,0.06)' : loses ? 'rgba(0,0,0,0.12)' : 'transparent',
              cursor: canClick ? 'pointer' : 'default',
            }}>
            <span style={{ fontSize: '16px', opacity: slot ? 0.25 : loses ? 0.45 : 1, flexShrink: 0 }}>{team.flagEmoji}</span>
            <span style={{
              flex: 1, fontSize: slot ? '9px' : '12px', fontWeight: isFav || wins ? 700 : slot ? 400 : 600,
              color: slot ? 'rgba(255,255,255,0.22)' : isFav ? 'rgba(251,191,36,0.95)' : wins ? '#fff' : loses ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.88)',
              fontStyle: slot ? 'italic' : 'normal',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {slot ? team.name : team.abbreviation}
            </span>
            {showScore && team.score !== undefined && (
              <span style={{ fontSize: '17px', fontWeight: 900, fontVariantNumeric: 'tabular-nums', color: wins ? 'rgba(74,222,128,0.9)' : loses ? 'rgba(255,255,255,0.22)' : '#fff' }}>
                {team.score}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────
const BRACKET_ORDER = ['Round of 32', 'Round of 16', 'Quarterfinals', 'Semifinals', 'Final']

export default function Bracket({ onTeamClick, favoriteTeams }: { onTeamClick?: TeamClickFn; favoriteTeams?: string[] }) {
  const [rounds, setRounds] = useState<BracketRound[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    window.api.getBracket().then((data) => {
      setRounds(data as BracketRound[])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  function toggleExpand() {
    const next = !expanded
    setExpanded(next)
    window.api.setPanelWidth?.(next ? 940 : 500)
  }

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', padding: '52px 0' }}>
      <TrophySVG size={44} />
      <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>Loading bracket…</span>
    </div>
  )

  if (rounds.length === 0) return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
      padding: '52px 24px',
    }}>
      <div style={{ filter: 'drop-shadow(0 0 24px rgba(251,191,36,0.35))' }}>
        <TrophySVG size={56} />
      </div>
      <p style={{
        color: 'rgba(255,255,255,0.65)', fontSize: '14px', fontWeight: 700,
        margin: 0, letterSpacing: '-0.01em',
      }}>
        Knockout bracket coming soon
      </p>
      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: 0 }}>
        Group stage wraps up June 27
      </p>
    </div>
  )

  const bracketRounds = BRACKET_ORDER
    .map(name => rounds.find(r => r.name === name))
    .filter((r): r is BracketRound => !!r)

  const thirdPlace = rounds.find(r => r.name === '3rd Place')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '2px' }}>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.08))' }} />
        <span style={{ fontSize: '8px', fontWeight: 700, color: 'rgba(255,255,255,0.22)', textTransform: 'uppercase', letterSpacing: '0.12em', whiteSpace: 'nowrap' }}>
          FIFA World Cup 2026 · Knockout Stage
        </span>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to left, transparent, rgba(255,255,255,0.08))' }} />
        <button
          onClick={toggleExpand}
          title={expanded ? 'Collapse bracket' : 'Expand bracket'}
          style={{
            flexShrink: 0,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '6px',
            width: '22px', height: '22px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'rgba(255,255,255,0.45)', fontSize: '11px',
            lineHeight: 1, padding: 0,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.75)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.45)' }}
        >
          {expanded ? '⊠' : '⊞'}
        </button>
      </div>

      <BracketTree rounds={bracketRounds} onTeamClick={onTeamClick} favoriteTeams={favoriteTeams} />

      {thirdPlace && thirdPlace.matchups.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
            <span style={{ fontSize: '8px', fontWeight: 700, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>3rd Place</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
          </div>
          {thirdPlace.matchups.map((m, i) => <StandaloneCard key={m.id || i} m={m} onTeamClick={onTeamClick} favoriteTeams={favoriteTeams} />)}
        </div>
      )}
    </div>
  )
}
