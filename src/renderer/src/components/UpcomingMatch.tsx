import type { Match } from '../types'

interface Props {
  match: Match
  isUnsubscribed: boolean
  onUnsubscribe: () => void
  onResubscribe: () => void
  onClick?: () => void
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  if (d.toDateString() === today.toDateString()) return `Today  ${timeStr}`
  if (d.toDateString() === tomorrow.toDateString()) return `Tomorrow  ${timeStr}`
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + `  ${timeStr}`
}

export default function UpcomingMatch({ match, isUnsubscribed, onUnsubscribe, onResubscribe, onClick }: Props) {
  const isLive = match.status === 'in'
  const isFinished = match.status === 'post'

  return (
    <div onClick={onClick} style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '11px 14px',
      borderRadius: '12px',
      border: isLive ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(255,255,255,0.07)',
      background: isLive ? 'rgba(5,30,10,0.6)' : 'rgba(255,255,255,0.04)',
      cursor: onClick ? 'pointer' : 'default',
    }}>
      {/* Teams */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '14px' }}>{match.homeTeam.flagEmoji}</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.88)' }}>{match.homeTeam.abbreviation}</span>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>vs</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.88)' }}>{match.awayTeam.abbreviation}</span>
          <span style={{ fontSize: '14px' }}>{match.awayTeam.flagEmoji}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)' }}>
            {isLive ? `● Live  ${match.clock ?? ''}` : isFinished ? 'Full Time' : formatDate(match.date)}
          </span>
          {match.broadcasts[0] && !isLive && !isFinished && (
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)', fontWeight: 600, letterSpacing: '0.04em' }}>
              {match.broadcasts[0].toUpperCase() === 'TELE' ? 'TELEMUNDO' : match.broadcasts[0].toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Score or bell */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
        {(isLive || isFinished) ? (
          <span style={{ fontSize: '14px', fontWeight: 800, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
            {match.homeScore} – {match.awayScore}
          </span>
        ) : (
          <button
            onClick={isUnsubscribed ? onResubscribe : onUnsubscribe}
            title={isUnsubscribed ? 'Unmute' : 'Mute notifications'}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px',
              color: isUnsubscribed ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.5)',
              padding: '2px',
            }}
          >
            {isUnsubscribed ? '🔕' : '🔔'}
          </button>
        )}
      </div>
    </div>
  )
}
