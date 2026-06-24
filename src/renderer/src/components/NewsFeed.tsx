import { useEffect, useState } from 'react'

interface NewsItem {
  id: string
  title: string
  description: string
  url: string
  imageUrl?: string
  pubDate: string
  source: string
}

interface Props {
  onOpenArticle: (url: string, title: string) => void
}


function timeAgo(pubDate: string): string {
  if (!pubDate) return ''
  const d = new Date(pubDate)
  if (isNaN(d.getTime())) return ''
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

async function loadFeed(): Promise<NewsItem[]> {
  return window.api.getNewsFeed() as Promise<NewsItem[]>
}

export default function NewsFeed({ onOpenArticle }: Props) {
  const [items, setItems] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(false)
    loadFeed()
      .then((feed) => { setItems(feed); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', padding: '12px 0' }}>
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: '12px', padding: '12px 16px', alignItems: 'flex-start' }}>
            <div style={{ width: '80px', height: '56px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '3px' }}>
              <div style={{ height: '13px', borderRadius: '4px', background: 'rgba(255,255,255,0.07)', width: '85%' }} />
              <div style={{ height: '13px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', width: '60%' }} />
              <div style={{ height: '10px', borderRadius: '4px', background: 'rgba(255,255,255,0.04)', width: '30%' }} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error || items.length === 0) {
    return (
      <div style={{ padding: '40px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>
          {error ? 'Could not load news.' : 'No articles found.'}
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {items.map((item, i) => (
        <button
          key={item.id}
          onClick={() => onOpenArticle(item.url, item.title)}
          style={{
            display: 'flex', gap: '12px', padding: '12px 16px',
            background: 'transparent',
            borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.05)',
            borderLeft: 'none', borderRight: 'none', borderBottom: 'none',
            cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <div style={{ width: '80px', height: '56px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', flexShrink: 0, overflow: 'hidden' }}>
            {item.imageUrl && (
              <img
                src={item.imageUrl}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px', paddingTop: '2px' }}>
            <p style={{
              fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.88)',
              lineHeight: 1.35, margin: 0,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {item.title}
            </p>
            {item.description && item.description !== 'null' && (
              <p style={{
                fontSize: '11px', color: 'rgba(255,255,255,0.38)', lineHeight: 1.4, margin: 0,
                display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>
                {item.description}
              </p>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '1px' }}>
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', fontWeight: 600 }}>{item.source}</span>
              {item.pubDate && (
                <>
                  <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.15)' }}>·</span>
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.22)' }}>{timeAgo(item.pubDate)}</span>
                </>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
