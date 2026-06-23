import { useState, useEffect } from 'react'
import type { BracketRound, BracketMatchup, BracketTeam } from '../types'

const SLOT_H = 76   // px: height of one QF match slot
const CARD_W = 132  // px: width of a match card
const CONN_W = 22   // px: width of SVG connector column

function isSlot(abbr: string) {
  return !abbr || abbr === 'TBD' || /^\d/.test(abbr) || abbr === '3RD'
}

function fmtDate(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

// ── Compact card for the visual bracket tree ─────────────────────────
function CompactCard({ m, isFinal }: { m: BracketMatchup; isFinal?: boolean }) {
  const isPost = m.status === 'post'
  const isLive = m.status === 'in'
  const homeWins = isPost && (m.home.winner ?? false)
  const awayWins = isPost && (m.away.winner ?? false)
  const showScore = isPost || isLive

  const borderColor = isFinal
    ? 'rgba(251,191,36,0.38)'
    : isLive ? 'rgba(34,197,94,0.35)' : 'rgba(255,255,255,0.1)'
  const bgColor = isFinal
    ? 'rgba(251,191,36,0.04)'
    : isLive ? 'rgba(34,197,94,0.04)' : 'rgba(255,255,255,0.025)'

  return (
    <div style={{
      width: '100%',
      border: `1px solid ${borderColor}`,
      borderRadius: '9px',
      overflow: 'hidden',
      background: bgColor,
      boxShadow: isLive ? '0 0 10px rgba(34,197,94,0.12)' : isFinal ? '0 0 10px rgba(251,191,36,0.07)' : 'none',
    }}>
      {([m.home, m.away] as BracketTeam[]).map((team, ti) => {
        const wins = ti === 0 ? homeWins : awayWins
        const loses = ti === 0 ? awayWins : homeWins
        const slot = isSlot(team.abbreviation)
        return (
          <div key={ti} style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: isFinal ? '6px 9px' : '5px 7px',
            borderBottom: ti === 0 ? '1px solid rgba(255,255,255,0.05)' : 'none',
            background: wins ? 'rgba(74,222,128,0.06)' : 'transparent',
          }}>
            <span style={{ fontSize: isFinal ? '15px' : '13px', opacity: slot ? 0.25 : 1, flexShrink: 0, lineHeight: 1 }}>
              {team.flagEmoji}
            </span>
            <span style={{
              flex: 1,
              fontSize: slot ? '8px' : isFinal ? '12px' : '11px',
              fontWeight: wins ? 800 : slot ? 400 : 600,
              color: slot ? 'rgba(255,255,255,0.25)' : wins ? '#fff' : loses ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.88)',
              fontStyle: slot ? 'italic' : 'normal',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              letterSpacing: slot ? 0 : '-0.01em',
            }}>
              {slot ? team.name : team.abbreviation}
            </span>
            {showScore && team.score !== undefined && (
              <span style={{
                fontSize: isFinal ? '17px' : '14px',
                fontWeight: 900,
                fontVariantNumeric: 'tabular-nums',
                color: wins ? 'rgba(74,222,128,0.95)' : loses ? 'rgba(255,255,255,0.25)' : '#fff',
                minWidth: '12px', textAlign: 'right', lineHeight: 1,
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

// ── SVG connector: draws staple shapes from N×2 matches to N matches ─
function BracketConnector({ numPairs, pairSlotH }: { numPairs: number; pairSlotH: number }) {
  const totalH = numPairs * 2 * pairSlotH
  const mid = pairSlotH / 2
  const COLOR = 'rgba(255,255,255,0.18)'
  return (
    <svg width={CONN_W} height={totalH} style={{ display: 'block', flexShrink: 0 }}>
      {Array.from({ length: numPairs }, (_, p) => {
        const topY = p * 2 * pairSlotH + mid
        const botY = p * 2 * pairSlotH + pairSlotH + mid
        const midY = (topY + botY) / 2
        const cx = CONN_W / 2
        return (
          <g key={p}>
            <line x1={0} y1={topY} x2={cx} y2={topY} stroke={COLOR} strokeWidth={1} />
            <line x1={cx} y1={topY} x2={cx} y2={botY} stroke={COLOR} strokeWidth={1} />
            <line x1={0} y1={botY} x2={cx} y2={botY} stroke={COLOR} strokeWidth={1} />
            <line x1={cx} y1={midY} x2={CONN_W} y2={midY} stroke={COLOR} strokeWidth={1} />
          </g>
        )
      })}
    </svg>
  )
}

// ── Column of match cards, each centered in slotH ───────────────────
function RoundColumn({ matches, slotH, isFinal }: { matches: BracketMatchup[]; slotH: number; isFinal?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: CARD_W, flexShrink: 0 }}>
      {matches.map((m) => (
        <div key={m.id} style={{ height: slotH, display: 'flex', alignItems: 'center', padding: '3px 0' }}>
          <CompactCard m={m} isFinal={isFinal} />
        </div>
      ))}
    </div>
  )
}

// ── Round label above each column ────────────────────────────────────
function RoundLabel({ label, isGold }: { label: string; isGold?: boolean }) {
  return (
    <div style={{
      width: CARD_W, flexShrink: 0,
      fontSize: '9px', fontWeight: 700,
      color: isGold ? 'rgba(251,191,36,0.7)' : 'rgba(255,255,255,0.3)',
      textTransform: 'uppercase', letterSpacing: '0.07em',
      textAlign: 'center', paddingBottom: '6px',
    }}>{label}</div>
  )
}

// ── QF→SF→Final visual bracket ───────────────────────────────────────
function VisualBracket({ rounds }: { rounds: BracketRound[] }) {
  const qf = rounds.find(r => r.name === 'Quarterfinals')?.matchups ?? []
  const sf = rounds.find(r => r.name === 'Semifinals')?.matchups ?? []
  const fin = rounds.find(r => r.name === 'Final')?.matchups ?? []

  if (qf.length === 0 && sf.length === 0 && fin.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '24px 0', color: 'rgba(255,255,255,0.28)', fontSize: '11px' }}>
        Quarterfinals begin July 4
      </div>
    )
  }

  // Heights: QF slot = SLOT_H, SF slot = 2×SLOT_H, Final slot = 4×SLOT_H
  // Total visual height = 4 × SLOT_H (all columns share same total height)
  return (
    <div style={{ overflowX: 'auto', paddingBottom: '2px' }}>
      {/* Column labels */}
      <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '0px' }}>
        {qf.length > 0 && <RoundLabel label="Quarterfinals" />}
        {qf.length > 0 && <div style={{ width: CONN_W, flexShrink: 0 }} />}
        {sf.length > 0 && <RoundLabel label="Semifinals" />}
        {sf.length > 0 && <div style={{ width: CONN_W, flexShrink: 0 }} />}
        {fin.length > 0 && <RoundLabel label="Final" isGold />}
      </div>

      {/* The bracket tree */}
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        {qf.length > 0 && (
          <>
            <RoundColumn matches={qf} slotH={SLOT_H} />
            <BracketConnector numPairs={Math.max(1, qf.length / 2)} pairSlotH={SLOT_H} />
          </>
        )}
        {sf.length > 0 && (
          <>
            <RoundColumn matches={sf} slotH={2 * SLOT_H} />
            <BracketConnector numPairs={Math.max(1, sf.length / 2)} pairSlotH={2 * SLOT_H} />
          </>
        )}
        {fin.length > 0 && (
          <RoundColumn matches={fin} slotH={4 * SLOT_H} isFinal />
        )}
      </div>
    </div>
  )
}

// ── Detailed list card for R32/R16 ───────────────────────────────────
function ListCard({ m, matchNum }: { m: BracketMatchup; matchNum: number }) {
  const isPost = m.status === 'post'
  const isLive = m.status === 'in'
  const homeWins = isPost && (m.home.winner ?? false)
  const awayWins = isPost && (m.away.winner ?? false)
  const showScore = isPost || isLive
  const accent = isLive ? 'rgba(34,197,94,0.28)' : 'rgba(255,255,255,0.07)'

  return (
    <div style={{ borderRadius: '11px', overflow: 'hidden', border: `1px solid ${accent}`, background: isLive ? 'rgba(34,197,94,0.03)' : 'rgba(255,255,255,0.02)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 11px', background: 'rgba(255,255,255,0.03)', borderBottom: `1px solid ${accent}` }}>
        <span style={{ fontSize: '9px', fontWeight: 700, color: isLive ? 'rgba(34,197,94,0.9)' : 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {isLive ? '● Live' : `Match ${matchNum}`}
        </span>
        <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)' }}>{fmtDate(m.date)}</span>
      </div>
      {([m.home, m.away] as BracketTeam[]).map((team, ti) => {
        const wins = ti === 0 ? homeWins : awayWins
        const loses = ti === 0 ? awayWins : homeWins
        const slot = isSlot(team.abbreviation)
        return (
          <div key={ti} style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 11px',
            borderBottom: ti === 0 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            background: wins ? 'rgba(74,222,128,0.05)' : 'transparent',
          }}>
            <span style={{ fontSize: '15px', opacity: slot ? 0.28 : 1, flexShrink: 0 }}>{team.flagEmoji}</span>
            <span style={{
              flex: 1, fontSize: slot ? '9px' : '11px', fontWeight: wins ? 700 : slot ? 400 : 600,
              color: slot ? 'rgba(255,255,255,0.25)' : wins ? '#fff' : loses ? 'rgba(255,255,255,0.32)' : 'rgba(255,255,255,0.88)',
              fontStyle: slot ? 'italic' : 'normal',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {slot ? team.name : team.abbreviation}
            </span>
            {showScore && team.score !== undefined && (
              <span style={{ fontSize: '16px', fontWeight: 900, fontVariantNumeric: 'tabular-nums', color: wins ? 'rgba(74,222,128,0.9)' : loses ? 'rgba(255,255,255,0.25)' : '#fff' }}>
                {team.score}
              </span>
            )}
          </div>
        )
      })}
      {isPost && (homeWins || awayWins) && (
        <div style={{ padding: '4px 11px', borderTop: '1px solid rgba(255,255,255,0.04)', background: 'rgba(74,222,128,0.03)' }}>
          <span style={{ fontSize: '9px', color: 'rgba(74,222,128,0.55)', fontWeight: 600 }}>
            {homeWins ? m.home.name : m.away.name} advances →
          </span>
        </div>
      )}
    </div>
  )
}

// ── Section header ───────────────────────────────────────────────────
function SectionHeader({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.32)', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{label}</span>
      <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────
const EARLY_NAMES = ['Round of 32', 'Round of 16']
const EARLY_LABELS: Record<string, string> = { 'Round of 32': 'R32', 'Round of 16': 'R16' }

export default function Bracket() {
  const [rounds, setRounds] = useState<BracketRound[]>([])
  const [loading, setLoading] = useState(true)
  const [earlyIdx, setEarlyIdx] = useState(0)

  useEffect(() => {
    window.api.getBracket().then((data) => {
      const r = data as BracketRound[]
      setRounds(r)
      setLoading(false)
      // Default early round to first with live match, or first with results
      const earlyRounds = r.filter(rd => EARLY_NAMES.includes(rd.name))
      const liveIdx = earlyRounds.findIndex(rd => rd.matchups.some(m => m.status === 'in'))
      const doneIdx = earlyRounds.findIndex(rd => rd.matchups.some(m => m.status === 'post'))
      setEarlyIdx(liveIdx >= 0 ? liveIdx : doneIdx >= 0 ? doneIdx : 0)
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

  const earlyRounds = rounds.filter(r => EARLY_NAMES.includes(r.name))
  const thirdPlace = rounds.find(r => r.name === '3rd Place')
  const hasVisualBracket = rounds.some(r => ['Quarterfinals', 'Semifinals', 'Final'].includes(r.name))
  const activeEarly = earlyRounds[earlyIdx]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

      {/* ── Visual bracket: QF / SF / Final ── */}
      {hasVisualBracket && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <SectionHeader label="Knockout Stage" />
          <VisualBracket rounds={rounds} />
        </div>
      )}

      {/* ── Early rounds (R32 / R16) ── */}
      {earlyRounds.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <SectionHeader label={earlyRounds.length > 1 ? 'Earlier Rounds' : (earlyRounds[0]?.name ?? '')} />

          {earlyRounds.length > 1 && (
            <div style={{ display: 'flex', gap: '4px' }}>
              {earlyRounds.map((r, i) => {
                const hasLive = r.matchups.some(m => m.status === 'in')
                const done = r.matchups.filter(m => m.status === 'post').length
                const isActive = earlyIdx === i
                return (
                  <button
                    key={r.name}
                    onClick={() => setEarlyIdx(i)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                      padding: '6px 14px', borderRadius: '9px', cursor: 'pointer',
                      fontFamily: 'inherit', position: 'relative',
                      border: isActive ? '1px solid rgba(255,255,255,0.18)' : '1px solid rgba(255,255,255,0.07)',
                      background: isActive ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)',
                    }}
                  >
                    {hasLive && <span style={{ position: 'absolute', top: '4px', right: '4px', width: '5px', height: '5px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 4px rgba(34,197,94,0.8)' }} />}
                    <span style={{ fontSize: '11px', fontWeight: isActive ? 800 : 500, color: isActive ? '#fff' : 'rgba(255,255,255,0.45)' }}>
                      {EARLY_LABELS[r.name] ?? r.name}
                    </span>
                    <span style={{ fontSize: '8px', fontWeight: 600, color: done > 0 ? 'rgba(74,222,128,0.6)' : 'rgba(255,255,255,0.22)' }}>
                      {done > 0 ? `${done}/${r.matchups.length}` : `${r.matchups.length} matches`}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {activeEarly && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {activeEarly.matchups.map((m, i) => (
                <ListCard key={m.id || i} m={m} matchNum={i + 1} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 3rd place ── */}
      {thirdPlace && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <SectionHeader label="3rd Place" />
          {thirdPlace.matchups.map((m, i) => <ListCard key={m.id || i} m={m} matchNum={1} />)}
        </div>
      )}

    </div>
  )
}
