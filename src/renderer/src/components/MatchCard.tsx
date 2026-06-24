import type { Match } from '../types'
import LiveBadge from './LiveBadge'
import ChannelBadge from './ChannelBadge'

interface Props {
  match: Match
  isUnsubscribed: boolean
  onToggle: () => void
  onClick?: () => void
  onTeamClick?: (teamId: string, teamName: string, flagEmoji: string) => void
  onPlayerClick?: (playerId: string, playerName: string, position: string, teamFlag: string, teamAbbr: string) => void
  dimmed?: boolean
  favoriteTeams?: string[]
}

function fmtML(ml: number): string {
  if (!ml) return '—'
  return ml > 0 ? `+${ml}` : `${ml}`
}

function formatMatchTime(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })
}

function GoalList({ match, side, teamFlag, teamAbbr, onPlayerClick }: {
  match: Match; side: 'home' | 'away'
  teamFlag: string; teamAbbr: string
  onPlayerClick?: (playerId: string, playerName: string, position: string, teamFlag: string, teamAbbr: string) => void
}) {
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
        <span
          key={i}
          onClick={g.playerId && onPlayerClick ? (e) => { e.stopPropagation(); onPlayerClick(g.playerId!, g.playerName, 'F', teamFlag, teamAbbr) } : undefined}
          style={{
            fontSize: '11px', color: 'rgba(255,255,255,0.78)', lineHeight: 1.3,
            cursor: g.playerId && onPlayerClick ? 'pointer' : 'default',
            textDecoration: g.playerId && onPlayerClick ? 'underline' : 'none',
            textDecorationColor: 'rgba(255,255,255,0.25)',
          }}
        >
          ⚽ {g.playerName} {g.clock}{g.isPenalty ? ' (P)' : g.isOwnGoal ? ' (OG)' : ''}
        </span>
      ))}
    </div>
  )
}

