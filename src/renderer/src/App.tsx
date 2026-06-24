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
import NewsFeed from './components/NewsFeed'
import Leaders from './components/Leaders'
import ArticleReader from './components/ArticleReader'
import { LEAGUES, SPORT_GROUPS, getLeague } from './lib/leagues'
import type { Match, CastDevice, EventNotif, Settings } from './types'

function isMatchSubscribed(matchId: string, homeAbbr: string, awayAbbr: string, s: Settings): boolean {
  if (s.unsubscribedMatches.includes(matchId)) return false
  if (s.subscribedMatches?.includes(matchId)) return true
  const leagueId = s.activeLeagueId ?? 'fifa.world'
  const leagueFavs = s.teamSubscriptions?.[leagueId] ?? []
  const globalFavs = leagueId === 'fifa.world' ? (s.favoriteTeams ?? []) : []
  const favTeams = [...new Set([...leagueFavs, ...globalFavs])]
  if (favTeams.length > 0) return favTeams.includes(homeAbbr) || favTeams.includes(awayAbbr)
  return false
}

type NavEntry =
  | { type: 'main' }
  | { type: 'settings' }
  | { type: 'match'; matchId: string }
  | { type: 'team'; teamId: string; teamName: string; flagEmoji: string }
  | { type: 'player'; playerId: string; playerName: string; position: string; teamFlag: string; teamAbbr: string }
  | { type: 'article'; url: string; title: string }

const TOURNAMENT_START = new Date('2026-06-11T00:00:00')
const TOURNAMENT_END = new Date('2026-07-19T23:59:59')

function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString()
}

function fmtDateParam(d: Date): string {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
}

type Tab = 'scoreboard' | 'standings' | 'bracket' | 'leaders' | 'news'
const ALL_TABS: { id: Tab; label: string; alwaysShow?: boolean }[] = [
  { id: 'scoreboard', label: 'Scores', alwaysShow: true },
  { id: 'standings', label: 'Standings' },
  { id: 'bracket', label: 'Bracket' },
  { id: 'leaders', label: 'Leaders' },
  { id: 'news', label: 'News', alwaysShow: true },
]

const CARET_H = 10   // px above the card

