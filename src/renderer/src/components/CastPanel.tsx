import { useState, useEffect } from 'react'
import type { CastDevice } from '../types'

const SPECTRUM_APP_IDS = ['0518D3CE', '2C6A6E3D', 'CC32E753']

function isSpectrum(device: CastDevice) {
  if (!device.status?.isPlaying) return false
  const appId = (device.status.appId ?? '').toUpperCase()
  const statusText = device.status.statusText?.toLowerCase() ?? ''
  const appName = device.status.appName?.toLowerCase() ?? ''
  return SPECTRUM_APP_IDS.some((id) => appId.includes(id))
    || appName.includes('spectrum')
    || statusText.includes('spectrum')
}

// Any active cast session not matched as a known native app = treat as browser
function isBrowserCasting(device: CastDevice) {
  if (!device.status?.isPlaying) return false
  if (isSpectrum(device)) return false
  return true
}

function getCastLabel(device: CastDevice): string {
  if (!device.status?.isPlaying) return 'Idle'
  // statusText is the page title when browser tab casting — most useful label
  if (device.status.statusText) return device.status.statusText
  if (device.status.appName) return device.status.appName
  return 'Casting'
}

function DeviceRow({ device, onRefresh }: { device: CastDevice; onRefresh: (id: string) => void }) {
  const casting = device.status?.isPlaying
  const spectrum = isSpectrum(device)
  const browser = isBrowserCasting(device)
  const label = getCastLabel(device)
  const volume = device.status?.volume ?? null

  const accent = spectrum ? '#3b82f6' : browser ? '#a78bfa' : 'rgba(255,255,255,0.3)'
  const accentBg = spectrum ? 'rgba(59,130,246,0.08)' : browser ? 'rgba(167,139,250,0.07)' : 'rgba(255,255,255,0.04)'
  const accentBorder = spectrum ? 'rgba(59,130,246,0.2)' : browser ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.07)'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '10px 12px',
      borderRadius: '10px',
      background: casting ? accentBg : 'rgba(255,255,255,0.04)',
      border: `1px solid ${casting ? accentBorder : 'rgba(255,255,255,0.07)'}`,
    }}>
      {/* Device icon */}
      <div style={{
        width: '32px', height: '32px', borderRadius: '8px',
        background: casting ? `${accentBg}` : 'rgba(255,255,255,0.06)',
        border: `1px solid ${casting ? accentBorder : 'rgba(255,255,255,0.08)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, fontSize: '15px',
      }}>
        {browser ? (
          // Browser cast icon
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={casting ? accent : 'rgba(255,255,255,0.3)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 16.1A5 5 0 0 1 5.9 20M2 12.05A9 9 0 0 1 9.95 20M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6" />
            <line x1="2" y1="20" x2="2.01" y2="20" />
          </svg>
        ) : '📺'}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.85)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {device.name}
          {browser && casting && (
            <span style={{ marginLeft: '6px', fontSize: '10px', fontWeight: 500, color: accent }}>
              Brave
            </span>
          )}
        </p>
        <p style={{
          fontSize: '10px',
          color: casting ? (spectrum || browser ? accent : 'rgba(255,255,255,0.4)') : 'rgba(255,255,255,0.25)',
          margin: '2px 0 0',
          display: 'flex', alignItems: 'center', gap: '4px',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {casting ? (
            <>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: accent, display: 'inline-block', flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
              {volume !== null && <span style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}> · {volume}%</span>}
            </>
          ) : 'Idle'}
        </p>
      </div>

      {/* Refresh */}
      <button
        onClick={() => onRefresh(device.id)}
        title="Refresh status"
        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer', fontSize: '12px', padding: '2px', flexShrink: 0 }}
      >
        ↻
      </button>
    </div>
  )
}

export default function CastPanel({ watchProviderName = 'Watch Live', watchMethod = 'browser' }: { watchProviderName?: string; watchMethod?: 'browser' | 'airplay' }) {
  const [devices, setDevices] = useState<CastDevice[]>([])
  const [scanning, setScanning] = useState(true)

  useEffect(() => {
    // Kick off a fresh scan immediately when panel mounts
    window.api.scanCastDevices()
    window.api.getCastDevices().then((d) => {
      if ((d as CastDevice[]).length) { setDevices(d as CastDevice[]); setScanning(false) }
    })

    const unsub = window.api.onCastDevices((d) => {
      setDevices(d as CastDevice[])
      setScanning(false)
    })

    // Poll every 15s: fetch cached state + trigger a status refresh
    const poll = setInterval(async () => {
      window.api.scanCastDevices()
      const d = await window.api.getCastDevices()
      setDevices(d as CastDevice[])
      setScanning(false)
    }, 15_000)

    const t = setTimeout(() => setScanning(false), 10_000)
    return () => { unsub(); clearInterval(poll); clearTimeout(t) }
  }, [])

  const anySpectrum = devices.some(isSpectrum)
  const anyBrowser = devices.some(isBrowserCasting)
  const activeCastLabel = devices.find((d) => d.status?.isPlaying)?.status?.statusText
    ?? devices.find((d) => d.status?.isPlaying)?.status?.appName
    ?? 'Casting'

  return (
    <div style={{ padding: '0 0 4px' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px 10px' }}>
        <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
          Cast to TV
        </p>
        {scanning && (
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)' }}>Scanning…</span>
        )}
      </div>

      <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {devices.length === 0 && !scanning && (
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', textAlign: 'center', padding: '8px 0', margin: 0 }}>
            No Chromecasts found on network
          </p>
        )}

        {devices.map((d) => (
          <DeviceRow key={d.id} device={d} onRefresh={(id) => window.api.refreshCastDevice(id)} />
        ))}

        {/* Open Spectrum in browser */}
        {(anyBrowser || anySpectrum) ? (
          // Brave is actively casting — show a disabled "casting" pill
          <div style={{
            marginTop: '6px',
            width: '100%',
            padding: '10px',
            borderRadius: '10px',
            border: '1px solid rgba(167,139,250,0.25)',
            background: 'rgba(167,139,250,0.07)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            boxSizing: 'border-box',
          }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#a78bfa', display: 'inline-block', flexShrink: 0 }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#c4b5fd' }}>{activeCastLabel}</span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        ) : (
          <button
            onClick={() => window.api.openSpectrum()}
            style={{
              marginTop: '6px',
              width: '100%',
              padding: '10px',
              borderRadius: '10px',
              border: anySpectrum ? '1px solid rgba(59,130,246,0.35)' : '1px solid rgba(255,255,255,0.1)',
              background: anySpectrum ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.05)',
              color: anySpectrum ? '#93c5fd' : 'rgba(255,255,255,0.55)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            {watchMethod === 'airplay'
              ? <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg></>
              : <span>🌐</span>}
            {anySpectrum
              ? `${watchProviderName} is casting`
              : watchMethod === 'airplay'
                ? `AirPlay ${watchProviderName} in Safari`
                : `Open ${watchProviderName} in browser`}
          </button>
        )}

        <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.18)', textAlign: 'center', margin: '2px 0 0', lineHeight: 1.4 }}>
          Use Brave's built-in Cast button to send to TV
        </p>
      </div>
    </div>
  )
}
