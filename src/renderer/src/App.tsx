import { useEffect, useState, useRef, useCallback } from 'react'
import { useMatchStore } from './store/matchStore'
import { useMatches } from './hooks/useMatches'
import MatchCard from './components/MatchCard'
import MatchDetail from './components/MatchDetail'
import SettingsPanel from './components/SettingsPanel'
import GroupStandings from './components/GroupStandings'
import Bracket from './components/Bracket'
import WatchNowCard from './components/SpectrumQR'
import { getProviderByUrl } from './lib/providers'
import CastPanel from './components/CastPanel'
import TeamPage from './components/TeamPage'
import PlayerPage from './components/PlayerPage'
import type { Match, CastDevice } from './types'

type NavEntry =
  | { type: 'main' }
  | { type: 'settings' }
  | { type: 'match'; matchId: string }
  | { type: 'team'; teamId: string; teamName: string; flagEmoji: string }
  | { type: 'player'; playerId: string; playerName: string; position: string; teamFlag: string; teamAbbr: string }

const TOURNAMENT_START = new Date('2026-06-11T00:00:00')
const TOURNAMENT_END = new Date('2026-07-19T23:59:59')

function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString()
}

function fmtDateParam(d: Date): string {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
}

type Tab = 'live' | 'schedule' | 'standings' | 'bracket'
const TABS: { id: Tab; label: string }[] = [
  { id: 'live', label: 'Today' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'standings', label: 'Standings' },
  { id: 'bracket', label: 'Bracket' },
]

const CARET_H = 10   // px above the card

