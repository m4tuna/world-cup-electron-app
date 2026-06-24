import { useState, useCallback } from 'react'
import { PROVIDERS, CATEGORY_LABELS, getProviderByUrl } from '../lib/providers'
import { SOUND_GROUPS, SOUND_LABELS, playSound } from '../lib/sounds'
import { WC_TEAMS } from '../lib/teams'
import { LEAGUES, SPORT_GROUPS, getLeague } from '../lib/leagues'
import type { Settings, EventNotif } from '../types'

interface TeamInfo { id: string; abbreviation: string; name: string; logo?: string }

interface Props {
  settings: Settings
  onSetMinutes: (m: number) => void
  onSetSound: (e: boolean) => void
  onResetSubscriptions: () => void
  onSetWatchProvider: (url: string) => void
  onSetWatchMethod: (m: 'browser' | 'airplay') => void
  onSetNotifyEvent: (event: string, config: EventNotif) => void
  onSetFavoriteTeams: (abbrs: string[]) => void
  onSetPhoneNotifyEnabled: (v: boolean) => void
  onSetExpoPushToken: (token: string) => void
  onBack: () => void
  onSetActiveLeague: (id: string) => void
  onSetEnabledLeagues: (ids: string[]) => void
  onSetTeamSubscriptions: (subs: Record<string, string[]>) => void
}

const CATEGORIES = ['streaming', 'direct', 'cable'] as const

// ── Design tokens ─────────────────────────────────────────────────────
const CARD: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
  padding: '14px 16px',
}
const CARD_LABEL: React.CSSProperties = {
  fontSize: '11px', fontWeight: 600,
  color: 'rgba(255,255,255,0.4)',
  marginBottom: '10px',
  display: 'block',
}
const SECTION_HEADING: React.CSSProperties = {
  fontSize: '10px', fontWeight: 700,
  color: 'rgba(255,255,255,0.3)',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  margin: '4px 0 0',
}
const DIVIDER: React.CSSProperties = {
  height: '1px',
  background: 'rgba(255,255,255,0.06)',
  margin: '10px 0',
}
// ──────────────────────────────────────────────────────────────────────

