// Network name → {bg, text, label} — no emojis, clean brand-style pill
const NETWORKS: Record<string, { bg: string; border: string; color: string; label: string }> = {
  fox:       { bg: '#001f5e', border: '#1a3a8f', color: '#ffffff', label: 'FOX' },
  fs1:       { bg: '#001f5e', border: '#1a3a8f', color: '#ffffff', label: 'FS1' },
  tele:      { bg: '#4a0080', border: '#6b00b3', color: '#ffffff', label: 'TELEMUNDO' },
  telemundo: { bg: '#4a0080', border: '#6b00b3', color: '#ffffff', label: 'TELEMUNDO' },
  univision: { bg: '#006400', border: '#008000', color: '#ffffff', label: 'UNIVISION' },
  peacock:   { bg: '#000000', border: '#333333', color: '#ffffff', label: 'PEACOCK' },
  nbc:       { bg: '#000000', border: '#333333', color: '#ffffff', label: 'NBC' },
  deportes:  { bg: '#001f5e', border: '#1a3a8f', color: '#ffffff', label: 'FOX DEPORTES' },
}

function resolve(name: string) {
  const n = name.toLowerCase()
  if (n.includes('deportes')) return NETWORKS.deportes
  if (n === 'fox' || n === 'fox one') return NETWORKS.fox
  if (n.includes('fs1') || n === 'fs 1') return NETWORKS.fs1
  if (n.includes('tele')) return NETWORKS.tele
  if (n.includes('univision')) return NETWORKS.univision
  if (n.includes('peacock')) return NETWORKS.peacock
  if (n.includes('nbc')) return NETWORKS.nbc
  return null
}

interface Props {
  broadcasts: string[]
}

export default function ChannelBadge({ broadcasts }: Props) {
  if (!broadcasts.length) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
      {broadcasts.slice(0, 3).map((ch) => {
        const net = resolve(ch)
        if (!net) return null
        return (
          <span
            key={ch}
            style={{
              background: net.bg,
              border: `1px solid ${net.border}`,
              color: net.color,
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.06em',
              padding: '3px 8px',
              borderRadius: '4px',
              display: 'inline-block',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
            }}
          >
            {net.label}
          </span>
        )
      })}
    </div>
  )
}
