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

function RadioDot({ selected }: { selected: boolean }) {
  return (
    <div style={{
      width: '15px', height: '15px', borderRadius: '50%', flexShrink: 0,
      border: `2px solid ${selected ? 'rgba(74,222,128,0.9)' : 'rgba(255,255,255,0.22)'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'border-color 0.12s',
    }}>
      {selected && (
        <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'rgba(74,222,128,0.9)' }} />
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
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
  const selectedProvider = getProviderByUrl(settings.watchProviderUrl)

  return (
    <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <button
        onClick={onBack}
        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontSize: '12px', padding: '0 0 4px', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'inherit', alignSelf: 'flex-start' }}
      >
        ← Back
      </button>

      {/* ── Notifications ── */}
      <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider">Notifications</h2>

      <div className="bg-white/5 rounded-xl p-4 border border-white/8">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm text-white/80">Notify before kickoff</span>
          <span className="text-sm font-bold text-green-400">{settings.notificationMinutes} min</span>
        </div>
        <input
          type="range" min="5" max="60" step="5"
          value={settings.notificationMinutes}
          onChange={(e) => onSetMinutes(Number(e.target.value))}
          className="w-full accent-green-500 cursor-pointer"
        />
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-white/25">5 min</span>
          <span className="text-[10px] text-white/25">60 min</span>
        </div>
      </div>

      <div className="bg-white/5 rounded-xl p-4 border border-white/8 flex items-center justify-between">
        <div>
          <p className="text-sm text-white/80">Sound alert</p>
          <p className="text-[11px] text-white/35 mt-0.5">Plays a sound when a match is about to start</p>
        </div>
        <button
          onClick={() => onSetSound(!settings.soundEnabled)}
          className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${settings.soundEnabled ? 'bg-green-500' : 'bg-white/15'}`}
        >
          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${settings.soundEnabled ? 'left-5.5' : 'left-0.5'}`} />
        </button>
      </div>

      {/* ── Watch ── */}
      <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider">Watch</h2>

      {/* Launch Method — radio list */}
      <div className="bg-white/5 rounded-xl border border-white/8 overflow-hidden">
        <p style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', padding: '12px 14px 8px' }}>Launch method</p>
        {WATCH_METHODS.map((m, i) => {
          const sel = settings.watchMethod === m.id
          return (
            <button
              key={m.id}
              onClick={() => onSetWatchMethod(m.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'flex-start', gap: '11px',
                padding: '10px 14px',
                borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                background: sel ? 'rgba(74,222,128,0.06)' : 'transparent',
                border: 'none', borderRadius: 0,
                cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
              }}
            >
              <div style={{ paddingTop: '1px' }}>
                <RadioDot selected={sel} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                  <span style={{ color: sel ? 'rgba(74,222,128,0.9)' : 'rgba(255,255,255,0.7)', display: 'flex' }}>{m.icon}</span>
                  <span style={{ fontSize: '13px', fontWeight: sel ? 700 : 500, color: sel ? 'rgba(74,222,128,0.95)' : 'rgba(255,255,255,0.8)' }}>
                    {m.label}
                  </span>
                </div>
                <p style={{ fontSize: '11px', color: sel ? 'rgba(74,222,128,0.55)' : 'rgba(255,255,255,0.3)', margin: 0, lineHeight: 1.4 }}>
                  {m.desc}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      {/* TV Provider — radio grid */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/8">
        <p style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '12px' }}>TV Provider</p>
        {CATEGORIES.map((cat) => {
          const group = PROVIDERS.filter((p) => p.category === cat)
          if (!group.length) return null
          return (
            <div key={cat} style={{ marginBottom: '12px' }}>
              <p style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: '6px' }}>
                {CATEGORY_LABELS[cat]}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '5px' }}>
                {group.map((p) => {
                  const sel = settings.watchProviderUrl === p.url
                  return (
                    <button
                      key={p.id}
                      onClick={() => onSetWatchProvider(p.url)}
                      style={{
                        position: 'relative',
                        padding: '9px 8px 8px',
                        borderRadius: '10px',
                        fontFamily: 'inherit',
                        border: sel ? '1px solid rgba(74,222,128,0.45)' : '1px solid rgba(255,255,255,0.08)',
                        background: sel ? 'rgba(74,222,128,0.08)' : 'rgba(255,255,255,0.03)',
                        cursor: 'pointer', textAlign: 'left',
                        transition: 'background 0.1s, border-color 0.1s',
                      }}
                    >
                      {/* Radio dot top-right */}
                      <div style={{ position: 'absolute', top: '7px', right: '7px' }}>
                        <RadioDot selected={sel} />
                      </div>
                      <p style={{ fontSize: '11px', fontWeight: 700, color: sel ? 'rgba(74,222,128,0.95)' : 'rgba(255,255,255,0.78)', margin: '0 0 3px', lineHeight: 1.2, paddingRight: '18px' }}>
                        {p.name}
                      </p>
                      <p style={{ fontSize: '9px', color: sel ? 'rgba(74,222,128,0.55)' : 'rgba(255,255,255,0.25)', margin: 0, lineHeight: 1.3 }}>
                        {p.channels}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
        {selectedProvider && (
          <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', marginTop: '2px', lineHeight: 1.4 }}>
            ✓ <span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>{selectedProvider.name}</span> — {selectedProvider.channels}
          </p>
        )}
      </div>

      {/* ── Muted Matches ── */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/80">Muted matches</p>
            <p className="text-[11px] text-white/35 mt-0.5">
              {settings.unsubscribedMatches.length === 0
                ? 'Subscribed to all matches'
                : `${settings.unsubscribedMatches.length} match${settings.unsubscribedMatches.length > 1 ? 'es' : ''} muted`}
            </p>
          </div>
          {settings.unsubscribedMatches.length > 0 && (
            <button
              onClick={onResetSubscriptions}
              className="text-xs text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/50 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
            >
              Reset all
            </button>
          )}
        </div>
      </div>

      <div className="pt-2 border-t border-white/5">
        <p className="text-[11px] text-white/20 text-center">World Cup 2026 · USA/Canada/Mexico</p>
        <p className="text-[10px] text-white/15 text-center mt-1">Data via ESPN</p>
      </div>
    </div>
  )
}
