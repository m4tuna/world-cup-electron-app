import { useEffect, useState, useRef } from 'react'
import { useMatchStore } from './store/matchStore'
import { useMatches } from './hooks/useMatches'
import MatchCard from './components/MatchCard'
import UpcomingMatch from './components/UpcomingMatch'
import MatchDetail from './components/MatchDetail'
import SettingsPanel from './components/SettingsPanel'
import GroupStandings from './components/GroupStandings'
import Bracket from './components/Bracket'
import SpectrumQR from './components/SpectrumQR'
import CastPanel from './components/CastPanel'
import type { Match, CastDevice } from './types'

function groupByDay(matches: Match[]) {
  const groups: Record<string, Match[]> = {}
  for (const m of matches) {
    const day = new Date(m.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
    if (!groups[day]) groups[day] = []
    groups[day].push(m)
  }
  return groups
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
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
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

  const liveMatches = todayMatches.filter((m) => m.status === 'in')
  const todayPre = todayMatches.filter((m) => m.status === 'pre')
  const todayPost = todayMatches.filter((m) => m.status === 'post')
  const futureMatches = upcomingMatches.filter((m) => {
    const d = new Date(m.date)
    const today = new Date()
    return d.toDateString() !== today.toDateString() && m.status === 'pre'
  })

  useEffect(() => {
    if (liveMatches.length > 0 && activeTab === 'schedule') setActiveTab('live')
  }, [liveMatches.length])

  const handleUnsubscribe = (id: string) => window.api.unsubscribeMatch(id)
  const handleResubscribe = (id: string) => window.api.resubscribeMatch(id)
  const handleSetMinutes = (m: number) => { window.api.setNotificationMinutes(m); setSettings({ ...settings, notificationMinutes: m }) }
  const handleSetSound = (e: boolean) => { window.api.setSoundEnabled(e); setSettings({ ...settings, soundEnabled: e }) }
  const handleResetSubs = () => { window.api.resetSubscriptions(); setSettings({ ...settings, unsubscribedMatches: [] }) }

  const upcomingGrouped = groupByDay(futureMatches)
  const selectedMatch = [...todayMatches, ...upcomingMatches].find((m) => m.id === selectedMatchId) ?? null

  const castingDevice = castDevices.find((d) => d.status?.isPlaying) ?? null
  const isCasting = !!castingDevice
  const castDeviceName = castingDevice?.name ?? null

  // ── Shared style constants ─────────────────────────────────────
  const PAD = 20
  const CARD_BG = 'rgba(8, 8, 12, 0.98)'
  const BLUR = 'blur(28px) saturate(180%)'

  // Resize window: match detail fills available height; normal view fits content
  useEffect(() => {
    if (selectedMatchId) {
      window.api.resizePanel?.(9999) // main process caps at screen height
    } else {
      const fixedH = fixedRef.current?.offsetHeight ?? 0
      const contentH = scrollRef.current?.scrollHeight ?? 0
      window.api.resizePanel?.(CARET_H + fixedH + contentH + 6)
    }
  }, [activeTab, todayMatches.length, upcomingMatches.length, castDevices.length, selectedMatchId, showSettings])

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
              onClick={() => { setShowSettings((s) => !s); setSelectedMatchId(null) }}
              title="Settings"
              style={{
                background: showSettings ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)',
                border: showSettings ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                height: '30px',
                width: '30px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={showSettings ? '#fff' : 'rgba(255,255,255,0.55)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ── Tabs (hidden in match detail and settings) ── */}
        {!selectedMatch && !showSettings && (
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

          {selectedMatch ? (
            <MatchDetail match={selectedMatch} onBack={() => setSelectedMatchId(null)} />
          ) : showSettings ? (
            <>
              <SettingsPanel settings={settings} onSetMinutes={handleSetMinutes} onSetSound={handleSetSound} onResetSubscriptions={handleResetSubs} />
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', margin: '0 20px' }} />
              <CastPanel />
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
                    <MatchCard key={m.id} match={m} isUnsubscribed={settings.unsubscribedMatches.includes(m.id)} onUnsubscribe={() => handleUnsubscribe(m.id)} onResubscribe={() => handleResubscribe(m.id)} onClick={() => setSelectedMatchId(m.id)} />
                  ))}
                  {todayPre.map((m) => (
                    <MatchCard key={m.id} match={m} isUnsubscribed={settings.unsubscribedMatches.includes(m.id)} onUnsubscribe={() => handleUnsubscribe(m.id)} onResubscribe={() => handleResubscribe(m.id)} onClick={() => setSelectedMatchId(m.id)} />
                  ))}
                  {todayPost.length > 0 && (
                    <>
                      <div style={{ fontSize: '9px', fontWeight: 600, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.1em', paddingLeft: '2px' }}>Final</div>
                      {todayPost.map((m) => (
                        <MatchCard key={m.id} match={m} isUnsubscribed={settings.unsubscribedMatches.includes(m.id)} onUnsubscribe={() => handleUnsubscribe(m.id)} onResubscribe={() => handleResubscribe(m.id)} onClick={() => setSelectedMatchId(m.id)} dimmed />
                      ))}
                    </>
                  )}
                </>
              )}
              <div style={{ marginBottom: '8px' }}><SpectrumQR hidden={isCasting} /></div>
            </div>
          )}

          {/* SCHEDULE */}
          {activeTab === 'schedule' && (
            <div style={{ padding: `14px ${PAD}px 16px`, display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {futureMatches.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(255,255,255,0.22)', fontSize: '13px' }}>No upcoming matches</div>
              ) : (
                Object.entries(upcomingGrouped).map(([day, matches]) => (
                  <div key={day} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <h3 style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.26)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0, paddingLeft: '2px' }}>{day}</h3>
                    {matches.map((m) => (
                      <UpcomingMatch key={m.id} match={m} isUnsubscribed={settings.unsubscribedMatches.includes(m.id)} onUnsubscribe={() => handleUnsubscribe(m.id)} onResubscribe={() => handleResubscribe(m.id)} onClick={() => setSelectedMatchId(m.id)} />
                    ))}
                  </div>
                ))
              )}
              <SpectrumQR hidden={isCasting} />
            </div>
          )}

          {/* STANDINGS */}
          {activeTab === 'standings' && (
            <div style={{ padding: `14px ${PAD}px 16px` }}>
              <GroupStandings />
            </div>
          )}

          {/* BRACKET */}
          {activeTab === 'bracket' && (
            <div style={{ padding: `14px ${PAD}px 16px` }}>
              <Bracket />
            </div>
          )}

          </>)}
        </div>
      </div>
    </div>
  )
}