export default function App() {
  useMatches()
  const { todayMatches, upcomingMatches, settings, activeTab, setActiveTab, setSettings, setTodayMatches } = useMatchStore()
  const [caretX, setCaretX] = useState(250)
  const [castDevices, setCastDevices] = useState<CastDevice[]>([])
  const [matchesLoading, setMatchesLoading] = useState(true)
  const [navStack, setNavStack] = useState<NavEntry[]>([{ type: 'main' }])
  const current = navStack[navStack.length - 1]
  const push = useCallback((e: NavEntry) => setNavStack(s => [...s, e]), [])
  const back = useCallback(() => setNavStack(s => s.length > 1 ? s.slice(0, -1) : s), [])
  const [scheduleDate, setScheduleDate] = useState<Date>(() => new Date())
  const [scheduleDayMatches, setScheduleDayMatches] = useState<Match[] | null>(null)
  const [scheduleDayLoading, setScheduleDayLoading] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(() => new Date())
  const [showLeaguePicker, setShowLeaguePicker] = useState(false)
  const [pickerPos, setPickerPos] = useState({ top: 60, left: 20 })
  const calendarRef = useRef<HTMLDivElement>(null)
  const calendarBtnRef = useRef<HTMLButtonElement>(null)
  const leaguePickerRef = useRef<HTMLDivElement>(null)
  const leaguePickerBtnRef = useRef<HTMLButtonElement>(null)
  const fixedRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const activeLeagueId = settings.activeLeagueId ?? 'fifa.world'
  const activeLeague = getLeague(activeLeagueId)
  const visibleTabs = ALL_TABS.filter((t) =>
    t.alwaysShow ||
    (t.id === 'standings' && activeLeague.hasStandings) ||
    (t.id === 'bracket' && activeLeague.hasBracket) ||
    (t.id === 'leaders' && activeLeague.hasLeaders)
  )

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

  useEffect(() => { setShowCalendar(false); setShowLeaguePicker(false) }, [activeTab, current.type])

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

  useEffect(() => {
    if (!showLeaguePicker) return
    const handler = (e: MouseEvent) => {
      if (leaguePickerRef.current && !leaguePickerRef.current.contains(e.target as Node)) {
        setShowLeaguePicker(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showLeaguePicker])

  const liveMatches = todayMatches.filter((m) => m.status === 'in')
  const todayPre = todayMatches.filter((m) => m.status === 'pre')
  const todayPost = todayMatches.filter((m) => m.status === 'post')
  const isScheduleToday = isSameDay(scheduleDate, new Date())
  const handleToggleMatch = useCallback((matchId: string, homeAbbr: string, awayAbbr: string) => {
    const subbed = isMatchSubscribed(matchId, homeAbbr, awayAbbr, settings)
    if (subbed) {
      window.api.unsubscribeMatch(matchId)
      setSettings({ ...settings, unsubscribedMatches: [...settings.unsubscribedMatches, matchId], subscribedMatches: (settings.subscribedMatches ?? []).filter(id => id !== matchId) })
    } else {
      window.api.resubscribeMatch(matchId)
      setSettings({ ...settings, unsubscribedMatches: settings.unsubscribedMatches.filter(id => id !== matchId), subscribedMatches: [...(settings.subscribedMatches ?? []), matchId] })
    }
  }, [settings, setSettings])
  const handleSetMinutes = (m: number) => { window.api.setNotificationMinutes(m); setSettings({ ...settings, notificationMinutes: m }) }
  const handleSetSound = (e: boolean) => { window.api.setSoundEnabled(e); setSettings({ ...settings, soundEnabled: e }) }
  const handleResetSubs = () => { window.api.resetSubscriptions(); setSettings({ ...settings, unsubscribedMatches: [], subscribedMatches: [] }) }
  const handleSetWatchProvider = (url: string) => { window.api.setWatchProviderUrl(url); setSettings({ ...settings, watchProviderUrl: url }) }
  const handleSetWatchMethod = (m: 'browser' | 'airplay') => { window.api.setWatchMethod(m); setSettings({ ...settings, watchMethod: m }) }
  const handleSetNotifyEvent = (event: string, config: EventNotif) => {
    window.api.setNotifyEvent(event, config)
    setSettings({ ...settings, [event]: config })
  }
  const handleSetFavoriteTeams = (abbrs: string[]) => {
    window.api.setFavoriteTeams(abbrs)
    setSettings({ ...settings, favoriteTeams: abbrs })
  }
  const handleSetActiveLeague = useCallback((leagueId: string) => {
    window.api.setActiveLeague(leagueId)
    setSettings({ ...settings, activeLeagueId: leagueId })
    setTodayMatches([])
    setMatchesLoading(true)
    setScheduleDate(new Date())
    setNavStack([{ type: 'main' }])
    setActiveTab('scoreboard')
    setShowLeaguePicker(false)
  }, [settings, setSettings, setTodayMatches, setActiveTab])
  const handleSetEnabledLeagues = useCallback((ids: string[]) => {
    window.api.setEnabledLeagues(ids)
    setSettings({ ...settings, enabledLeagueIds: ids })
  }, [settings, setSettings])
  const handleSetTeamSubscriptions = useCallback((subs: Record<string, string[]>) => {
    window.api.setTeamSubscriptions(subs)
    setSettings({ ...settings, teamSubscriptions: subs })
  }, [settings, setSettings])
  const handleSetPhoneNotifyEnabled = (v: boolean) => {
    window.api.setPhoneNotifyEnabled(v)
    setSettings({ ...settings, phoneNotifyEnabled: v })
  }
  const handleSetExpoPushToken = (token: string) => {
    window.api.setExpoPushToken(token)
    setSettings({ ...settings, expoPushToken: token })
  }

  const watchProvider = getProviderByUrl(settings.watchProviderUrl ?? '')
  const watchProviderName = watchProvider?.name ?? 'Watch Live'
  const watchMethod = settings.watchMethod ?? 'browser'

  const handleTeamClick = useCallback((teamId: string, teamName: string, flagEmoji: string) => {
    if (teamId) push({ type: 'team', teamId, teamName, flagEmoji })
  }, [push])
  const handlePlayerClick = useCallback((playerId: string, playerName: string, position: string, teamFlag: string, teamAbbr: string) => {
    if (playerId) push({ type: 'player', playerId, playerName, position, teamFlag, teamAbbr })
  }, [push])

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
  const isWC = activeLeagueId === 'fifa.world'

  // ── Shared style constants ─────────────────────────────────────
  const PAD = 20
  const CARD_BG = 'rgba(8, 8, 12, 0.98)'
  const BLUR = 'blur(28px) saturate(180%)'

  useEffect(() => {
    const tallTab = activeTab !== 'scoreboard' || !isScheduleToday
    if (current.type !== 'main' || tallTab || showLeaguePicker) {
      window.api.resizePanel?.(9999)
    } else {
      const fixedH = fixedRef.current?.offsetHeight ?? 0
      const contentH = scrollRef.current?.scrollHeight ?? 0
      window.api.resizePanel?.(CARET_H + fixedH + contentH + 6)
    }
  }, [current.type, activeTab, todayMatches.length, upcomingMatches.length, castDevices.length, isScheduleToday, matchesLoading, activeLeagueId, showLeaguePicker])

  useEffect(() => {
    window.api.setPanelWidth?.(500)
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
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `14px ${PAD}px 10px`, overflow: 'visible' }}>
          {/* League picker button */}
          <div ref={leaguePickerRef} style={{ position: 'relative' }}>
            <button
              ref={leaguePickerBtnRef}
              onClick={() => {
                if (!showLeaguePicker && leaguePickerBtnRef.current) {
                  const r = leaguePickerBtnRef.current.getBoundingClientRect()
                  setPickerPos({ top: r.bottom + 10, left: r.left })
                }
                setShowLeaguePicker(v => !v)
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: '9px',
                background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                textAlign: 'left', fontFamily: 'inherit',
              }}
            >
              <span style={{ fontSize: '20px', lineHeight: 1 }}>{activeLeague.icon}</span>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: '#fff', lineHeight: 1, letterSpacing: '-0.015em', margin: 0 }}>{activeLeague.name}</p>
                  <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', lineHeight: 1 }}>▾</span>
                </div>
                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '2px', margin: 0 }}>{activeLeague.sport.charAt(0).toUpperCase() + activeLeague.sport.slice(1)}</p>
              </div>
            </button>

            {/* League picker popover — fixed so it escapes overflow:hidden on the card */}
            {showLeaguePicker && (
              <div style={{
                position: 'fixed', top: pickerPos.top, left: pickerPos.left, zIndex: 200,
                background: 'rgba(14,16,22,0.99)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,255,255,0.13)', borderRadius: '14px',
                padding: '8px', minWidth: '210px',
                boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
                maxHeight: 'calc(100vh - 90px)', overflowY: 'auto',
              }}>
                {SPORT_GROUPS.map((group) => {
                  const groupLeagues = LEAGUES.filter((l) => l.sport === group.sport)
                  return (
                    <div key={group.sport} style={{ marginBottom: '4px' }}>
                      <p style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '6px 8px 4px' }}>{group.label}</p>
                      {groupLeagues.map((league) => {
                        const isActive = league.id === activeLeagueId
                        const isEnabled = (settings.enabledLeagueIds ?? ['fifa.world']).includes(league.id)
                        return (
                          <button
                            key={league.id}
                            onClick={() => handleSetActiveLeague(league.id)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '9px',
                              width: '100%', padding: '7px 10px', borderRadius: '8px',
                              background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                              border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                            }}
                          >
                            <span style={{ fontSize: '16px', lineHeight: 1, flexShrink: 0 }}>{league.icon}</span>
                            <span style={{ fontSize: '12px', fontWeight: isActive ? 700 : 400, color: isActive ? '#fff' : 'rgba(255,255,255,0.6)', flex: 1 }}>{league.name}</span>
                            {isEnabled && !isActive && (
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(74,222,128,0.7)', flexShrink: 0 }} />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            )}
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
              {visibleTabs.map((tab) => {
                const isActive = activeTab === tab.id || (!visibleTabs.find(t => t.id === activeTab) && tab.id === 'scoreboard')
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                    flex: 1, padding: '5px 0', borderRadius: '7px', border: 'none',
                    fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                    background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                    color: isActive ? '#fff' : 'rgba(255,255,255,0.35)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                  }}>
                    {tab.id === 'scoreboard' && liveMatches.length > 0 && (
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#ef4444', display: 'block', flexShrink: 0 }} />
                    )}
                    {tab.label}
                  </button>
                )
              })}
            </div>
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', margin: `0 ${PAD}px` }} />
          </>
        )}

        </div>{/* end fixedRef */}

        {/* ── Scrollable content ── */}
        <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>

          {current.type === 'article' ? (
            <ArticleReader
              url={current.url}
              title={current.title}
              onBack={back}
              onOpenExternal={(u) => window.api.openUrl(u)}
            />
          ) : current.type === 'player' ? (
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
              <SettingsPanel settings={settings} onSetMinutes={handleSetMinutes} onSetSound={handleSetSound} onResetSubscriptions={handleResetSubs} onSetWatchProvider={handleSetWatchProvider} onSetWatchMethod={handleSetWatchMethod} onSetNotifyEvent={handleSetNotifyEvent} onSetFavoriteTeams={handleSetFavoriteTeams} onSetPhoneNotifyEnabled={handleSetPhoneNotifyEnabled} onSetExpoPushToken={handleSetExpoPushToken} onBack={back} onSetActiveLeague={handleSetActiveLeague} onSetEnabledLeagues={handleSetEnabledLeagues} onSetTeamSubscriptions={handleSetTeamSubscriptions} />
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', margin: '0 20px' }} />
              <CastPanel watchProviderName={watchProviderName} watchMethod={watchMethod} />
            </>
          ) : (<>

          {/* SCOREBOARD */}
          {activeTab === 'scoreboard' && (
            <div style={{ padding: `14px ${PAD}px 16px`, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Date navigation + calendar popover */}
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    onClick={() => setScheduleDate(prev => { const d = new Date(prev); d.setDate(d.getDate() - 1); return d })}
                    disabled={isWC && isSameDay(scheduleDate, TOURNAMENT_START)}
                    style={{
                      flexShrink: 0, width: '32px', height: '32px', borderRadius: '9px',
                      border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
                      color: (isWC && isSameDay(scheduleDate, TOURNAMENT_START)) ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.65)',
                      fontSize: '18px', lineHeight: 1,
                      cursor: (isWC && isSameDay(scheduleDate, TOURNAMENT_START)) ? 'default' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit',
                    }}
                  >‹</button>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>
                        {isScheduleToday ? 'Today' : scheduleDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                      </span>
                      {isScheduleToday && liveMatches.length > 0 && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.28)', padding: '2px 7px', borderRadius: '20px' }}>
                          <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#ef4444', display: 'block' }} />
                          <span style={{ fontSize: '10px', color: '#f87171', fontWeight: 600 }}>{liveMatches.length} Live</span>
                        </div>
                      )}
                    </div>
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
                    disabled={isWC && isSameDay(scheduleDate, TOURNAMENT_END)}
                    style={{
                      flexShrink: 0, width: '32px', height: '32px', borderRadius: '9px',
                      border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
                      color: (isWC && isSameDay(scheduleDate, TOURNAMENT_END)) ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.65)',
                      fontSize: '18px', lineHeight: 1,
                      cursor: (isWC && isSameDay(scheduleDate, TOURNAMENT_END)) ? 'default' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit',
                    }}
                  >›</button>
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

                {showCalendar && (
                  <div
                    ref={calendarRef}
                    style={{
                      position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, zIndex: 50,
                      background: 'rgba(14, 16, 22, 0.99)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
                      border: '1px solid rgba(255,255,255,0.13)', borderRadius: '14px', padding: '14px',
                      boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <button onClick={() => setCalendarMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                        style={{ width: '26px', height: '26px', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.65)', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}>‹</button>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>{calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                      <button onClick={() => setCalendarMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                        style={{ width: '26px', height: '26px', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.65)', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}>›</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '4px' }}>
                      {['Su','Mo','Tu','We','Th','Fr','Sa'].map(day => (
                        <div key={day} style={{ textAlign: 'center', fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.28)', paddingBottom: '4px', letterSpacing: '0.04em' }}>{day}</div>
                      ))}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
                      {calCells.map((date, i) => {
                        if (!date) return <div key={`e${i}`} />
                        const sel = isSameDay(date, scheduleDate)
                        const tod = isSameDay(date, calToday)
                        const inRange = !isWC || (date >= TOURNAMENT_START && date <= TOURNAMENT_END)
                        return (
                          <button key={date.getDate()} onClick={() => { if (inRange) { setScheduleDate(date); setShowCalendar(false) } }}
                            style={{ padding: '7px 2px', borderRadius: '7px', border: sel ? '1px solid rgba(74,222,128,0.5)' : tod ? '1px solid rgba(255,255,255,0.18)' : '1px solid transparent', background: sel ? 'rgba(74,222,128,0.14)' : tod ? 'rgba(255,255,255,0.06)' : 'transparent', color: !inRange ? 'rgba(255,255,255,0.13)' : sel ? 'rgba(74,222,128,0.95)' : tod ? '#fff' : 'rgba(255,255,255,0.72)', fontSize: '11px', fontWeight: sel || tod ? 700 : 400, cursor: inRange ? 'pointer' : 'default', textAlign: 'center', fontFamily: 'inherit', lineHeight: 1 }}>
                            {date.getDate()}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />

              {/* Matches */}
              {scheduleIsLoading ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>Loading…</div>
              ) : isScheduleToday ? (
                liveMatches.length === 0 && todayPre.length === 0 && todayPost.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '40px' }}>{activeLeague.scoreEmoji}</span>
                    {matchesLoading
                      ? <p style={{ color: 'rgba(255,255,255,0.22)', fontSize: '13px', margin: 0 }}>Loading matches…</p>
                      : <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: '13px', margin: 0 }}>No matches today</p>}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {liveMatches.map((m) => (
                      <MatchCard key={m.id} match={m} isUnsubscribed={!isMatchSubscribed(m.id, m.homeTeam.abbreviation, m.awayTeam.abbreviation, settings)} onToggle={() => handleToggleMatch(m.id, m.homeTeam.abbreviation, m.awayTeam.abbreviation)} onClick={() => push({ type: 'match', matchId: m.id })} onTeamClick={handleTeamClick} onPlayerClick={handlePlayerClick} favoriteTeams={settings.favoriteTeams} />
                    ))}
                    {todayPre.map((m) => (
                      <MatchCard key={m.id} match={m} isUnsubscribed={!isMatchSubscribed(m.id, m.homeTeam.abbreviation, m.awayTeam.abbreviation, settings)} onToggle={() => handleToggleMatch(m.id, m.homeTeam.abbreviation, m.awayTeam.abbreviation)} onClick={() => push({ type: 'match', matchId: m.id })} onTeamClick={handleTeamClick} onPlayerClick={handlePlayerClick} favoriteTeams={settings.favoriteTeams} />
                    ))}
                    {todayPost.length > 0 && (
                      <>
                        <div style={{ fontSize: '9px', fontWeight: 600, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.1em', paddingLeft: '2px' }}>Final</div>
                        {todayPost.map((m) => (
                          <MatchCard key={m.id} match={m} isUnsubscribed={!isMatchSubscribed(m.id, m.homeTeam.abbreviation, m.awayTeam.abbreviation, settings)} onToggle={() => handleToggleMatch(m.id, m.homeTeam.abbreviation, m.awayTeam.abbreviation)} onClick={() => push({ type: 'match', matchId: m.id })} onTeamClick={handleTeamClick} onPlayerClick={handlePlayerClick} favoriteTeams={settings.favoriteTeams} dimmed />
                        ))}
                      </>
                    )}
                  </div>
                )
              ) : scheduleDisplayMatches.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(255,255,255,0.22)', fontSize: '12px' }}>No matches on this date</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {scheduleDisplayMatches.map((m) => (
                    <MatchCard key={m.id} match={m} isUnsubscribed={!isMatchSubscribed(m.id, m.homeTeam.abbreviation, m.awayTeam.abbreviation, settings)} onToggle={() => handleToggleMatch(m.id, m.homeTeam.abbreviation, m.awayTeam.abbreviation)} onClick={() => push({ type: 'match', matchId: m.id })} onTeamClick={handleTeamClick} onPlayerClick={handlePlayerClick} favoriteTeams={settings.favoriteTeams} dimmed={m.status === 'post'} />
                  ))}
                </div>
              )}

              <WatchNowCard hidden={isCasting} watchProviderUrl={settings.watchProviderUrl ?? 'https://watch.spectrum.net'} watchMethod={watchMethod} />
            </div>
          )}

          {/* STANDINGS */}
          {activeTab === 'standings' && (
            <div style={{ padding: `14px ${PAD}px 16px` }}>
              <GroupStandings onTeamClick={handleTeamClick} favoriteTeams={settings.favoriteTeams} />
            </div>
          )}

          {/* BRACKET */}
          {activeTab === 'bracket' && (
            <div style={{ padding: `14px ${PAD}px 16px` }}>
              <Bracket onTeamClick={handleTeamClick} favoriteTeams={settings.favoriteTeams} />
            </div>
          )}

          {/* LEADERS */}
          {activeTab === 'leaders' && (
            <Leaders onPlayerClick={(id) => push({ type: 'player', playerId: id })} />
          )}

          {/* NEWS */}
          {activeTab === 'news' && (
            <NewsFeed onOpenArticle={(url, title) => push({ type: 'article', url, title })} />
          )}

          </>)}
        </div>
      </div>
    </div>
  )
}
