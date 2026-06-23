import { useState, useEffect } from 'react'

interface PlayerData {
  id: string; name: string; shortName: string
  position: string; jersey: string; nationality: string
  age?: number; dateOfBirth?: string
  height?: string; weight?: string
  photoUrl?: string
  teamName?: string; teamAbbr?: string; teamId?: string
}

function StatPill({ label, value }: { label: string; value: string | number }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', padding: '10px 8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', flex: 1 }}>
      <span style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>{value}</span>
      <span style={{ fontSize: '9px', fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'center' }}>{label}</span>
    </div>
  )
}

export default function PlayerPage({
  playerId, playerName, position, teamFlag, teamAbbr, onBack, onTeamClick,
}: {
  playerId: string
  playerName: string
  position: string
  teamFlag: string
  teamAbbr: string
  onBack: () => void
  onTeamClick?: (teamId: string, teamName: string, flagEmoji: string) => void
}) {
  const [data, setData] = useState<PlayerData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    window.api.getPlayerPage(playerId).then((d) => {
      if (!cancelled) { setData(d as PlayerData); setLoading(false) }
    }).catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [playerId])

  const displayName = data?.name || playerName
  const displayPosition = data?.position || position
  const photo = data?.photoUrl

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>

      {/* Header */}
      <div style={{ flexShrink: 0, padding: '10px 20px 0' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontSize: '12px', padding: '0 0 8px', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'inherit' }}>
          ← Back
        </button>

        {/* Hero card */}
        <div style={{ borderRadius: '16px', overflow: 'hidden', marginBottom: '12px', position: 'relative', background: 'linear-gradient(135deg, rgba(14,18,26,0.97) 0%, rgba(8,12,18,0.98) 100%)', border: '1px solid rgba(255,255,255,0.09)' }}>
          {/* Photo bg */}
          {photo ? (
            <div style={{ position: 'absolute', inset: 0 }}>
              <div style={{ width: '55%', height: '100%', position: 'absolute', right: 0, backgroundImage: `url(${photo})`, backgroundSize: 'cover', backgroundPosition: 'top center', opacity: 0.55 }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(10,14,20,1) 35%, rgba(10,14,20,0.4) 70%, rgba(10,14,20,0.1) 100%)' }} />
            </div>
          ) : null}

          {/* Content */}
          <div style={{ position: 'relative', zIndex: 1, padding: '18px 18px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              {/* Jersey number */}
              <div style={{ flexShrink: 0, width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '20px', fontWeight: 900, color: 'rgba(255,255,255,0.8)', fontVariantNumeric: 'tabular-nums' }}>
                  {data?.jersey || '–'}
                </span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '20px', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{displayName}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.02em' }}>{displayPosition}</span>
                  {/* Team badge */}
                  {(data?.teamName || teamAbbr) && (
                    <button
                      onClick={() => data?.teamId && onTeamClick?.(data.teamId, data.teamName!, teamFlag)}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '2px 8px', cursor: data?.teamId && onTeamClick ? 'pointer' : 'default', fontFamily: 'inherit' }}
                    >
                      <span style={{ fontSize: '12px' }}>{teamFlag}</span>
                      <span style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>{data?.teamAbbr || teamAbbr}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* No photo placeholder */}
            {!photo && !loading && (
              <div style={{ marginTop: '10px', width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '24px' }}>{teamFlag}</span>
              </div>
            )}
          </div>
        </div>

        <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', marginBottom: '12px' }} />
      </div>

      {/* Scrollable content */}
      <div style={{ overflowY: 'auto', overflowX: 'hidden', padding: '0 20px 16px' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(255,255,255,0.35)', fontSize: '12px' }}>Loading player data…</div>
        )}

        {!loading && (
          <>
            {/* Stat pills row */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
              {data?.age && <StatPill label="Age" value={data.age} />}
              {data?.height && <StatPill label="Height" value={data.height} />}
              {data?.weight && <StatPill label="Weight" value={data.weight} />}
              {data?.nationality && <StatPill label="Country" value={data.nationality} />}
            </div>

            {/* Birth date */}
            {data?.dateOfBirth && (
              <div style={{ marginBottom: '12px', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px' }}>
                <span style={{ fontSize: '9px', fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '3px' }}>Born</span>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)' }}>{data.dateOfBirth}</span>
              </div>
            )}

            {/* Club */}
            {data?.teamName && (
              <div style={{ marginBottom: '12px', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px' }}>
                <span style={{ fontSize: '9px', fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '3px' }}>Club</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)' }}>{data.teamName}</span>
                  {data.teamAbbr && <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>{data.teamAbbr}</span>}
                </div>
              </div>
            )}

            {/* No data fallback */}
            {!data?.age && !data?.height && !data?.nationality && !data?.dateOfBirth && (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'rgba(255,255,255,0.25)', fontSize: '12px' }}>
                Full stats not available for this player
              </div>
            )}

            {/* ESPN link */}
            <button
              onClick={() => window.api.openUrl?.(`https://www.espn.com/soccer/player/_/id/${playerId}`)}
              style={{ width: '100%', marginTop: '8px', padding: '10px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.45)', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
            >
              View full profile on ESPN ↗
            </button>
          </>
        )}
      </div>
    </div>
  )
}
