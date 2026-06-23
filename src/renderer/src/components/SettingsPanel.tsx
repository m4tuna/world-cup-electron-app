import { PROVIDERS, CATEGORY_LABELS, getProviderByUrl } from '../lib/providers'
import type { Settings } from '../types'

interface Props {
  settings: Settings
  onSetMinutes: (m: number) => void
  onSetSound: (e: boolean) => void
  onResetSubscriptions: () => void
  onSetWatchProvider: (url: string) => void
  onSetWatchMethod: (m: 'browser' | 'airplay') => void
  onBack: () => void
}

const CATEGORIES = ['streaming', 'direct', 'cable'] as const

// ── Design tokens ────────────────────────────────────────────────────
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
// ─────────────────────────────────────────────────────────────────────

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

export default function SettingsPanel({
  settings, onSetMinutes, onSetSound, onResetSubscriptions,
  onSetWatchProvider, onSetWatchMethod, onBack,
}: Props) {
  const watchMethod = settings.watchMethod ?? 'browser'
  const watchProviderUrl = settings.watchProviderUrl ?? 'https://watch.spectrum.net'
  const selectedProvider = getProviderByUrl(watchProviderUrl)

  return (
    <div style={{ padding: '14px 20px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

      {/* Back */}
      <button
        onClick={onBack}
        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '12px', padding: '0 0 6px', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'inherit', alignSelf: 'flex-start' }}
      >
        ← Back
      </button>

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

      {/* Sound toggle */}
      <div style={{ ...CARD, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', margin: '0 0 3px' }}>Sound alert</p>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>Plays a sound when a match is about to start</p>
        </div>
        <button
          onClick={() => onSetSound(!settings.soundEnabled)}
          style={{
            position: 'relative', width: '44px', height: '24px', borderRadius: '12px',
            background: settings.soundEnabled ? 'rgba(34,197,94,0.9)' : 'rgba(255,255,255,0.15)',
            border: 'none', cursor: 'pointer', flexShrink: 0, transition: 'background 0.15s',
          }}
        >
          <span style={{
            position: 'absolute', top: '2px',
            left: settings.soundEnabled ? '22px' : '2px',
            width: '20px', height: '20px', borderRadius: '50%',
            background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            transition: 'left 0.15s',
          }} />
        </button>
      </div>

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
            {settings.unsubscribedMatches.length === 0
              ? 'Subscribed to all matches'
              : `${settings.unsubscribedMatches.length} match${settings.unsubscribedMatches.length > 1 ? 'es' : ''} muted`}
          </p>
        </div>
        {settings.unsubscribedMatches.length > 0 && (
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
        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.18)', margin: '0 0 3px' }}>World Cup 2026 · USA/Canada/Mexico</p>
        <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.12)', margin: 0 }}>Data via ESPN</p>
      </div>

    </div>
  )
}