export default function App() {
  useMatches()
  const { todayMatches, upcomingMatches, settings, activeTab, setActiveTab, setSettings } = useMatchStore()
  const [caretX, setCaretX] = useState(250)
  const [castDevices, setCastDevices] = useState<CastDevice[]>([])
  const [matchesLoading, setMatchesLoading] = useState(true)
  const [navStack, setNavStack] = useState<NavEntry[]>([{ type: 'main' }])
  const current = navStack[navStack.length - 1]
  const push = useCallback((e: NavEntry) => setNavStack(s => [...s, e]), [])
  const back = useCallback(() => setNavStack(s => s.length > 1 ? s.slice(0, -1) : s), [])
  const [scheduleDate, setScheduleDate] = useState<Date>(() => {
    const d = new Date(); d.setDate(d.getDate() + 1); return d
  })
  const [scheduleDayMatches, setScheduleDayMatches] = useState<Match[] | null>(null)
  const [scheduleDayLoading, setScheduleDayLoading] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(() => new Date(2026, 5, 1))
  const calendarRef = useRef<HTMLDivElement>(null)
  const calendarBtnRef = useRef<HTMLButtonElement>(null)
  const fixedRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (_: unknown, x: number) => {
      setCaretX(x)
      // Trigger a fresh cast scan every time the panel opens
      window.api.scanCastDevices()
    }
    window.electron?.ipcRenderer?.on('panel:caret', handler)
    return () => window.electron?.ipcRenderer?.removeListener('panel:caret', handler)
  }, [])

  // Mark loading done when first match data arrives from the poller
  useEffect(() => {
    if (todayMatches.length > 0) setMatchesLoading(false)
  }, [todayMatches.length])
  // Fallback: stop loading after 8s regardless (handles genuine "no matches today")
  useEffect(() => {
    const t = setTimeout(() => setMatchesLoading(false), 8000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    window.api.scanCastDevices()
    window.api.getCastDevices().then((d) => { if ((d as CastDevice[]).length) setCastDevices(d as CastDevice[]) })
    const unsub = window.api.onCastDevices((d) => setCastDevices(d as CastDevice[]))
    const poll = setInterval(async () => {
      const d = await window.api.getCastDevices()
      if ((d as CastDevice[]).length) setCastDevices(d as CastDevice[])
    }, 15_000)
    return () => { unsub(); clearInterval(poll) }
  }, [])

  useEffect(() => {
    if (isSameDay(scheduleDate, new Date())) {
      setScheduleDayMatches(null)
      setScheduleDayLoading(false)
      return
    }
    setScheduleDayLoading(true)
    setScheduleDayMatches(null)
    window.api.getMatchesByDate(fmtDateParam(scheduleDate)).then((data) => {
      setScheduleDayMatches(data as Match[])
      setScheduleDayLoading(false)
    }).catch(() => {
      setScheduleDayMatches([])
      setScheduleDayLoading(false)
    })
  }, [scheduleDate])

  useEffect(() => { setShowCalendar(false) }, [activeTab, current.type])

  useEffect(() => {
    if (!showCalendar) return
    const handler = (e: MouseEvent) => {
      const t = e.target as Node
      if (calendarBtnRef.current?.contains(t) || calendarRef.current?.contains(t)) return
      setShowCalendar(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showCalendar])

  const liveMatches = todayMatches.filter((m) => m.status === 'in')
  const todayPre = todayMatches.filter((m) => m.status === 'pre')
  const todayPost = todayMatches.filter((m) => m.status === 'post')
  useEffect(() => {
    if (liveMatches.length > 0 && activeTab === 'schedule' && current.type === 'main') setActiveTab('live')
  }, [liveMatches.length])

  const handleUnsubscribe = (id: string) => window.api.unsubscribeMatch(id)
  const handleResubscribe = (id: string) => window.api.resubscribeMatch(id)
  const handleSetMinutes = (m: number) => { window.api.setNotificationMinutes(m); setSettings({ ...settings, notificationMinutes: m }) }
  const handleSetSound = (e: boolean) => { window.api.setSoundEnabled(e); setSettings({ ...settings, soundEnabled: e }) }
  const handleResetSubs = () => { window.api.resetSubscriptions(); setSettings({ ...settings, unsubscribedMatches: [] }) }
  const handleSetWatchProvider = (url: string) => { window.api.setWatchProviderUrl(url); setSettings({ ...settings, watchProviderUrl: url }) }
  const handleSetWatchMethod = (m: 'browser' | 'airplay') => { window.api.setWatchMethod(m); setSettings({ ...settings, watchMethod: m }) }

  const watchProvider = getProviderByUrl(settings.watchProviderUrl ?? '')
  const watchProviderName = watchProvider?.name ?? 'Watch Live'
  const watchMethod = settings.watchMethod ?? 'browser'

  const handleTeamClick = useCallback((teamId: string, teamName: string, flagEmoji: string) => {
    if (teamId) push({ type: 'team', teamId, teamName, flagEmoji })
  }, [push])
  const handlePlayerClick = useCallback((playerId: string, playerName: string, position: string, teamFlag: string, teamAbbr: string) => {
    if (playerId) push({ type: 'player', playerId, playerName, position, teamFlag, teamAbbr })
  }, [push])

  const isScheduleToday = isSameDay(scheduleDate, new Date())
  const scheduleDisplayMatches = isScheduleToday
    ? [...liveMatches, ...todayPre, ...todayPost]
    : scheduleDayMatches ?? []
  const scheduleIsLoading = isScheduleToday ? matchesLoading : scheduleDayLoading

  const selectedMatchId = current.type === 'match' ? current.matchId : null
  const selectedMatch = selectedMatchId
    ? [...todayMatches, ...upcomingMatches, ...(scheduleDayMatches ?? [])].find((m) => m.id === selectedMatchId) ?? null
    : null

  const castingDevice = castDevices.find((d) => d.status?.isPlaying) ?? null
  const isCasting = !!castingDevice
  const castDeviceName = castingDevice?.name ?? null

  // ── Calendar grid ─────────────────────────────────────────────
  const calYear = calendarMonth.getFullYear()
  const calMonthIdx = calendarMonth.getMonth()
  const calFirstDow = new Date(calYear, calMonthIdx, 1).getDay()
  const calDaysInMonth = new Date(calYear, calMonthIdx + 1, 0).getDate()
  const calCells: (Date | null)[] = []
  for (let i = 0; i < calFirstDow; i++) calCells.push(null)
  for (let d = 1; d <= calDaysInMonth; d++) calCells.push(new Date(calYear, calMonthIdx, d))
  const calToday = new Date()

  // ── Shared style constants ─────────────────────────────────────
  const PAD = 20
  const CARD_BG = 'rgba(8, 8, 12, 0.98)'
  const BLUR = 'blur(28px) saturate(180%)'

  // Resize window: detail pages + tall tabs fill to screen height; live tab fits content
  useEffect(() => {
    if (current.type !== 'main' || activeTab === 'standings' || activeTab === 'bracket' || activeTab === 'schedule') {
      window.api.resizePanel?.(9999)
    } else {
      const fixedH = fixedRef.current?.offsetHeight ?? 0
      const contentH = scrollRef.current?.scrollHeight ?? 0
      window.api.resizePanel?.(CARET_H + fixedH + contentH + 6)
    }
  }, [current.type, activeTab, todayMatches.length, upcomingMatches.length, castDevices.length])

  useEffect(() => {
    window.api.setPanelWidth?.(activeTab === 'bracket' ? 940 : 500)
  }, [activeTab])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', background: 'transparent' }}>

      {/* ── Caret ── */}
      <div style={{ flexShrink: 0, height: `${CARET_H}px`, position: 'relative', overflow: 'visible', pointerEvents: 'none' }}>
        {/* Shadow behind caret so it reads against the desktop */}
        <div style={{
          position: 'absolute',
          left: caretX - 8,
          top: 2,
          width: 16,
          height: 16,
          background: CARD_BG,
          transform: 'rotate(45deg)',
          borderRadius: '3px 0 0 0',
          border: '1px solid rgba(255,255,255,0.13)',
          borderBottom: 'none',
          borderRight: 'none',
          boxShadow: '-2px -2px 6px rgba(0,0,0,0.25)',
        }} />
      </div>

      {/* ── Card ── */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 'calc(100vh - 14px)',
        background: CARD_BG,
        backdropFilter: BLUR,
        WebkitBackdropFilter: BLUR,
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.11)',
        boxShadow: '0 12px 48px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.3)',
        overflow: 'hidden',
        margin: '0 2px 2px',
      }}>

        {/* ── Fixed section (header + optional tabs) ── */}
        <div ref={fixedRef} style={{ flexShrink: 0 }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `14px ${PAD}px 10px` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
            <span style={{ fontSize: '18px' }}>⚽</span>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#fff', lineHeight: 1, letterSpacing: '-0.015em', margin: 0 }}>World Cup 2026</p>
              <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '2px', margin: 0 }}>USA · Canada · Mexico</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {liveMatches.length > 0 && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.28)',
                padding: '4px 9px', borderRadius: '20px', flexShrink: 0,
              }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#ef4444', display: 'block', flexShrink: 0 }} />
                <span style={{ fontSize: '11px', color: '#f87171', fontWeight: 600, whiteSpace: 'nowrap' }}>{liveMatches.length} Live</span>
              </div>
            )}
            {/* Cast button — shows device name when casting */}
            <button
              onClick={() => !isCasting && window.api.openSpectrum()}
              title={isCasting ? `Casting to ${castDeviceName ?? 'TV'}` : 'Watch on Spectrum TV'}
              style={{
                background: isCasting ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.06)',
                border: isCasting ? '1px solid rgba(167,139,250,0.35)' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                height: '30px',
                width: isCasting ? 'auto' : '30px',
                padding: isCasting ? '0 10px 0 8px' : '0',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                cursor: isCasting ? 'default' : 'pointer',
                flexShrink: 0,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isCasting ? '#a78bfa' : 'rgba(255,255,255,0.55)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 16.1A5 5 0 0 1 5.9 20M2 12.05A9 9 0 0 1 9.95 20M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6" />
                <line x1="2" y1="20" x2="2.01" y2="20" />
              </svg>
              {isCasting && castDeviceName && (
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#a78bfa', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {castDeviceName}
                </span>
              )}
            </button>

            {/* Settings gear */}
            <button
              onClick={() => current.type === 'settings' ? back() : push({ type: 'settings' })}
              title="Settings"
              style={{
                background: current.type === 'settings' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)',
                border: current.type === 'settings' ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                height: '30px',
                width: '30px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={current.type === 'settings' ? '#fff' : 'rgba(255,255,255,0.55)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ── Tabs (only shown on main view) ── */}
        {current.type === 'main' && (
          <>
            <div style={{ display: 'flex', gap: '3px', padding: `0 ${PAD}px 10px` }}>
              {TABS.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                  flex: 1, padding: '5px 0', borderRadius: '7px', border: 'none',
                  fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                  background: activeTab === tab.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                }}>
                  {tab.id === 'live' && liveMatches.length > 0 && (
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#ef4444', display: 'block', flexShrink: 0 }} />
                  )}
                  {tab.label}
                </button>
              ))}
            </div>
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', margin: `0 ${PAD}px` }} />
          </>
        )}

        </div>{/* end fixedRef */}

        {/* ── Scrollable content ── */}
        <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>

          {current.type === 'player' ? (
            <PlayerPage
              playerId={current.playerId}
              playerName={current.playerName}
              position={current.position}
              teamFlag={current.teamFlag}
              teamAbbr={current.teamAbbr}
              onBack={back}
              onTeamClick={handleTeamClick}
            />
          ) : current.type === 'team' ? (
            <TeamPage
              teamId={current.teamId}
              teamName={current.teamName}
              flagEmoji={current.flagEmoji}
              onBack={back}
              onPlayerClick={handlePlayerClick}
            />
          ) : current.type === 'match' && selectedMatch ? (
            <MatchDetail
              match={selectedMatch}
              onBack={back}
              onTeamClick={handleTeamClick}
              onPlayerClick={handlePlayerClick}
            />
          ) : current.type === 'settings' ? (
            <>
              <SettingsPanel settings={settings} onSetMinutes={handleSetMinutes} onSetSound={handleSetSound} onResetSubscriptions={handleResetSubs} onSetWatchProvider={handleSetWatchProvider} onSetWatchMethod={handleSetWatchMethod} onBack={back} />
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', margin: '0 20px' }} />
              <CastPanel watchProviderName={watchProviderName} watchMethod={watchMethod} />
            </>
          ) : (<>

          {/* TODAY */}
          {activeTab === 'live' && (
            <div style={{ padding: `14px ${PAD}px 0`, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {liveMatches.length === 0 && todayPre.length === 0 && todayPost.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '40px' }}>⚽</span>
                  {matchesLoading ? (
                    <p style={{ color: 'rgba(255,255,255,0.22)', fontSize: '13px', margin: 0 }}>Loading matches…</p>
                  ) : (
                    <>
                      <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: '13px', margin: 0 }}>No matches today</p>
                      <button onClick={() => setActiveTab('schedule')} style={{ fontSize: '12px', color: 'rgba(74,222,128,0.8)', border: '1px solid rgba(74,222,128,0.25)', padding: '6px 14px', borderRadius: '8px', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', marginTop: '4px' }}>
                        View schedule →
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <>
                  {liveMatches.map((m) => (
                    <MatchCard key={m.id} match={m} isUnsubscribed={settings.unsubscribedMatches.includes(m.id)} onUnsubscribe={() => handleUnsubscribe(m.id)} onResubscribe={() => handleResubscribe(m.id)} onClick={() => push({ type: 'match', matchId: m.id })} onTeamClick={handleTeamClick} onPlayerClick={handlePlayerClick} />
                  ))}
                  {todayPre.map((m) => (
                    <MatchCard key={m.id} match={m} isUnsubscribed={settings.unsubscribedMatches.includes(m.id)} onUnsubscribe={() => handleUnsubscribe(m.id)} onResubscribe={() => handleResubscribe(m.id)} onClick={() => push({ type: 'match', matchId: m.id })} onTeamClick={handleTeamClick} onPlayerClick={handlePlayerClick} />
                  ))}
                  {todayPost.length > 0 && (
                    <>
                      <div style={{ fontSize: '9px', fontWeight: 600, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.1em', paddingLeft: '2px' }}>Final</div>
                      {todayPost.map((m) => (
                        <MatchCard key={m.id} match={m} isUnsubscribed={settings.unsubscribedMatches.includes(m.id)} onUnsubscribe={() => handleUnsubscribe(m.id)} onResubscribe={() => handleResubscribe(m.id)} onClick={() => push({ type: 'match', matchId: m.id })} onTeamClick={handleTeamClick} onPlayerClick={handlePlayerClick} dimmed />
                      ))}
                    </>
                  )}
                </>
              )}
              <div style={{ marginBottom: '8px' }}><WatchNowCard hidden={isCasting} watchProviderUrl={settings.watchProviderUrl ?? 'https://watch.spectrum.net'} watchMethod={watchMethod} /></div>
            </div>
          )}

          {/* SCHEDULE */}
          {activeTab === 'schedule' && (
            <div style={{ padding: `14px ${PAD}px 16px`, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Date navigation + calendar popover */}
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    onClick={() => setScheduleDate(prev => { const d = new Date(prev); d.setDate(d.getDate() - 1); return d })}
                    disabled={isSameDay(scheduleDate, TOURNAMENT_START)}
                    style={{
                      flexShrink: 0, width: '32px', height: '32px', borderRadius: '9px',
                      border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
                      color: isSameDay(scheduleDate, TOURNAMENT_START) ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.65)',
                      fontSize: '18px', lineHeight: 1,
                      cursor: isSameDay(scheduleDate, TOURNAMENT_START) ? 'default' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit',
                    }}
                  >‹</button>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>
                      {isScheduleToday ? 'Today' : scheduleDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </span>
                    {isScheduleToday ? (
                      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>
                        {scheduleDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                      </span>
                    ) : (
                      <button
                        onClick={() => setScheduleDate(new Date())}
                        style={{ fontSize: '10px', color: 'rgba(74,222,128,0.7)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
                      >← Today</button>
                    )}
                  </div>
                  <button
                    onClick={() => setScheduleDate(prev => { const d = new Date(prev); d.setDate(d.getDate() + 1); return d })}
                    disabled={isSameDay(scheduleDate, TOURNAMENT_END)}
                    style={{
                      flexShrink: 0, width: '32px', height: '32px', borderRadius: '9px',
                      border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
                      color: isSameDay(scheduleDate, TOURNAMENT_END) ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.65)',
                      fontSize: '18px', lineHeight: 1,
                      cursor: isSameDay(scheduleDate, TOURNAMENT_END) ? 'default' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit',
                    }}
                  >›</button>
                  {/* Calendar picker button */}
                  <button
                    ref={calendarBtnRef}
                    onClick={() => {
                      if (!showCalendar) setCalendarMonth(new Date(scheduleDate.getFullYear(), scheduleDate.getMonth(), 1))
                      setShowCalendar(s => !s)
                    }}
                    title="Pick a date"
                    style={{
                      flexShrink: 0, width: '32px', height: '32px', borderRadius: '9px',
                      border: showCalendar ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.1)',
                      background: showCalendar ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
                      color: showCalendar ? '#fff' : 'rgba(255,255,255,0.55)',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                  </button>
                </div>

                {/* Calendar popover */}
                {showCalendar && (
                  <div
                    ref={calendarRef}
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      left: 0, right: 0,
                      zIndex: 50,
                      background: 'rgba(14, 16, 22, 0.99)',
                      backdropFilter: 'blur(24px)',
                      WebkitBackdropFilter: 'blur(24px)',
                      border: '1px solid rgba(255,255,255,0.13)',
                      borderRadius: '14px',
                      padding: '14px',
                      boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
                    }}
                  >
                    {/* Month navigation */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <button
                        onClick={() => setCalendarMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                        disabled={calMonthIdx === 5}
                        style={{
                          width: '26px', height: '26px', borderRadius: '7px',
                          border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
                          color: calMonthIdx === 5 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.65)',
                          fontSize: '16px', cursor: calMonthIdx === 5 ? 'default' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit',
                        }}
                      >‹</button>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>
                        {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </span>
                      <button
                        onClick={() => setCalendarMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                        disabled={calMonthIdx === 6}
                        style={{
                          width: '26px', height: '26px', borderRadius: '7px',
                          border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
                          color: calMonthIdx === 6 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.65)',
                          fontSize: '16px', cursor: calMonthIdx === 6 ? 'default' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit',
                        }}
                      >›</button>
                    </div>

                    {/* Day-of-week headers */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '4px' }}>
                      {['Su','Mo','Tu','We','Th','Fr','Sa'].map(day => (
                        <div key={day} style={{ textAlign: 'center', fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.28)', paddingBottom: '4px', letterSpacing: '0.04em' }}>{day}</div>
                      ))}
                    </div>

                    {/* Day cells */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
                      {calCells.map((date, i) => {
                        if (!date) return <div key={`e${i}`} />
                        const sel = isSameDay(date, scheduleDate)
                        const tod = isSameDay(date, calToday)
                        const inT = date >= TOURNAMENT_START && date <= TOURNAMENT_END
                        return (
                          <button
                            key={date.getDate()}
                            onClick={() => { if (inT) { setScheduleDate(date); setShowCalendar(false) } }}
                            style={{
                              padding: '7px 2px',
                              borderRadius: '7px',
                              border: sel
                                ? '1px solid rgba(74,222,128,0.5)'
                                : tod ? '1px solid rgba(255,255,255,0.18)' : '1px solid transparent',
                              background: sel
                                ? 'rgba(74,222,128,0.14)'
                                : tod ? 'rgba(255,255,255,0.06)' : 'transparent',
                              color: !inT
                                ? 'rgba(255,255,255,0.13)'
                                : sel ? 'rgba(74,222,128,0.95)' : tod ? '#fff' : 'rgba(255,255,255,0.72)',
                              fontSize: '11px',
                              fontWeight: sel || tod ? 700 : 400,
                              cursor: inT ? 'pointer' : 'default',
                              textAlign: 'center',
                              fontFamily: 'inherit',
                              lineHeight: 1,
                            }}
                          >
                            {date.getDate()}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />

              {/* Matches for selected date */}
              {scheduleIsLoading ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>Loading…</div>
              ) : scheduleDisplayMatches.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(255,255,255,0.22)', fontSize: '12px' }}>No matches on this date</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {scheduleDisplayMatches.map((m) => (
                    <MatchCard
                      key={m.id}
                      match={m}
                      isUnsubscribed={settings.unsubscribedMatches.includes(m.id)}
                      onUnsubscribe={() => handleUnsubscribe(m.id)}
                      onResubscribe={() => handleResubscribe(m.id)}
                      onClick={() => push({ type: 'match', matchId: m.id })}
                      onTeamClick={handleTeamClick}
                      onPlayerClick={handlePlayerClick}
                      dimmed={m.status === 'post'}
                    />
                  ))}
                </div>
              )}
              <WatchNowCard hidden={isCasting} watchProviderUrl={settings.watchProviderUrl ?? 'https://watch.spectrum.net'} watchMethod={watchMethod} />
            </div>
          )}

          {/* STANDINGS */}
          {activeTab === 'standings' && (
            <div style={{ padding: `14px ${PAD}px 16px` }}>
              <GroupStandings onTeamClick={handleTeamClick} />
            </div>
          )}

          {/* BRACKET */}
          {activeTab === 'bracket' && (
            <div style={{ padding: `14px ${PAD}px 16px` }}>
              <Bracket onTeamClick={handleTeamClick} />
            </div>
          )}

          </>)}
        </div>
      </div>
    </div>
  )
}
