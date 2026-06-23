import type { Settings } from '../types'

interface Props {
  settings: Settings
  onSetMinutes: (m: number) => void
  onSetSound: (e: boolean) => void
  onResetSubscriptions: () => void
  onBack: () => void
}

export default function SettingsPanel({ settings, onSetMinutes, onSetSound, onResetSubscriptions, onBack }: Props) {
  return (
    <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <button
        onClick={onBack}
        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontSize: '12px', padding: '0 0 4px', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'inherit', alignSelf: 'flex-start' }}
      >
        ← Back
      </button>
      <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider">Notifications</h2>

      {/* Notification timing */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/8">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm text-white/80">Notify before kickoff</span>
          <span className="text-sm font-bold text-green-400">{settings.notificationMinutes} min</span>
        </div>
        <input
          type="range"
          min="5"
          max="60"
          step="5"
          value={settings.notificationMinutes}
          onChange={(e) => onSetMinutes(Number(e.target.value))}
          className="w-full accent-green-500 cursor-pointer"
        />
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-white/25">5 min</span>
          <span className="text-[10px] text-white/25">60 min</span>
        </div>
      </div>

      {/* Sound toggle */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/8 flex items-center justify-between">
        <div>
          <p className="text-sm text-white/80">Sound alert</p>
          <p className="text-[11px] text-white/35 mt-0.5">Plays a sound when a match is about to start</p>
        </div>
        <button
          onClick={() => onSetSound(!settings.soundEnabled)}
          className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
            settings.soundEnabled ? 'bg-green-500' : 'bg-white/15'
          }`}
        >
          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
            settings.soundEnabled ? 'left-5.5' : 'left-0.5'
          }`} />
        </button>
      </div>

      {/* Subscriptions */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/80">Muted matches</p>
            <p className="text-[11px] text-white/35 mt-0.5">
              {settings.unsubscribedMatches.length === 0
                ? 'Subscribed to all matches'
                : `${settings.unsubscribedMatches.length} match${settings.unsubscribedMatches.length > 1 ? 'es' : ''} muted`
              }
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