function RadioDot({ selected }: { selected: boolean }) {
  return (
    <div style={{
      width: '15px', height: '15px', borderRadius: '50%', flexShrink: 0,
      border: `2px solid ${selected ? 'rgba(74,222,128,0.9)' : 'rgba(255,255,255,0.22)'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'border-color 0.12s',
    }}>
      {selected && <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'rgba(74,222,128,0.9)' }} />}
    </div>
  )
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        position: 'relative', width: '40px', height: '22px', borderRadius: '11px',
        background: value ? 'rgba(34,197,94,0.9)' : 'rgba(255,255,255,0.15)',
        border: 'none', cursor: 'pointer', flexShrink: 0, transition: 'background 0.15s',
      }}
    >
      <span style={{
        position: 'absolute', top: '2px',
        left: value ? '20px' : '2px',
        width: '18px', height: '18px', borderRadius: '50%',
        background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        transition: 'left 0.15s',
      }} />
    </button>
  )
}

function EventNotifCard({
  label, emoji, eventKey, config, onChange,
}: {
  label: string
  emoji: string
  eventKey: string
  config: EventNotif
  onChange: (c: EventNotif) => void
}) {
  function handlePreview() {
    if (config.sound && config.soundId !== 'none') playSound(config.soundId)
    window.api.previewNotification?.(eventKey)
  }

  return (
    <div style={CARD}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <span style={{ fontSize: '15px', lineHeight: 1 }}>{emoji}</span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>{label}</span>
        </div>
        <Toggle value={config.enabled} onChange={(v) => onChange({ ...config, enabled: v })} />
      </div>

      {config.enabled && (
        <>
          <div style={DIVIDER} />

          {/* Native banner */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Native banner</span>
            <Toggle value={config.native} onChange={(v) => onChange({ ...config, native: v })} />
          </div>

          {/* Sound toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Sound</span>
            <Toggle value={config.sound} onChange={(v) => onChange({ ...config, sound: v })} />
          </div>

          {/* Sound picker — grouped dropdown */}
          {config.sound && (
            <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', alignItems: 'center' }}>
              <select
                value={config.soundId}
                onChange={(e) => {
                  const sid = e.target.value
                  onChange({ ...config, soundId: sid })
                  playSound(sid)
                }}
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.14)',
                  borderRadius: '8px',
                  color: 'rgba(255,255,255,0.85)',
                  fontSize: '12px',
                  fontFamily: 'inherit',
                  padding: '7px 10px',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {SOUND_GROUPS.map((group) => (
                  <optgroup key={group.label} label={group.label} style={{ background: '#1a1c22', color: 'rgba(255,255,255,0.4)' }}>
                    {group.ids.map((sid) => (
                      <option key={sid} value={sid} style={{ background: '#16181c', color: '#fff' }}>
                        {SOUND_LABELS[sid]}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          )}

          {/* Preview */}
          <button
            onClick={handlePreview}
            style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px', padding: '5px 12px',
              color: 'rgba(255,255,255,0.4)', fontSize: '11px',
              cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: '5px',
            }}
          >
            <svg width="9" height="9" viewBox="0 0 10 10" fill="currentColor">
              <polygon points="2,1 9,5 2,9" />
            </svg>
            Preview
          </button>
        </>
      )}
    </div>
  )
}

const WATCH_METHODS = [
  {
    id: 'browser' as const,
    label: 'Browser',
    desc: 'Opens in your default browser',
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ),
  },
  {
    id: 'airplay' as const,
    label: 'AirPlay',
    desc: 'Opens in Safari — tap the AirPlay icon in the video player to cast to Apple TV',
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
        <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
        <line x1="12" y1="20" x2="12.01" y2="20"/>
      </svg>
    ),
  },
]

const DEFAULT_NOTIF: EventNotif = { enabled: false, native: true, sound: true, soundId: 'airhorn' }

export default function SettingsPanel({
  settings, onSetMinutes, onSetSound, onResetSubscriptions,
  onSetWatchProvider, onSetWatchMethod, onSetNotifyEvent, onSetFavoriteTeams,
  onSetPhoneNotifyEnabled, onSetExpoPushToken, onBack,
  onSetActiveLeague, onSetEnabledLeagues, onSetTeamSubscriptions,
}: Props) {
  const watchMethod = settings.watchMethod ?? 'browser'
  const watchProviderUrl = settings.watchProviderUrl ?? 'https://watch.spectrum.net'
  const selectedProvider = getProviderByUrl(watchProviderUrl)

  const notifyGoal = settings.notifyGoal ?? { ...DEFAULT_NOTIF, enabled: true, soundId: 'airhorn' }
  const notifyHalfTime = settings.notifyHalfTime ?? { ...DEFAULT_NOTIF, soundId: 'chime' }
  const notifyFullTime = settings.notifyFullTime ?? { ...DEFAULT_NOTIF, enabled: true, soundId: 'chime' }

  const activeLeagueId = settings.activeLeagueId ?? 'fifa.world'
  const activeLeague = getLeague(activeLeagueId)
  const enabledLeagueIds = settings.enabledLeagueIds ?? ['fifa.world']

  // Per-league team cache: fetched from ESPN on demand
  const [leagueTeams, setLeagueTeams] = useState<Record<string, TeamInfo[]>>({})
  const [loadingTeams, setLoadingTeams] = useState<Record<string, boolean>>({})
  const [expandedLeagues, setExpandedLeagues] = useState<Record<string, boolean>>({})

  const ensureTeams = useCallback(async (leagueId: string) => {
    if (leagueId === 'fifa.world' || leagueTeams[leagueId] || loadingTeams[leagueId]) return
    const league = LEAGUES.find(l => l.id === leagueId)
    if (!league) return
    setLoadingTeams(p => ({ ...p, [leagueId]: true }))
    const teams = await window.api.getTeams(league.espnSport, league.espnLeague)
    setLeagueTeams(p => ({ ...p, [leagueId]: teams as TeamInfo[] }))
    setLoadingTeams(p => ({ ...p, [leagueId]: false }))
  }, [leagueTeams, loadingTeams])

  const toggleExpanded = useCallback((leagueId: string) => {
    const next = !expandedLeagues[leagueId]
    setExpandedLeagues(p => ({ ...p, [leagueId]: next }))
    if (next) ensureTeams(leagueId)
  }, [expandedLeagues, ensureTeams])

  const getSelectedTeams = (leagueId: string): string[] =>
    leagueId === 'fifa.world'
      ? (settings.favoriteTeams ?? [])
      : ((settings.teamSubscriptions ?? {})[leagueId] ?? [])

  const setSelectedTeams = (leagueId: string, abbrs: string[]) => {
    if (leagueId === 'fifa.world') {
      onSetFavoriteTeams(abbrs)
    } else {
      onSetTeamSubscriptions({ ...(settings.teamSubscriptions ?? {}), [leagueId]: abbrs })
    }
  }

  return (
    <div style={{ padding: '14px 20px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

      {/* Back */}
      <button
        onClick={onBack}
        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '12px', padding: '0 0 6px', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'inherit', alignSelf: 'flex-start' }}
      >
        ← Back
      </button>

      {/* ── LEAGUE SUBSCRIPTIONS ── */}
      <p style={SECTION_HEADING}>League Subscriptions</p>
      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', margin: '-6px 0 0', lineHeight: 1.5 }}>
        Enable leagues and pick your favorite teams. Only matches with selected teams will notify.
      </p>

      {SPORT_GROUPS.map((group) => {
        const groupLeagues = LEAGUES.filter(l => l.sport === group.sport)
        return (
          <div key={group.sport}>
            <p style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '4px 0 5px' }}>{group.label}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {groupLeagues.map((league) => {
                const isEnabled = enabledLeagueIds.includes(league.id)
                const isActive = league.id === activeLeagueId
                const isExpanded = !!expandedLeagues[league.id]
                const selectedTeams = getSelectedTeams(league.id)
                const teamsForLeague = league.id === 'fifa.world' ? null : (leagueTeams[league.id] ?? [])

                return (
                  <div key={league.id} style={{ ...CARD, padding: '10px 12px' }}>
                    {/* Row: icon / name / count / view / expand / toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '15px', lineHeight: 1, flexShrink: 0 }}>{league.icon}</span>
                      <span style={{ fontSize: '12px', color: isActive ? '#fff' : 'rgba(255,255,255,0.7)', flex: 1, fontWeight: isActive ? 600 : 400 }}>
                        {league.name}
                        {isActive && <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', fontWeight: 400, marginLeft: '5px' }}>active</span>}
                      </span>
                      {selectedTeams.length > 0 && (
                        <span style={{ fontSize: '10px', color: 'rgba(74,222,128,0.7)', fontWeight: 600, flexShrink: 0 }}>
                          {selectedTeams.length} team{selectedTeams.length !== 1 ? 's' : ''}
                        </span>
                      )}
                      {!isActive && (
                        <button
                          onClick={() => onSetActiveLeague(league.id)}
                          style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}
                        >View</button>
                      )}
                      {isEnabled && (
                        <button
                          onClick={() => toggleExpanded(league.id)}
                          style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', lineHeight: 1, flexShrink: 0 }}
                        >{isExpanded ? '▴' : '▾'}</button>
                      )}
                      <Toggle
                        value={isEnabled}
                        onChange={(v) => {
                          const next = v
                            ? [...new Set([...enabledLeagueIds, league.id])]
                            : enabledLeagueIds.filter(id => id !== league.id && id !== activeLeagueId)
                          onSetEnabledLeagues(next.length ? next : [activeLeagueId])
                          if (v) { toggleExpanded(league.id) }
                        }}
                      />
                    </div>

                    {/* Team picker (expanded, enabled only) */}
                    {isEnabled && isExpanded && (
                      <div style={{ marginTop: '10px', borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '10px' }}>
                        {/* Selected pills */}
                        {selectedTeams.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '8px' }}>
                            {selectedTeams.map((abbr) => {
                              const wcTeam = league.id === 'fifa.world' ? WC_TEAMS.find(t => t.abbr === abbr) : null
                              const espnTeam = teamsForLeague?.find(t => t.abbreviation === abbr)
                              return (
                                <div key={abbr} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '3px 8px 3px 6px', borderRadius: '20px', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.35)' }}>
                                  {wcTeam && <span style={{ fontSize: '13px', lineHeight: 1 }}>{wcTeam.flag}</span>}
                                  {espnTeam?.logo && <img src={espnTeam.logo} style={{ width: '16px', height: '16px', objectFit: 'contain' }} />}
                                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(251,191,36,0.9)' }}>{abbr}</span>
                                  <button
                                    onClick={() => setSelectedTeams(league.id, selectedTeams.filter(a => a !== abbr))}
                                    style={{ background: 'none', border: 'none', padding: '0 0 0 2px', cursor: 'pointer', color: 'rgba(251,191,36,0.45)', fontSize: '11px', lineHeight: 1, fontFamily: 'inherit' }}
                                  >✕</button>
                                </div>
                              )
                            })}
                          </div>
                        )}

                        {/* Add team dropdown */}
                        {league.id === 'fifa.world' ? (
                          <select
                            value=""
                            onChange={(e) => { if (e.target.value) setSelectedTeams(league.id, [...new Set([...selectedTeams, e.target.value])]) }}
                            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontFamily: 'inherit', padding: '7px 10px', cursor: 'pointer', outline: 'none' }}
                          >
                            <option value="">+ Add team…</option>
                            {WC_TEAMS.filter(t => !selectedTeams.includes(t.abbr)).map(t => (
                              <option key={t.abbr} value={t.abbr} style={{ background: '#16181c', color: '#fff' }}>{t.flag} {t.name}</option>
                            ))}
                          </select>
                        ) : loadingTeams[league.id] ? (
                          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', margin: 0 }}>Loading teams…</p>
                        ) : (
                          <select
                            value=""
                            onChange={(e) => { if (e.target.value) setSelectedTeams(league.id, [...new Set([...selectedTeams, e.target.value])]) }}
                            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontFamily: 'inherit', padding: '7px 10px', cursor: 'pointer', outline: 'none' }}
                          >
                            <option value="">+ Add team…</option>
                            {(teamsForLeague ?? []).filter(t => !selectedTeams.includes(t.abbreviation)).map(t => (
                              <option key={t.abbreviation} value={t.abbreviation} style={{ background: '#16181c', color: '#fff' }}>{t.name} ({t.abbreviation})</option>
                            ))}
                          </select>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* ── NOTIFICATIONS ── */}
      <p style={SECTION_HEADING}>Notifications</p>

      {/* Notify timing */}
      <div style={CARD}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>Notify before kickoff</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(74,222,128,0.9)' }}>{settings.notificationMinutes} min</span>
        </div>
        <input
          type="range" min="5" max="60" step="5"
          value={settings.notificationMinutes}
          onChange={(e) => onSetMinutes(Number(e.target.value))}
          style={{ width: '100%', accentColor: '#22c55e', cursor: 'pointer', display: 'block' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>5 min</span>
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>60 min</span>
        </div>
      </div>

      {/* Pre-match sound toggle */}
      <div style={{ ...CARD, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', margin: '0 0 3px' }}>Pre-match sound</p>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>Plays a whistle when a match is about to start</p>
        </div>
        <Toggle value={settings.soundEnabled} onChange={onSetSound} />
      </div>

      {/* Event notifications */}
      <EventNotifCard
        label={activeLeague.notifyOnScore ? `${activeLeague.scoreLabel} Scored` : `Score Change (${activeLeague.scoreEmoji} per-point disabled)`}
        emoji={activeLeague.scoreEmoji}
        eventKey="notifyGoal"
        config={notifyGoal}
        onChange={(c) => onSetNotifyEvent('notifyGoal', c)}
      />
      <EventNotifCard
        label="Half Time"
        emoji="🕐"
        eventKey="notifyHalfTime"
        config={notifyHalfTime}
        onChange={(c) => onSetNotifyEvent('notifyHalfTime', c)}
      />
      <EventNotifCard
        label="Full Time"
        emoji="🏁"
        eventKey="notifyFullTime"
        config={notifyFullTime}
        onChange={(c) => onSetNotifyEvent('notifyFullTime', c)}
      />

      {/* ── PHONE NOTIFICATIONS ── */}
      <div style={CARD}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: settings.phoneNotifyEnabled ? '12px' : '0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>📱</span>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.8)', margin: 0 }}>Phone notifications</p>
              <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', margin: '2px 0 0' }}>via Expo Go — native iOS push</p>
            </div>
          </div>
          <Toggle value={settings.phoneNotifyEnabled ?? false} onChange={onSetPhoneNotifyEnabled} />
        </div>

        {settings.phoneNotifyEnabled && (
          <>
            {/* Setup instructions */}
            <div style={{ background: 'rgba(74,222,128,0.04)', border: '1px solid rgba(74,222,128,0.15)', borderRadius: '8px', padding: '10px 12px', marginBottom: '10px' }}>
              <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(74,222,128,0.7)', margin: '0 0 6px' }}>Setup (one-time)</p>
              <ol style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <li style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
                  In <span style={{ fontFamily: 'monospace', color: 'rgba(255,255,255,0.65)' }}>phone-companion/</span> run{' '}
                  <span style={{ fontFamily: 'monospace', color: 'rgba(74,222,128,0.8)' }}>npx eas-cli init</span> then{' '}
                  <span style={{ fontFamily: 'monospace', color: 'rgba(74,222,128,0.8)' }}>npx expo start</span>
                </li>
                <li style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>Scan the QR code with Expo Go on your iPhone</li>
                <li style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>Copy the token shown in the app and paste it below</li>
              </ol>
            </div>

            {/* Token input */}
            <div style={{ marginBottom: '10px' }}>
              <p style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.35)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Expo push token</p>
              <input
                type="text"
                placeholder="ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
                value={settings.expoPushToken ?? ''}
                onChange={(e) => onSetExpoPushToken(e.target.value)}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)',
                  borderRadius: '8px', color: '#fff', fontSize: '11px', fontFamily: 'monospace',
                  padding: '7px 10px', outline: 'none',
                }}
              />
            </div>

            <div style={DIVIDER} />

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => window.api.testPhoneNotification?.()}
                disabled={!settings.expoPushToken}
                style={{
                  fontSize: '11px', padding: '5px 12px', borderRadius: '8px',
                  border: settings.expoPushToken ? '1px solid rgba(74,222,128,0.4)' : '1px solid rgba(255,255,255,0.08)',
                  background: settings.expoPushToken ? 'rgba(74,222,128,0.07)' : 'transparent',
                  color: settings.expoPushToken ? 'rgba(74,222,128,0.85)' : 'rgba(255,255,255,0.2)',
                  cursor: settings.expoPushToken ? 'pointer' : 'default', fontFamily: 'inherit',
                }}
              >Send test</button>
            </div>
          </>
        )}
      </div>

      {/* Notification permissions link */}
      <button
        onClick={() => window.api.openNotificationPrefs?.()}
        style={{
          background: 'none', border: 'none', padding: 0,
          color: 'rgba(255,255,255,0.25)', fontSize: '11px',
          cursor: 'pointer', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', gap: '4px',
          alignSelf: 'flex-start',
        }}
      >
        Manage notification permissions →
      </button>

      {/* ── WATCH ── */}
      <p style={{ ...SECTION_HEADING, marginTop: '6px' }}>Watch</p>

      {/* Launch method */}
      <div style={CARD}>
        <span style={CARD_LABEL}>Launch method</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {WATCH_METHODS.map((m) => {
            const sel = watchMethod === m.id
            return (
              <button
                key={m.id}
                onClick={() => onSetWatchMethod(m.id)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '9px',
                  border: sel ? '1px solid rgba(74,222,128,0.35)' : '1px solid rgba(255,255,255,0.07)',
                  background: sel ? 'rgba(74,222,128,0.07)' : 'rgba(255,255,255,0.02)',
                  cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', width: '100%',
                  transition: 'background 0.1s, border-color 0.1s',
                }}
              >
                <div style={{ paddingTop: '1px', flexShrink: 0 }}>
                  <RadioDot selected={sel} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '3px' }}>
                    <span style={{ color: sel ? 'rgba(74,222,128,0.85)' : 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center' }}>
                      {m.icon}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: sel ? 700 : 500, color: sel ? 'rgba(74,222,128,0.95)' : 'rgba(255,255,255,0.75)' }}>
                      {m.label}
                    </span>
                  </div>
                  <p style={{ fontSize: '11px', color: sel ? 'rgba(74,222,128,0.5)' : 'rgba(255,255,255,0.28)', margin: 0, lineHeight: 1.4 }}>
                    {m.desc}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* TV Provider */}
      <div style={CARD}>
        <span style={CARD_LABEL}>TV Provider</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {CATEGORIES.map((cat) => {
            const group = PROVIDERS.filter((p) => p.category === cat)
            if (!group.length) return null
            return (
              <div key={cat}>
                <p style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.09em', margin: '0 0 6px' }}>
                  {CATEGORY_LABELS[cat]}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '5px' }}>
                  {group.map((p) => {
                    const sel = watchProviderUrl === p.url
                    return (
                      <button
                        key={p.id}
                        onClick={() => onSetWatchProvider(p.url)}
                        style={{
                          position: 'relative', padding: '8px 8px 7px',
                          borderRadius: '9px', fontFamily: 'inherit',
                          border: sel ? '1px solid rgba(74,222,128,0.4)' : '1px solid rgba(255,255,255,0.08)',
                          background: sel ? 'rgba(74,222,128,0.08)' : 'rgba(255,255,255,0.03)',
                          cursor: 'pointer', textAlign: 'left',
                          transition: 'background 0.1s, border-color 0.1s',
                        }}
                      >
                        <div style={{ position: 'absolute', top: '7px', right: '7px' }}>
                          <RadioDot selected={sel} />
                        </div>
                        <p style={{ fontSize: '11px', fontWeight: 700, color: sel ? 'rgba(74,222,128,0.95)' : 'rgba(255,255,255,0.75)', margin: '0 0 2px', lineHeight: 1.2, paddingRight: '20px' }}>
                          {p.name}
                        </p>
                        <p style={{ fontSize: '9px', color: sel ? 'rgba(74,222,128,0.5)' : 'rgba(255,255,255,0.25)', margin: 0, lineHeight: 1.3 }}>
                          {p.channels}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
        {selectedProvider && (
          <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', marginTop: '10px', lineHeight: 1.4 }}>
            ✓ <span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>{selectedProvider.name}</span> — {selectedProvider.channels}
          </p>
        )}
      </div>

      {/* ── ALERTS ── */}
      <p style={{ ...SECTION_HEADING, marginTop: '6px' }}>Alerts</p>

      {/* Muted matches */}
      <div style={{ ...CARD, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', margin: '0 0 3px' }}>Muted matches</p>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>
            {settings.unsubscribedMatches.length === 0 && !(settings.subscribedMatches?.length)
              ? 'No manual overrides'
              : [
                  settings.unsubscribedMatches.length ? `${settings.unsubscribedMatches.length} muted` : '',
                  (settings.subscribedMatches?.length) ? `${settings.subscribedMatches.length} manually subscribed` : '',
                ].filter(Boolean).join(' · ')}
          </p>
        </div>
        {(settings.unsubscribedMatches.length > 0 || (settings.subscribedMatches?.length ?? 0) > 0) && (
          <button
            onClick={onResetSubscriptions}
            style={{
              fontSize: '11px', color: 'rgba(239,68,68,0.8)',
              border: '1px solid rgba(239,68,68,0.25)',
              padding: '5px 12px', borderRadius: '8px',
              background: 'transparent', cursor: 'pointer',
              fontFamily: 'inherit', flexShrink: 0,
              transition: 'border-color 0.1s, color 0.1s',
            }}
          >
            Reset all
          </button>
        )}
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px', textAlign: 'center' }}>
        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.18)', margin: '0 0 3px' }}>{activeLeague.name}</p>
        <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.12)', margin: 0 }}>Data via ESPN</p>
      </div>

    </div>
  )
}
