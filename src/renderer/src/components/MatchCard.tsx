import type { Match } from '../types'
import LiveBadge from './LiveBadge'
import ChannelBadge from './ChannelBadge'

interface Props {
  match: Match
  isUnsubscribed: boolean
  onUnsubscribe: () => void
  onResubscribe: () => void
  onClick?: () => void
  dimmed?: boolean
}

function formatMatchTime(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })
}

function GoalList({ match, side }: { match: Match; side: 'home' | 'away' }) {
  const teamId = side === 'home' ? match.homeTeam.id : match.awayTeam.id
  const goals = match.goalScorers.filter((g) => g.teamId === teamId)
  if (!goals.length) return null
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
      alignItems: side === 'away' ? 'flex-end' : 'flex-start',
    }}>
      {goals.map((g, i) => (
        <span key={i} style={{ fontSize: '11px', color: 'rgba(255,255,255,0.78)', lineHeight: 1.3 }}>
          ⚽ {g.playerName} {g.clock}{g.isPenalty ? ' (P)' : g.isOwnGoal ? ' (OG)' : ''}
        </span>
      ))}
    </div>
  )
}

export default function MatchCard({ match, isUnsubscribed, onUnsubscribe, onResubscribe, onClick, dimmed }: Props) {
  const isLive = match.status === 'in'
  const isFinished = match.status === 'post'
  const homePhoto = match.homeTeam.starPlayerPhoto || match.homeTeam.teamLogo
  const awayPhoto = match.awayTeam.starPlayerPhoto || match.awayTeam.teamLogo

  const cardBorder = isLive
    ? '1px solid rgba(34, 197, 94, 0.3)'
    : isFinished
      ? '1px solid rgba(255,255,255,0.07)'
      : '1px solid rgba(255,255,255,0.09)'

  const cardBg = isLive
    ? 'linear-gradient(135deg, rgba(5,30,10,0.95) 0%, rgba(3,20,8,0.98) 100%)'
    : 'linear-gradient(135deg, rgba(16,20,24,0.97) 0%, rgba(10,14,18,0.98) 100%)'

  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        borderRadius: '18px',
        overflow: 'hidden',
        border: cardBorder,
        boxShadow: isLive
          ? '0 4px 24px rgba(34,197,94,0.12), 0 1px 4px rgba(0,0,0,0.5)'
          : '0 2px 12px rgba(0,0,0,0.4)',
        cursor: onClick ? 'pointer' : 'default',
        opacity: dimmed ? 0.55 : 1,
        transition: 'opacity 0.15s',
      }}>
      {/* Player photo BG */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', overflow: 'hidden' }}>
        {homePhoto && (
          <div style={{
            flex: 1,
            backgroundImage: `url(${homePhoto})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
            opacity: 0.75,
          }} />
        )}
        {awayPhoto && (
          <div style={{
            flex: 1,
            backgroundImage: `url(${awayPhoto})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
            opacity: 0.75,
          }} />
        )}
      </div>

      {/* Gradient overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: cardBg,
        opacity: 0.84,
      }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, padding: '16px 18px 14px' }}>
        {/* Venue + status */}
        <div style={{ textAlign: 'center', marginBottom: '12px' }}>
          {(match.venue || match.city) && (
            <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px', lineHeight: 1.5 }}>
              {match.city && <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{match.city}</span>}
              {match.city && match.venue && <span style={{ color: 'rgba(255,255,255,0.3)' }}> · </span>}
              {match.venue}
            </p>
          )}
          {isLive ? (
            <LiveBadge clock={match.clock} />
          ) : isFinished ? (
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: 500, letterSpacing: '0.04em' }}>
              FULL TIME
            </span>
          ) : (
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>
              {formatMatchTime(match.date)}
            </span>
          )}
        </div>

        {/* Teams + score */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
          {/* Home */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '28px', lineHeight: 1 }}>{match.homeTeam.flagEmoji}</span>
              <div>
                <p style={{ fontSize: '15px', fontWeight: 800, color: '#fff', lineHeight: 1, letterSpacing: '-0.01em' }}>
                  {match.homeTeam.abbreviation}
                </p>
                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>
                  {match.homeTeam.name}
                </p>
              </div>
            </div>
            {(isLive || isFinished) && <GoalList match={match} side="home" />}
          </div>

          {/* Score */}
          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', paddingTop: '2px' }}>
            {isLive || isFinished ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '44px', fontWeight: 900, color: '#fff', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                  {match.homeScore}
                </span>
                <span style={{ fontSize: '20px', color: 'rgba(255,255,255,0.4)', fontWeight: 300 }}>–</span>
                <span style={{ fontSize: '44px', fontWeight: 900, color: '#fff', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                  {match.awayScore}
                </span>
              </div>
            ) : (
              <span style={{ fontSize: '20px', color: 'rgba(255,255,255,0.5)', fontWeight: 300, letterSpacing: '0.1em', padding: '8px 0' }}>
                vs
              </span>
            )}
            {isLive && match.statusDetail && (
              <span style={{ fontSize: '10px', color: 'rgba(74,222,128,0.7)', letterSpacing: '0.03em' }}>
                {match.statusDetail}
              </span>
            )}
          </div>

          {/* Away */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexDirection: 'row-reverse' }}>
              <span style={{ fontSize: '28px', lineHeight: 1 }}>{match.awayTeam.flagEmoji}</span>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '15px', fontWeight: 800, color: '#fff', lineHeight: 1, letterSpacing: '-0.01em' }}>
                  {match.awayTeam.abbreviation}
                </p>
                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>
                  {match.awayTeam.name}
                </p>
              </div>
            </div>
            {(isLive || isFinished) && <GoalList match={match} side="away" />}
          </div>
        </div>

        {/* Bottom row: channels + mute */}
        <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <ChannelBadge broadcasts={match.broadcasts} />

          {match.status === 'pre' && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={isUnsubscribed ? onResubscribe : onUnsubscribe}
                style={{
                  fontSize: '11px',
                  padding: '5px 12px',
                  borderRadius: '20px',
                  border: isUnsubscribed
                    ? '1px solid rgba(74,222,128,0.45)'
                    : '1px solid rgba(255,255,255,0.15)',
                  color: isUnsubscribed ? 'rgba(74,222,128,0.95)' : 'rgba(255,255,255,0.65)',
                  background: 'rgba(0,0,0,0.55)',
                  backdropFilter: 'blur(6px)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  letterSpacing: '0.02em',
                }}
              >
                {isUnsubscribed ? '🔔 Unmute' : '🔕 Mute alerts'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
