import { useState, useEffect } from 'react'

interface TeamAthlete {
  id: string; name: string; shortName: string
  jersey: string; position: string; photoUrl?: string
}
interface TeamData {
  id: string; name: string; abbreviation: string; flagEmoji: string
  logoUrl?: string; coach?: string; record?: string
  athletes: TeamAthlete[]
}

const POS_ORDER = ['GK', 'G', 'D', 'M', 'F', 'MF', 'FW']
const POS_LABEL: Record<string, string> = {
  GK: 'Goalkeepers', G: 'Goalkeepers',
  D: 'Defenders', DB: 'Defenders', CB: 'Defenders', LB: 'Defenders', RB: 'Defenders', DF: 'Defenders',
  M: 'Midfielders', MF: 'Midfielders', CM: 'Midfielders', DM: 'Midfielders', AM: 'Midfielders',
  F: 'Forwards', FW: 'Forwards', ST: 'Forwards', CF: 'Forwards', LW: 'Forwards', RW: 'Forwards',
}
const POS_RANK: Record<string, number> = { GK: 0, G: 0, D: 1, DB: 1, CB: 1, LB: 1, RB: 1, DF: 1, M: 2, MF: 2, CM: 2, DM: 2, AM: 2, F: 3, FW: 3, ST: 3, CF: 3, LW: 3, RW: 3 }

export default function TeamPage({
  teamId, teamName, flagEmoji, onBack, onPlayerClick,
}: {
  teamId: string
  teamName: string
  flagEmoji: string
  onBack: () => void
  onPlayerClick?: (playerId: string, name: string, position: string, teamFlag: string, teamAbbr: string) => void
}) {
  const [data, setData] = useState<TeamData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    window.api.getTeamPage(teamId).then((d) => {
      if (!cancelled) { setData(d as TeamData); setLoading(false) }
    }).catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [teamId])

  const abbr = data?.abbreviation || ''

  // Group athletes by position
  const grouped = new Map<string, TeamAthlete[]>()
  if (data?.athletes) {
    for (const a of data.athletes) {
      const rank = POS_RANK[a.position] ?? 4
      const label = POS_LABEL[a.position] ?? (a.position || 'Squad')
      const key = `${rank}:${label}`
      if (!grouped.has(key)) grouped.set(key, [])
      grouped.get(key)!.push(a)
    }
  }
  const sections = [...grouped.entries()]
    .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
    .map(([key, players]) => ({ label: key.split(':')[1], players }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>

      {/* Header */}
      <div style={{ flexShrink: 0, padding: '10px 20px 0' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontSize: '12px', padding: '0 0 8px', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'inherit' }}>
          ← Back
        </button>

        {/* Team hero */}
        <div style={{ borderRadius: '16px', background: 'linear-gradient(135deg, rgba(16,20,28,0.97) 0%, rgba(10,14,20,0.98) 100%)', border: '1px solid rgba(255,255,255,0.09)', padding: '18px 18px 14px', marginBottom: '12px', position: 'relative', overflow: 'hidden' }}>
          {/* Logo faint bg */}
          {data?.logoUrl && (
            <div style={{ position: 'absolute', right: '-10px', top: '-10px', width: '100px', height: '100px', backgroundImage: `url(${data.logoUrl})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', opacity: 0.07 }} />
          )}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span style={{ fontSize: '52px', lineHeight: 1 }}>{flagEmoji}</span>
              <div>
                <p style={{ fontSize: '22px', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.02em', lineHeight: 1 }}>{data?.name || teamName}</p>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: '4px 0 0', letterSpacing: '0.04em' }}>{abbr}</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '14px', flexWrap: 'wrap' }}>
              {data?.record && (
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(74,222,128,0.9)', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', padding: '3px 10px', borderRadius: '20px' }}>
                  {data.record}
                </span>
              )}
              {data?.coach && (
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', padding: '3px 10px', borderRadius: '20px' }}>
                  Coach: {data.coach}
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', marginBottom: '12px' }} />
      </div>

      {/* Scrollable content */}
      <div style={{ overflowY: 'auto', overflowX: 'hidden', padding: '0 20px 16px' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(255,255,255,0.35)', fontSize: '12px' }}>Loading squad…</div>
        )}

        {!loading && sections.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>Squad data unavailable</div>
        )}

        {!loading && sections.map((sec) => (
          <div key={sec.label} style={{ marginBottom: '18px' }}>
            <p style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px' }}>
              {sec.label}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {sec.players.map((p) => (
                <button
                  key={p.id || p.name}
                  onClick={() => onPlayerClick?.(p.id, p.name, p.position, flagEmoji, abbr)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '7px 10px', borderRadius: '9px',
                    background: 'rgba(255,255,255,0.025)',
                    border: '1px solid transparent',
                    cursor: p.id && onPlayerClick ? 'pointer' : 'default',
                    fontFamily: 'inherit', width: '100%', textAlign: 'left',
                    transition: 'background 0.1s, border-color 0.1s',
                  }}
                  onMouseEnter={(e) => { if (p.id) { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.08)' } }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.025)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent' }}
                >
                  {/* Jersey */}
                  <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(255,255,255,0.07)', fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {p.jersey || '–'}
                  </span>
                  {/* Photo (if available) */}
                  {p.photoUrl ? (
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: 'rgba(255,255,255,0.05)' }}>
                      <img src={p.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
                    </div>
                  ) : (
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', flexShrink: 0 }} />
                  )}
                  {/* Name */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.85)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.shortName || p.name}
                    </p>
                    <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>{p.position}</p>
                  </div>
                  {p.id && onPlayerClick && (
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)' }}>›</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* ESPN link */}
        {teamId && (
          <button
            onClick={() => window.api.openUrl?.(`https://www.espn.com/soccer/team/_/id/${teamId}`)}
            style={{ width: '100%', marginTop: '8px', padding: '10px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.45)', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
          >
            View full page on ESPN ↗
          </button>
        )}
      </div>
    </div>
  )
}