export default function MatchCard({ match, isUnsubscribed, onToggle, onClick, onTeamClick, onPlayerClick, dimmed, favoriteTeams }: Props) {
  const isLive = match.status === 'in'
  const isFinished = match.status === 'post'
  const isHomeFav = !!favoriteTeams?.length && favoriteTeams.includes(match.homeTeam.abbreviation)
  const isAwayFav = !!favoriteTeams?.length && favoriteTeams.includes(match.awayTeam.abbreviation)
  const isFavorite = isHomeFav || isAwayFav
  const homeWins = isFinished && match.homeScore > match.awayScore
  const awayWins = isFinished && match.awayScore > match.homeScore
  const homePhoto = match.homeTeam.starPlayerPhoto || match.homeTeam.teamLogo
  const awayPhoto = match.awayTeam.starPlayerPhoto || match.awayTeam.teamLogo

  const cardBorder = isFavorite
    ? '1px solid rgba(251,191,36,0.45)'
    : isLive
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
        boxShadow: isFavorite
          ? '0 0 0 1px rgba(251,191,36,0.15), 0 4px 20px rgba(251,191,36,0.1), 0 2px 8px rgba(0,0,0,0.4)'
          : isLive
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
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', opacity: awayWins ? 0.55 : 1, transition: 'opacity 0.15s' }}>
            <button
              onClick={(e) => { e.stopPropagation(); onTeamClick?.(match.homeTeam.id, match.homeTeam.name, match.homeTeam.flagEmoji) }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', padding: 0, cursor: onTeamClick && match.homeTeam.id ? 'pointer' : 'default', textAlign: 'left', fontFamily: 'inherit' }}
            >
              {match.homeTeam.flagEmoji === '🏳️' && match.homeTeam.teamLogo
                ? <img src={match.homeTeam.teamLogo} style={{ width: '32px', height: '32px', objectFit: 'contain', flexShrink: 0 }} />
                : <span style={{ fontSize: '28px', lineHeight: 1 }}>{match.homeTeam.flagEmoji}</span>}
              <div>
                <p style={{ fontSize: '15px', fontWeight: 800, color: isHomeFav ? 'rgba(251,191,36,0.95)' : '#fff', lineHeight: 1, letterSpacing: '-0.01em', margin: 0 }}>
                  {match.homeTeam.abbreviation}
                </p>
                <p style={{ fontSize: '10px', color: isHomeFav ? 'rgba(251,191,36,0.55)' : 'rgba(255,255,255,0.6)', marginTop: '2px', margin: '2px 0 0' }}>
                  {match.homeTeam.name}
                </p>
              </div>
            </button>
            {(isLive || isFinished) && <GoalList match={match} side="home" teamFlag={match.homeTeam.flagEmoji} teamAbbr={match.homeTeam.abbreviation} onPlayerClick={onPlayerClick} />}
          </div>

          {/* Score */}
          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', paddingTop: '2px' }}>
            {isLive || isFinished ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  fontSize: '44px', fontWeight: 900, lineHeight: 1, fontVariantNumeric: 'tabular-nums',
                  color: homeWins ? 'rgba(74,222,128,0.95)' : awayWins ? 'rgba(255,255,255,0.35)' : '#fff',
                }}>
                  {match.homeScore}
                </span>
                <span style={{ fontSize: '20px', color: 'rgba(255,255,255,0.4)', fontWeight: 300 }}>–</span>
                <span style={{
                  fontSize: '44px', fontWeight: 900, lineHeight: 1, fontVariantNumeric: 'tabular-nums',
                  color: awayWins ? 'rgba(74,222,128,0.95)' : homeWins ? 'rgba(255,255,255,0.35)' : '#fff',
                }}>
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
            {isFinished && (homeWins || awayWins) && (
              <span style={{ fontSize: '9px', color: 'rgba(74,222,128,0.6)', fontWeight: 600, letterSpacing: '0.04em' }}>
                {homeWins ? match.homeTeam.name : match.awayTeam.name} WIN
              </span>
            )}
          </div>

          {/* Away */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', opacity: homeWins ? 0.55 : 1, transition: 'opacity 0.15s' }}>
            <button
              onClick={(e) => { e.stopPropagation(); onTeamClick?.(match.awayTeam.id, match.awayTeam.name, match.awayTeam.flagEmoji) }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', flexDirection: 'row-reverse', background: 'none', border: 'none', padding: 0, cursor: onTeamClick && match.awayTeam.id ? 'pointer' : 'default', fontFamily: 'inherit' }}
            >
              {match.awayTeam.flagEmoji === '🏳️' && match.awayTeam.teamLogo
                ? <img src={match.awayTeam.teamLogo} style={{ width: '32px', height: '32px', objectFit: 'contain', flexShrink: 0 }} />
                : <span style={{ fontSize: '28px', lineHeight: 1 }}>{match.awayTeam.flagEmoji}</span>}
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '15px', fontWeight: 800, color: isAwayFav ? 'rgba(251,191,36,0.95)' : '#fff', lineHeight: 1, letterSpacing: '-0.01em', margin: 0 }}>
                  {match.awayTeam.abbreviation}
                </p>
                <p style={{ fontSize: '10px', color: isAwayFav ? 'rgba(251,191,36,0.55)' : 'rgba(255,255,255,0.6)', marginTop: '2px', margin: '2px 0 0' }}>
                  {match.awayTeam.name}
                </p>
              </div>
            </button>
            {(isLive || isFinished) && <GoalList match={match} side="away" teamFlag={match.awayTeam.flagEmoji} teamAbbr={match.awayTeam.abbreviation} onPlayerClick={onPlayerClick} />}
          </div>
        </div>

        {/* Bottom row: channels + mute */}
        <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <ChannelBadge broadcasts={match.broadcasts} />

          {(match.status === 'pre' || match.status === 'in') && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              {match.status === 'pre' && match.odds ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', flexWrap: 'wrap', minWidth: 0 }}>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '9px', letterSpacing: '0.05em', textTransform: 'uppercase', flexShrink: 0 }}>DK</span>
                  <span style={{ color: match.odds.homeIsFavorite ? 'rgba(74,222,128,0.85)' : 'rgba(255,255,255,0.65)', flexShrink: 0 }}>
                    {match.homeTeam.abbreviation} <strong>{fmtML(match.odds.homeMoneyLine)}</strong>
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.25)' }}>·</span>
                  <span style={{ color: 'rgba(255,255,255,0.65)', flexShrink: 0 }}>Draw <strong>{fmtML(match.odds.drawMoneyLine)}</strong></span>
                  <span style={{ color: 'rgba(255,255,255,0.25)' }}>·</span>
                  <span style={{ color: !match.odds.homeIsFavorite ? 'rgba(74,222,128,0.85)' : 'rgba(255,255,255,0.65)', flexShrink: 0 }}>
                    {match.awayTeam.abbreviation} <strong>{fmtML(match.odds.awayMoneyLine)}</strong>
                  </span>
                  {match.odds.overUnder > 0 && (
                    <>
                      <span style={{ color: 'rgba(255,255,255,0.25)' }}>·</span>
                      <span style={{ color: 'rgba(255,255,255,0.65)', flexShrink: 0 }}>O/U <strong>{match.odds.overUnder}</strong></span>
                    </>
                  )}
                </div>
              ) : <div />}
              <button
                onClick={(e) => { e.stopPropagation(); onToggle() }}
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
                  flexShrink: 0,
                }}
              >
                {isUnsubscribed ? '🔔 Subscribe' : '🔕 Mute alerts'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
