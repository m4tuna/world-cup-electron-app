import { useState, useEffect } from 'react'

interface PlayerTournamentStats {
  appearances: number
  goals: number
  keyPasses: number
  shots: number
  passPct: string
  yellowCards: number
  redCards: number
}

interface PlayerData {
  id: string; name: string; shortName: string
  position: string; jersey: string; nationality: string
  age?: number; dateOfBirth?: string
  height?: string; weight?: string
  photoUrl?: string
  teamName?: string; teamAbbr?: string; teamId?: string
  tournamentStats?: PlayerTournamentStats
}

function InfoRow({ label, value, children }: { label: string; value?: string | number; children?: React.ReactNode }) {
  if (!value && !children) return null
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontWeight: 500, letterSpacing: '0.02em' }}>{label}</span>
      {children ?? <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>{value}</span>}
    </div>
  )
}

function StatBadge({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '12px 6px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
      <span style={{ fontSize: '15px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>{value}</span>
      <span style={{ fontSize: '9px', fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
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

      {/* Back button */}
      <div style={{ flexShrink: 0, padding: '10px 20px 0' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontSize: '12px', padding: '0 0 10px', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'inherit' }}>
          ← Back
        </button>
      </div>

      {/* Hero photo card */}
      <div style={{ position: 'relative', height: '220px', flexShrink: 0, overflow: 'hidden', margin: '0 20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
        {/* Photo fill */}
        {photo ? (
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${photo})`,
            backgroundSize: 'cover',
            backgroundPosition: 'top center',
          }} />
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(20,28,40,1) 0%, rgba(10,16,26,1) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '72px', opacity: 0.25 }}>{teamFlag}</span>
          </div>
        )}

        {/* Gradient overlays */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.72) 75%, rgba(0,0,0,0.92) 100%)' }} />
        {/* Side fade for text readability */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.5) 0%, transparent 50%)' }} />

        {/* Jersey number — top left */}
        {data?.jersey && (
          <div style={{ position: 'absolute', top: '14px', left: '14px', width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '18px', fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{data.jersey}</span>
          </div>
        )}

        {/* Name + position + team — bottom left */}
        <div style={{ position: 'absolute', bottom: '16px', left: '16px', right: '16px' }}>
          <p style={{ fontSize: '26px', fontWeight: 900, color: '#fff', margin: 0, lineHeight: 1.1, letterSpacing: '-0.025em', textShadow: '0 2px 12px rgba(0,0,0,0.8)' }}>
            {displayName}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
            {displayPosition && (
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>{displayPosition}</span>
            )}
            <button
              onClick={() => data?.teamId && onTeamClick?.(data.teamId, data.teamName ?? teamAbbr, teamFlag)}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '20px', padding: '3px 10px', cursor: data?.teamId && onTeamClick ? 'pointer' : 'default', fontFamily: 'inherit' }}
            >
              <span style={{ fontSize: '13px' }}>{teamFlag}</span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>{data?.teamAbbr || teamAbbr}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '16px 20px 20px' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(255,255,255,0.35)', fontSize: '12px' }}>Loading…</div>
        )}

        {!loading && (
          <>
            {/* Stat badges row */}
            {(data?.age || data?.height || data?.weight) && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                {data.age && <StatBadge label="Age" value={data.age} />}
                {data.height && <StatBadge label="Height" value={data.height} />}
                {data.weight && <StatBadge label="Weight" value={data.weight} />}
              </div>
            )}

            {/* World Cup 2026 stats */}
            {data?.tournamentStats && (
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px' }}>2026 World Cup Stats</p>
                {/* Primary stats row */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <div style={{ flex: 1, background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.18)', borderRadius: '12px', padding: '12px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                    <span style={{ fontSize: '28px', fontWeight: 900, color: 'rgba(74,222,128,0.95)', letterSpacing: '-0.03em', lineHeight: 1 }}>{data.tournamentStats.goals}</span>
                    <span style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Goals</span>
                  </div>
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                    <span style={{ fontSize: '28px', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>{data.tournamentStats.appearances}</span>
                    <span style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Apps</span>
                  </div>
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                    <span style={{ fontSize: '28px', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>{data.tournamentStats.keyPasses}</span>
                    <span style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Key Passes</span>
                  </div>
                </div>
                {/* Secondary stats row */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  {data.tournamentStats.shots > 0 && (
                    <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '8px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: 'rgba(255,255,255,0.85)' }}>{data.tournamentStats.shots}</span>
                      <span style={{ fontSize: '8px', fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Shots</span>
                    </div>
                  )}
                  {data.tournamentStats.passPct && (
                    <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '8px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: 'rgba(255,255,255,0.85)' }}>{data.tournamentStats.passPct}</span>
                      <span style={{ fontSize: '8px', fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Pass %</span>
                    </div>
                  )}
                  {data.tournamentStats.yellowCards > 0 && (
                    <div style={{ flex: 1, background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.2)', borderRadius: '10px', padding: '8px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: 'rgba(234,179,8,0.85)' }}>🟨 {data.tournamentStats.yellowCards}</span>
                      <span style={{ fontSize: '8px', fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Yellow</span>
                    </div>
                  )}
                  {data.tournamentStats.redCards > 0 && (
                    <div style={{ flex: 1, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '8px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: 'rgba(239,68,68,0.85)' }}>🟥 {data.tournamentStats.redCards}</span>
                      <span style={{ fontSize: '8px', fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Red</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Info rows */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '0 14px', marginBottom: '14px' }}>
              <InfoRow label="Born" value={data?.dateOfBirth} />
              <InfoRow label="Nationality" value={data?.nationality} />
              {data?.teamName && (
                <InfoRow label="National team">
                  <button
                    onClick={() => data.teamId && onTeamClick?.(data.teamId, data.teamName!, teamFlag)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', padding: 0, cursor: data.teamId && onTeamClick ? 'pointer' : 'default', fontFamily: 'inherit' }}
                  >
                    <span style={{ fontSize: '14px' }}>{teamFlag}</span>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>{data.teamName}</span>
                  </button>
                </InfoRow>
              )}
            </div>

            {/* No data fallback */}
            {!data?.age && !data?.height && !data?.nationality && !data?.dateOfBirth && (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'rgba(255,255,255,0.25)', fontSize: '12px' }}>
                Full stats not available for this player
              </div>
            )}

            {/* ESPN link */}
            <button
              onClick={() => window.api.openUrl?.(`https://www.espn.com/soccer/player/_/id/${playerId}`)}
              style={{ width: '100%', padding: '11px', borderRadius: '11px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.45)', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
            >
              View full profile on ESPN ↗
            </button>
          </>
        )}
      </div>
    </div>
  )
}
