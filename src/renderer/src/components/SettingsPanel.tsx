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

export default function SettingsPanel({
  settings, onSetMinutes, onSetSound, onResetSubscriptions,
  onSetWatchProvider, onSetWatchMethod, onBack,
}: Props) {
  const selectedProvider = getProviderByUrl(settings.watchProviderUrl)
  const isAirPlay = settings.watchMethod === 'airplay'

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

      {/* Launch Method */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/8">
        <p className="text-sm text-white/80 mb-3">Launch method</p>
        <div style={{ display: 'flex', gap: '6px' }}>
          {(['browser', 'airplay'] as const).map((method) => {
            const active = settings.watchMethod === method
            return (
              <button
                key={method}
                onClick={() => onSetWatchMethod(method)}
                style={{
                  flex: 1, padding: '8px 0', borderRadius: '9px', fontFamily: 'inherit',
                  border: active ? '1px solid rgba(74,222,128,0.5)' : '1px solid rgba(255,255,255,0.1)',
                  background: active ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.04)',
                  color: active ? 'rgba(74,222,128,0.95)' : 'rgba(255,255,255,0.5)',
                  fontSize: '12px', fontWeight: active ? 700 : 500,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                }}
              >
                {method === 'browser' ? (
                  <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> Browser</>
                ) : (
                  <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg> AirPlay</>
                )}
              </button>
            )
          })}
        </div>
        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '8px', lineHeight: 1.4 }}>
          {isAirPlay
            ? 'Opens in Safari — click the AirPlay button in the video player to cast to Apple TV'
            : 'Opens in your default browser'}
        </p>
      </div>

      {/* TV Provider */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/8">
        <p className="text-sm text-white/80 mb-3">TV Provider</p>
        {CATEGORIES.map((cat) => {
          const group = PROVIDERS.filter((p) => p.category === cat)
          if (!group.length) return null
          return (
            <div key={cat} style={{ marginBottom: '10px' }}>
              <p style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
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
                        padding: '8px 6px', borderRadius: '9px', fontFamily: 'inherit',
                        border: sel ? '1px solid rgba(74,222,128,0.5)' : '1px solid rgba(255,255,255,0.08)',
                        background: sel ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.03)',
                        cursor: 'pointer', textAlign: 'center',
                      }}
                    >
                      <p style={{ fontSize: '11px', fontWeight: sel ? 700 : 600, color: sel ? 'rgba(74,222,128,0.95)' : 'rgba(255,255,255,0.75)', margin: 0, lineHeight: 1.2 }}>
                        {p.name}
                      </p>
                      <p style={{ fontSize: '9px', color: sel ? 'rgba(74,222,128,0.6)' : 'rgba(255,255,255,0.28)', margin: '3px 0 0', lineHeight: 1.3 }}>
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
          <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', marginTop: '4px', lineHeight: 1.4 }}>
            Selected: <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{selectedProvider.name}</span> · {selectedProvider.channels}
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
