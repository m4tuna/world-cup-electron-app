import { useState, useEffect } from 'react'
import type { BracketRound, BracketMatchup } from '../types'

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function isSlot(abbr: string) {
  // Slot abbreviations are like "2A", "1C", "3RD", "TBD" — not real team codes
  return !abbr || abbr === 'TBD' || /^\d/.test(abbr) || abbr === '3RD'
}

function BracketMatch({ m }: { m: BracketMatchup }) {
  const isPost = m.status === 'post'
  const isLive = m.status === 'in'
  const homeTBD = isSlot(m.home.abbreviation)
  const awayTBD = isSlot(m.away.abbreviation)

  return (
    <div style={{
      background: isLive ? 'rgba(34,197,94,0.07)' : 'rgba(255,255,255,0.03)',
      border: isLive
        ? '1px solid rgba(34,197,94,0.2)'
        : isPost ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.06)',
      borderRadius: '10px',
      overflow: 'hidden',
    }}>
      {/* Date / status bar */}
      {(m.date || isLive) && (
        <div style={{
          padding: '4px 10px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', alignItems: 'center', gap: '5px',
        }}>
          {isLive && (
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#ef4444', display: 'block', flexShrink: 0 }} />
          )}
          <span style={{ fontSize: '9px', color: isLive ? '#f87171' : 'rgba(255,255,255,0.3)', fontWeight: isLive ? 600 : 400 }}>
            {isLive ? 'LIVE' : formatDate(m.date)}
          </span>
        </div>
      )}

      {/* Teams */}
      {[{ team: m.home, slot: homeTBD }, { team: m.away, slot: awayTBD }].map(({ team, slot }) => {
        const isWinner = isPost && team.winner
        const isLoser = isPost && !team.winner
        return (
          <div
            key={team.id || team.abbreviation}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              padding: '5px 10px',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            <span style={{ fontSize: '14px', opacity: slot ? 0.35 : 1 }}>{team.flagEmoji}</span>
            <span style={{
              flex: 1,
              fontSize: slot ? '10px' : '11px',
              fontWeight: isWinner ? 700 : 500,
              color: slot
                ? 'rgba(255,255,255,0.35)'
                : isWinner ? '#fff' : isLoser ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.85)',
              fontStyle: slot ? 'italic' : 'normal',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {slot ? team.name : team.abbreviation}
            </span>
            {isPost && team.score !== undefined && (
              <span style={{
                fontSize: '13px',
                fontWeight: 800,
                color: isWinner ? 'rgba(74,222,128,0.95)' : 'rgba(255,255,255,0.35)',
                fontVariantNumeric: 'tabular-nums',
                minWidth: '14px',
                textAlign: 'right',
              }}>
                {team.score}
              </span>
            )}
            {isLive && team.score !== undefined && (
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
                {team.score}
              </span>
            )}
            {!isPost && !isLive && (
              <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.15)' }}>–</span>
            )}
          </div>
        )
      })}
      {/* Remove last border */}
      <style>{`.bracket-match-last { border-bottom: none !important }`}</style>
    </div>
  )
}

export default function Bracket() {
  const [rounds, setRounds] = useState<BracketRound[]>([])
  const [loading, setLoading] = useState(true)
  const [activeRound, setActiveRound] = useState(0)

  useEffect(() => {
    window.api.getBracket().then((data) => {
      setRounds(data as BracketRound[])
      setLoading(false)
      // Default to first round with any live/post match
      const liveIdx = (data as BracketRound[]).findIndex(r =>
        r.matchups.some(m => m.status === 'in' || m.status === 'post')
      )
      if (liveIdx >= 0) setActiveRound(liveIdx)
    }).catch(() => {
      setLoading(false)
    })
  }, [])

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>
      Loading bracket…
    </div>
  )

  if (rounds.length === 0) return (
    <div style={{ textAlign: 'center', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
      <span style={{ fontSize: '28px' }}>🏆</span>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', margin: 0 }}>Knockout bracket coming soon</p>
      <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: '11px', margin: 0 }}>Group stage is still underway</p>
    </div>
  )

  const currentRound = rounds[activeRound]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Round selector */}
      {rounds.length > 1 && (
        <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
          {rounds.map((r, i) => (
            <button
              key={r.name}
              onClick={() => setActiveRound(i)}
              style={{
                padding: '4px 9px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '10px',
                fontWeight: activeRound === i ? 700 : 400,
                cursor: 'pointer',
                fontFamily: 'inherit',
                background: activeRound === i ? 'rgba(255,255,255,0.12)' : 'transparent',
                color: activeRound === i ? '#fff' : 'rgba(255,255,255,0.4)',
                whiteSpace: 'nowrap',
              }}
            >
              {r.name}
            </button>
          ))}
        </div>
      )}

      {/* Matchups */}
      {currentRound && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {currentRound.matchups.map((m) => (
            <BracketMatch key={m.id || `${m.home.abbreviation}-${m.away.abbreviation}`} m={m} />
          ))}
        </div>
      )}
    </div>
  )
}
