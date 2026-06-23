import { QRCodeSVG } from 'qrcode.react'
import { getProviderByUrl } from '../lib/providers'

interface Props {
  hidden?: boolean
  watchProviderUrl: string
  watchMethod: 'browser' | 'airplay'
}

export default function WatchNowCard({ hidden, watchProviderUrl, watchMethod }: Props) {
  if (hidden) return null
  const provider = getProviderByUrl(watchProviderUrl)
  const name = provider?.name ?? 'Watch Live'
  const channels = provider?.channels ?? 'Fox · FS1'

  if (watchMethod === 'airplay') {
    return (
      <div style={{
        margin: '0 24px 20px',
        borderRadius: '16px',
        border: '1px solid rgba(167,139,250,0.2)',
        background: 'rgba(167,139,250,0.06)',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
      }}>
        {/* AirPlay icon */}
        <div style={{
          width: '52px', height: '52px', borderRadius: '12px', flexShrink: 0,
          background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(167,139,250,0.9)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
            <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
            <line x1="12" y1="20" x2="12.01" y2="20"/>
          </svg>
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(167,139,250,0.9)' }}>{name}</span>
            <span style={{ fontSize: '9px', fontWeight: 600, color: 'rgba(167,139,250,0.55)', background: 'rgba(167,139,250,0.1)', padding: '1px 5px', borderRadius: '4px', letterSpacing: '0.05em' }}>AIRPLAY</span>
          </div>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.4, margin: 0 }}>
            Opens in Safari — click ⊡ AirPlay in the video player to cast to your Apple TV.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      margin: '0 24px 20px',
      borderRadius: '16px',
      border: '1px solid rgba(255,255,255,0.08)',
      background: 'rgba(255,255,255,0.04)',
      padding: '16px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
    }}>
      <div style={{ background: '#0d0d0d', borderRadius: '10px', padding: '8px', flexShrink: 0, border: '1px solid rgba(255,255,255,0.1)' }}>
        <QRCodeSVG value={watchProviderUrl} size={72} bgColor="#0d0d0d" fgColor="#ffffff" level="M" />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.85)', letterSpacing: '-0.01em' }}>{name}</span>
          <span style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '0.05em', color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: '4px' }}>LIVE</span>
        </div>
        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.4, margin: 0 }}>
          Scan with your iPhone to watch on {name}. All WC26 matches on {channels}.
        </p>
      </div>
    </div>
  )
}
