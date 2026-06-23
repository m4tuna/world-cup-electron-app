import { useState, useEffect } from 'react'
import type { BracketRound, BracketMatchup, BracketTeam } from '../types'

function isSlot(abbr: string) {
  return !abbr || abbr === 'TBD' || /^\d/.test(abbr) || abbr === '3RD'
}

function formatMatchDateTime(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) +
    '  ·  ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

// ── Team row inside a match card ─────────────────────────────────────
function TeamRow({ team, isWinner, isLoser, showScore, isFinal }: {
  team: BracketTeam
  isWinner: boolean
  isLoser: boolean
  showScore: boolean
  isFinal: boolean
}) {
  const slot = isSlot(team.abbreviation)
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: isFinal ? '11px 16px' : '8px 14px',
      background: isWinner ? 'rgba(74,222,128,0.07)' : 'transparent',
      transition: 'background 0.2s',
    }}>
      <span style={{ fontSize: isFinal ? '22px' : '16px', opacity: slot ? 0.3 : 1, flexShrink: 0 }}>
        {team.flagEmoji}
      </span>
      <span style={{
        flex: 1,
        fontSize: slot ? (isFinal ? '11px' : '10px') : (isFinal ? '14px' : '12px'),
        fontWeight: isWinner ? 800 : slot ? 400 : 600,
        color: slot
          ? 'rgba(255,255,255,0.3)'
          : isWinner ? '#fff' : isLoser ? 'rgba(255,255,255,0.38)' : 'rgba(255,255,255,0.88)',
        fontStyle: slot ? 'italic' : 'normal',
        letterSpacing: slot ? '0' : '-0.01em',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {slot ? team.name : team.abbreviation}
      </span>
      {showScore && team.score !== undefined ? (
        <span style={{
          fontSize: isFinal ? '28px' : '18px',
          fontWeight: 900,
          fontVariantNumeric: 'tabular-nums',
          color: isWinner ? 'rgba(74,222,128,0.95)' : isLoser ? 'rgba(255,255,255,0.28)' : '#fff',
          minWidth: isFinal ? '22px' : '16px',
          textAlign: 'right',
          lineHeight: 1,
        }}>
          {team.score}
        </span>
      ) : (
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.12)', fontWeight: 300 }}>–</span>
      )}
    </div>
  )
}

// ── Single match card ────────────────────────────────────────────────
function MatchCard({ m, matchNum, isFinalRound }: { m: BracketMatchup; matchNum: number; isFinalRound: boolean }) {
  const isPost = m.status === 'post'
  const isLive = m.status === 'in'
  const homeWins = isPost && (m.home.winner ?? false)
  const awayWins = isPost && (m.away.winner ?? false)
  const showScore = isPost || isLive

  const accentColor = isLive ? 'rgba(34,197,94,0.28)' : isFinalRound ? 'rgba(251,191,36,0.22)' : 'rgba(255,255,255,0.08)'
  const bgColor = isLive ? 'rgba(34,197,94,0.05)' : isFinalRound ? 'rgba(251,191,36,0.03)' : 'rgba(255,255,255,0.025)'

  return (
    <div style={{
      borderRadius: '14px',
      overflow: 'hidden',
      border: `1px solid ${accentColor}`,
      background: bgColor,
      boxShadow: isLive
        ? '0 0 20px rgba(34,197,94,0.1)'
        : isFinalRound ? '0 0 16px rgba(251,191,36,0.06)' : 'none',
    }}>
      {/* Header strip */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isFinalRound ? '8px 16px' : '5px 14px',
        background: isFinalRound ? 'rgba(251,191,36,0.07)' : 'rgba(255,255,255,0.03)',
        borderBottom: `1px solid ${accentColor}`,
        gap: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          {isLive && (
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'block', flexShrink: 0, boxShadow: '0 0 6px rgba(34,197,94,0.8)' }} />
          )}
          {isFinalRound && !isLive && (
            <span style={{ fontSize: '11px', lineHeight: 1 }}>🏆</span>
          )}
          <span style={{
            fontSize: '9px',
            fontWeight: 700,
            color: isLive ? 'rgba(34,197,94,0.9)' : isFinalRound ? 'rgba(251,191,36,0.8)' : 'rgba(255,255,255,0.35)',
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
          }}>
            {isLive ? 'Live' : isFinalRound ? 'World Cup Final' : `Match ${matchNum}`}
          </span>
        </div>
        <span style={{
          fontSize: '9px',
          color: 'rgba(255,255,255,0.3)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {m.venue ? `${formatMatchDateTime(m.date)}  ·  ${m.venue}` : formatMatchDateTime(m.date)}
        </span>
      </div>

      {/* Teams */}
      <div>
        <div>
          <TeamRow team={m.home} isWinner={homeWins} isLoser={awayWins && !homeWins} showScore={showScore} isFinal={isFinalRound} />
        </div>
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '0 14px' }} />
        <div>
          <TeamRow team={m.away} isWinner={awayWins} isLoser={homeWins && !awayWins} showScore={showScore} isFinal={isFinalRound} />
        </div>
      </div>

      {/* Winner advances label */}
      {isPost && (homeWins || awayWins) && !isFinalRound && (
        <div style={{
          padding: '4px 14px',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          background: 'rgba(74,222,128,0.03)',
        }}>
          <span style={{ fontSize: '9px', color: 'rgba(74,222,128,0.55)', fontWeight: 600 }}>
            {homeWins ? m.home.name : m.away.name} advances →
          </span>
        </div>
      )}
      {isPost && (homeWins || awayWins) && isFinalRound && (
        <div style={{
          padding: '8px 16px',
          borderTop: `1px solid rgba(251,191,36,0.15)`,
          background: 'rgba(251,191,36,0.04)',
          textAlign: 'center',
        }}>
          <span style={{ fontSize: '11px', color: 'rgba(251,191,36,0.85)', fontWeight: 700, letterSpacing: '0.04em' }}>
            🏆 {homeWins ? m.home.name : m.away.name} — World Cup Champions
          </span>
        </div>
      )}
    </div>
  )
}

