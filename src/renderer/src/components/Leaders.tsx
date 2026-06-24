import { useEffect, useRef, useState } from 'react'

interface PlayerLeader {
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

type SortKey = 'goals' | 'assists' | 'shotsOnTarget' | 'yellowCards' | 'redCards' | 'foulsCommitted'

interface Props {
  onPlayerClick?: (playerId: string) => void
}

const SEASONS = [2026, 2022, 2018, 2014, 2010, 2006, 2002]

const COLS: { key: SortKey; label: string; title: string }[] = [
  { key: 'goals',          label: 'G',    title: 'Goals' },
  { key: 'assists',        label: 'A',    title: 'Assists' },
  { key: 'shotsOnTarget',  label: 'SOT',  title: 'Shots on Target' },
  { key: 'yellowCards',    label: 'YC',   title: 'Yellow Cards' },
  { key: 'redCards',       label: 'RC',   title: 'Red Cards' },
  { key: 'foulsCommitted', label: 'Fls',  title: 'Fouls Committed' },
]

export default function Leaders({ onPlayerClick }: Props) {
  const [season, setSeason] = useState(2026)
  const [players, setPlayers] = useState<PlayerLeader[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('goals')
  const [showSeasonMenu, setShowSeasonMenu] = useState(false)
  const seasonRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLoading(true)
    setError(false)
    ;(window.api.getLeaders(season) as Promise<PlayerLeader[]>)
      .then((data) => {
        setPlayers(data)
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [season])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (seasonRef.current && !seasonRef.current.contains(e.target as Node)) {
        setShowSeasonMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const sorted = [...players].sort((a, b) => b[sortKey] - a[sortKey] || b.goals - a.goals)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* ── Controls bar ── */}
      <div style={{ padding: '12px 16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexShrink: 0 }}>

        {/* Sort pills */}
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {COLS.map((col) => (
            <button
              key={col.key}
              onClick={() => setSortKey(col.key)}
              title={col.title}
              style={{
                padding: '3px 9px',
                borderRadius: '20px',
                border: sortKey === col.key ? '1px solid rgba(251,191,36,0.5)' : '1px solid rgba(255,255,255,0.1)',
                background: sortKey === col.key ? 'rgba(251,191,36,0.12)' : 'transparent',
                color: sortKey === col.key ? 'rgba(251,191,36,0.95)' : 'rgba(255,255,255,0.4)',
                fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {col.label}
            </button>
          ))}
        </div>

        {/* Season picker */}
        <div ref={seasonRef} style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={() => setShowSeasonMenu((v) => !v)}
            style={{
              padding: '3px 10px 3px 8px',
              borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: showSeasonMenu ? 'rgba(255,255,255,0.08)' : 'transparent',
              color: 'rgba(255,255,255,0.45)',
              fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: '4px',
            }}
          >
            {season} <span style={{ fontSize: '9px', opacity: 0.6 }}>▾</span>
          </button>
          {showSeasonMenu && (
            <div style={{
              position: 'absolute', right: 0, top: '100%', marginTop: '4px',
              background: 'rgba(18,18,24,0.98)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '10px', padding: '4px', zIndex: 100,
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              minWidth: '80px',
            }}>
              {SEASONS.map((yr) => (
                <button
                  key={yr}
                  onClick={() => { setSeason(yr); setShowSeasonMenu(false) }}
                  style={{
                    display: 'block', width: '100%', padding: '6px 12px',
                    textAlign: 'left', background: yr === season ? 'rgba(255,255,255,0.08)' : 'transparent',
                    border: 'none', borderRadius: '7px', color: yr === season ? '#fff' : 'rgba(255,255,255,0.5)',
                    fontSize: '12px', fontWeight: yr === season ? 700 : 400,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  {yr}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Table header ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '28px 32px 1fr 28px 28px 34px 28px 28px 34px',
        gap: 0,
        padding: '8px 16px 6px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        flexShrink: 0,
        marginTop: '10px',
      }}>
        <span style={hStyle}>#</span>
        <span />
        <span style={{ ...hStyle, textAlign: 'left', paddingLeft: '4px' }}>Player</span>
        {COLS.map((col) => (
          <button
            key={col.key}
            onClick={() => setSortKey(col.key)}
            title={col.title}
            style={{
              ...hStyle,
              background: 'transparent', border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', padding: 0,
              color: sortKey === col.key ? 'rgba(251,191,36,0.9)' : 'rgba(255,255,255,0.25)',
              fontWeight: sortKey === col.key ? 700 : 600,
            }}
          >
            {col.label}
          </button>
        ))}
      </div>

      {/* ── Body ── */}
      {loading ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>Loading player stats…</div>
        </div>
      ) : error ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>Could not load leaders.</p>
        </div>
      ) : sorted.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>No data for {season}.</p>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {sorted.map((p, i) => {
            const statVal = p[sortKey]
            if (statVal === 0 && i > 0 && sorted[i - 1][sortKey] === 0) return null
            const isActive = statVal > 0

            return (
              <div
                key={p.playerId}
                onClick={() => isActive && onPlayerClick?.(p.playerId)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '28px 32px 1fr 28px 28px 34px 28px 28px 34px',
                  gap: 0,
                  padding: '8px 16px',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  cursor: onPlayerClick && isActive ? 'pointer' : 'default',
                  alignItems: 'center',
                }}
                onMouseEnter={(e) => { if (onPlayerClick && isActive) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
              >
                {/* Rank */}
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', fontWeight: 600, textAlign: 'right', paddingRight: '6px' }}>
                  {i + 1}
                </span>

                {/* Photo */}
                <div style={{ width: '26px', height: '26px', borderRadius: '50%', overflow: 'hidden', background: 'rgba(255,255,255,0.06)', flexShrink: 0 }}>
                  <img
                    src={p.photoUrl}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                </div>

                {/* Name + flag */}
                <div style={{ minWidth: 0, paddingLeft: '8px' }}>
                  <div style={{
                    fontSize: '12px', fontWeight: 600,
                    color: isActive ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.35)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {p.flagEmoji} {p.shortName || p.name}
                  </div>
                  {p.nationality && (
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', marginTop: '1px' }}>
                      {p.nationality}
                    </div>
                  )}
                </div>

                {/* Stats */}
                {COLS.map((col) => (
                  <span
                    key={col.key}
                    style={{
                      fontSize: '12px', textAlign: 'center', fontWeight: col.key === sortKey ? 700 : 400,
                      color: col.key === sortKey
                        ? (p[col.key] > 0 ? 'rgba(251,191,36,0.9)' : 'rgba(255,255,255,0.2)')
                        : (p[col.key] > 0 ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.2)'),
                    }}
                  >
                    {p[col.key] || '—'}
                  </span>
                ))}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const hStyle: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 700,
  color: 'rgba(255,255,255,0.25)',
  textAlign: 'center',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}
