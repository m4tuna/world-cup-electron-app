import { QRCodeSVG } from 'qrcode.react'

const SPECTRUM_URL = 'https://watch.spectrum.net'

export default function SpectrumQR({ hidden }: { hidden?: boolean }) {
  if (hidden) return null
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
      {/* Dark-styled QR code */}
      <div style={{
        background: '#0d0d0d',
        borderRadius: '10px',
        padding: '8px',
        flexShrink: 0,
        border: '1px solid rgba(255,255,255,0.1)',
      }}>
        <QRCodeSVG
          value={SPECTRUM_URL}
          size={72}
          bgColor="#0d0d0d"
          fgColor="#ffffff"
          level="M"
        />
      </div>

      {/* Text */}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.85)', letterSpacing: '-0.01em' }}>
            Spectrum TV
          </span>
          <span style={{
            fontSize: '9px',
            fontWeight: 600,
            letterSpacing: '0.05em',
            color: 'rgba(255,255,255,0.4)',
            background: 'rgba(255,255,255,0.08)',
            padding: '1px 5px',
            borderRadius: '4px',
          }}>
            LIVE
          </span>
        </div>
        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.4, margin: 0 }}>
          Scan with your iPhone to watch on Spectrum. All WC26 matches on FOX &amp; FS1.
        </p>
      </div>
    </div>
  )
}
