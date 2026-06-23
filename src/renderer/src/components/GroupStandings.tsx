import { useState, useEffect } from 'react'
import type { StandingsGroup } from '../types'

function fmtGD(gd: number) { return gd > 0 ? `+${gd}` : `${gd}` }

export default function GroupStandings() {
  const [groups, setGroups] = useState<StandingsGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    window.api.getStandings().then((data) => {
      setGroups(data as StandingsGroup[])
      setLoading(false)
    }).catch(() => {
      setError(true)
      setLoading(false)
    })
  }, [])

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>
      Loading standings…
    </div>
  )

  if (error || groups.length === 0) return (
    <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>
      Standings unavailable
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {groups.map((group) => (
        <div key={group.name}>
          {/* Group header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', padding: '0 2px' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              {group.name}
            </span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
          </div>

          {/* Column headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 20px 20px 20px 28px 28px 28px 24px',
            gap: '0 4px',
            padding: '2px 6px 4px',
            fontSize: '9px',
            fontWeight: 600,
            color: 'rgba(255,255,255,0.3)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}>
            <span>Team</span>
            <span style={{ textAlign: 'center' }}>P</span>
            <span style={{ textAlign: 'center' }}>W</span>
            <span style={{ textAlign: 'center' }}>D</span>
            <span style={{ textAlign: 'center' }}>L</span>
            <span style={{ textAlign: 'center' }}>GD</span>
            <span style={{ textAlign: 'center' }}>GF</span>
            <span style={{ textAlign: 'right', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Pts</span>
          </div>

          {/* Entries */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            {group.entries.map((entry, idx) => {
              const isQualified = idx < 2
              const isBubble = idx === 2
              return (
                <div
                  key={entry.teamId || entry.abbreviation}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 20px 20px 20px 28px 28px 28px 24px',
                    gap: '0 4px',
                    padding: '5px 6px',
                    borderRadius: '7px',
                    background: isQualified
                      ? 'rgba(74,222,128,0.05)'
                      : isBubble ? 'rgba(251,191,36,0.04)' : 'transparent',
                    borderLeft: isQualified
                      ? '2px solid rgba(74,222,128,0.35)'
                      : isBubble ? '2px solid rgba(251,191,36,0.3)' : '2px solid transparent',
                    alignItems: 'center',
                  }}
                >
                  {/* Team */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0 }}>
                    <span style={{ fontSize: '13px', flexShrink: 0 }}>{entry.flagEmoji}</span>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: isQualified ? 700 : 500,
                      color: isQualified ? '#fff' : 'rgba(255,255,255,0.75)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {entry.abbreviation}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{entry.played}</span>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{entry.w}</span>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{entry.d}</span>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{entry.l}</span>
                  <span style={{ fontSize: '11px', color: entry.gd > 0 ? 'rgba(74,222,128,0.85)' : entry.gd < 0 ? 'rgba(239,68,68,0.7)' : 'rgba(255,255,255,0.45)', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{fmtGD(entry.gd)}</span>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{entry.gf}</span>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: isQualified ? 'rgba(74,222,128,0.95)' : '#fff', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{entry.pts}</span>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Legend */}
      <div style={{ display: 'flex', gap: '12px', paddingLeft: '4px', paddingBottom: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'rgba(74,222,128,0.35)' }} />
          <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.35)' }}>Advance</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'rgba(251,191,36,0.3)' }} />
          <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.35)' }}>Bubble</span>
        </div>
      </div>
    </div>
  )
}