// ── Round selector strip ─────────────────────────────────────────────
const ROUND_EMOJI: Record<string, string> = {
  'Round of 32': '32',
  'Round of 16': '16',
  'Quarterfinals': 'QF',
  'Semifinals': 'SF',
  '3rd Place': '3rd',
  'Final': '🏆',
}

function RoundStrip({ rounds, activeRound, onSelect }: {
  rounds: BracketRound[]
  activeRound: number
  onSelect: (i: number) => void
}) {
  const liveRounds = new Set(
    rounds.flatMap((r, i) => r.matchups.some((m) => m.status === 'in') ? [i] : [])
  )

  return (
    <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '2px' }}>
      {rounds.map((r, i) => {
        const isActive = activeRound === i
        const hasLive = liveRounds.has(i)
        const hasResults = r.matchups.some((m) => m.status === 'post')
        return (
          <button
            key={r.name}
            onClick={() => onSelect(i)}
            style={{
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px',
              padding: '7px 12px 6px',
              borderRadius: '10px',
              border: isActive
                ? '1px solid rgba(255,255,255,0.18)'
                : '1px solid rgba(255,255,255,0.07)',
              background: isActive ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)',
              cursor: 'pointer',
              fontFamily: 'inherit',
              position: 'relative',
            }}
          >
            {hasLive && (
              <span style={{
                position: 'absolute', top: '4px', right: '4px',
                width: '5px', height: '5px', borderRadius: '50%',
                background: '#22c55e', boxShadow: '0 0 4px rgba(34,197,94,0.8)',
              }} />
            )}
            <span style={{
              fontSize: r.name === 'Final' ? '13px' : '11px',
              fontWeight: isActive ? 800 : 500,
              color: isActive ? '#fff' : 'rgba(255,255,255,0.45)',
            }}>
              {ROUND_EMOJI[r.name] ?? r.name}
            </span>
            <span style={{
              fontSize: '8px',
              color: isActive
                ? 'rgba(255,255,255,0.5)'
                : hasResults ? 'rgba(74,222,128,0.6)' : 'rgba(255,255,255,0.22)',
              fontWeight: 600,
            }}>
              {hasResults
                ? `${r.matchups.filter((m) => m.status === 'post').length}/${r.matchups.length}`
                : `${r.matchups.length} matches`}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────
export default function Bracket() {
  const [rounds, setRounds] = useState<BracketRound[]>([])
  const [loading, setLoading] = useState(true)
  const [activeRound, setActiveRound] = useState(0)

  useEffect(() => {
    window.api.getBracket().then((data) => {
      const r = data as BracketRound[]
      setRounds(r)
      setLoading(false)
      // Default to first round with any live match, otherwise first with any result, otherwise 0
      const liveIdx = r.findIndex((round) => round.matchups.some((m) => m.status === 'in'))
      const resultIdx = r.findIndex((round) => round.matchups.some((m) => m.status === 'post'))
      setActiveRound(liveIdx >= 0 ? liveIdx : resultIdx >= 0 ? resultIdx : 0)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>
      Loading bracket…
    </div>
  )

  if (rounds.length === 0) return (
    <div style={{ textAlign: 'center', padding: '48px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      <span style={{ fontSize: '36px' }}>🏆</span>
      <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '13px', fontWeight: 600, margin: 0 }}>Knockout bracket coming soon</p>
      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: 0 }}>Group stage wraps up June 27</p>
    </div>
  )

  const currentRound = rounds[activeRound]
  const isFinalRound = currentRound?.name === 'Final'

  // For R32 and R16, group matchups into pairs (bracket pairs) for visual grouping
  const shouldPair = currentRound && currentRound.matchups.length >= 8
  const pairedMatchups: BracketMatchup[][] = []
  if (shouldPair) {
    for (let i = 0; i < currentRound.matchups.length; i += 2) {
      pairedMatchups.push(currentRound.matchups.slice(i, i + 2))
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <RoundStrip rounds={rounds} activeRound={activeRound} onSelect={setActiveRound} />

      {currentRound && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: shouldPair ? '14px' : '8px' }}>
          {shouldPair ? (
            // Paired layout: group every 2 matches with a subtle bracket pair indicator
            pairedMatchups.map((pair, pairIdx) => (
              <div key={pairIdx} style={{
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '16px',
                overflow: 'hidden',
                background: 'rgba(255,255,255,0.01)',
              }}>
                <div style={{ padding: '5px 10px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '8px', fontWeight: 700, color: 'rgba(255,255,255,0.18)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Bracket {pairIdx + 1}
                  </span>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }} />
                </div>
                <div style={{ padding: '6px 8px 8px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {pair.map((m, mi) => (
                    <MatchCard
                      key={m.id || `${pairIdx}-${mi}`}
                      m={m}
                      matchNum={pairIdx * 2 + mi + 1}
                      isFinalRound={false}
                    />
                  ))}
                </div>
              </div>
            ))
          ) : (
            // Single match layout for QF, SF, Final, 3rd
            currentRound.matchups.map((m, i) => (
              <MatchCard
                key={m.id || i}
                m={m}
                matchNum={i + 1}
                isFinalRound={isFinalRound}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}
