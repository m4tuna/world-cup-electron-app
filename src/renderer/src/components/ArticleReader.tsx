import { useEffect, useState } from 'react'
import { Readability } from '@mozilla/readability'

interface Props {
  url: string
  title: string
  onBack: () => void
  onOpenExternal: (url: string) => void
}

interface ParsedArticle {
  title: string
  byline: string | null
  content: string
  siteName: string | null
}

const READER_STYLE = `
  .rb { color: rgba(255,255,255,0.82); font-size: 15px; line-height: 1.75; }
  .rb p { margin: 0 0 18px; }
  .rb h1 { color: #fff; font-size: 20px; font-weight: 800; line-height: 1.3; margin: 28px 0 12px; }
  .rb h2 { color: #fff; font-size: 17px; font-weight: 700; line-height: 1.3; margin: 24px 0 10px; }
  .rb h3, .rb h4 { color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 600; margin: 18px 0 8px; }
  .rb a { color: rgba(74,222,128,0.8); text-decoration: none; }
  .rb a:hover { text-decoration: underline; }
  .rb img { max-width: 100%; height: auto; border-radius: 10px; display: block; margin: 20px auto; }
  .rb figure { margin: 20px 0; }
  .rb figcaption { font-size: 11px; color: rgba(255,255,255,0.3); text-align: center; margin-top: 6px; line-height: 1.5; }
  .rb blockquote { border-left: 3px solid rgba(74,222,128,0.5); margin: 20px 0; padding: 4px 0 4px 16px; color: rgba(255,255,255,0.55); font-style: italic; }
  .rb ul, .rb ol { padding-left: 22px; margin: 0 0 18px; }
  .rb li { margin-bottom: 6px; }
  .rb strong, .rb b { color: rgba(255,255,255,0.95); font-weight: 600; }
  .rb hr { border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 24px 0; }
  .rb table { width: 100%; border-collapse: collapse; font-size: 13px; margin: 16px 0; }
  .rb th { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.6); font-weight: 600; padding: 8px 10px; text-align: left; }
  .rb td { padding: 7px 10px; border-top: 1px solid rgba(255,255,255,0.06); }
  .rb iframe, .rb video { max-width: 100%; border-radius: 10px; display: block; margin: 20px auto; aspect-ratio: 16/9; width: 100%; }
`

export default function ArticleReader({ url, title: initialTitle, onBack, onOpenExternal }: Props) {
  const [article, setArticle] = useState<ParsedArticle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(false)
    setArticle(null)

    fetch(url, { headers: { 'Accept': 'text/html,*/*' } })
      .then((r) => r.text())
      .then((html) => {
        const doc = new DOMParser().parseFromString(html, 'text/html')
        // Set base so relative URLs resolve correctly
        const base = doc.createElement('base')
        base.href = url
        doc.head.prepend(base)
        const result = new Readability(doc, { charThreshold: 20 }).parse()
        if (result) {
          setArticle({ title: result.title, byline: result.byline, content: result.content, siteName: result.siteName })
        } else {
          setError(true)
        }
        setLoading(false)
      })
      .catch(() => { setError(true); setLoading(false) })
  }, [url])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <style>{READER_STYLE}</style>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        flexShrink: 0,
      }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '12px', padding: '4px 6px 4px 0', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'inherit' }}
        >
          ← Back
        </button>
        <button
          onClick={() => onOpenExternal(url)}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '11px', fontFamily: 'inherit', padding: '4px' }}
        >
          ↗ Open
        </button>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 48px' }}>

        {loading && (
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ height: '190px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)' }} />
            <div style={{ height: '24px', borderRadius: '5px', background: 'rgba(255,255,255,0.08)', width: '90%' }} />
            <div style={{ height: '24px', borderRadius: '5px', background: 'rgba(255,255,255,0.06)', width: '65%' }} />
            <div style={{ height: '12px', borderRadius: '4px', background: 'rgba(255,255,255,0.04)', width: '38%', marginBottom: '4px' }} />
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} style={{ height: '14px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', width: i % 4 === 3 ? '60%' : '100%' }} />
            ))}
          </div>
        )}

        {error && !loading && (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '16px' }}>
              Couldn't load this article.
            </p>
            <button
              onClick={() => onOpenExternal(url)}
              style={{ padding: '8px 18px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Open in browser ↗
            </button>
          </div>
        )}

        {article && !loading && (
          <div style={{ padding: '22px 20px 0' }}>
            <h1 style={{ fontSize: '21px', fontWeight: 800, color: '#fff', lineHeight: 1.25, margin: '0 0 10px', letterSpacing: '-0.02em' }}>
              {article.title || initialTitle}
            </h1>

            {(article.byline || article.siteName) && (
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '16px' }}>
                {article.byline && <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{article.byline}</span>}
                {article.byline && article.siteName && <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.15)' }}>·</span>}
                {article.siteName && <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>{article.siteName}</span>}
              </div>
            )}

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', marginBottom: '20px' }} />

            <div className="rb" dangerouslySetInnerHTML={{ __html: article.content }} />
          </div>
        )}
      </div>
    </div>
  )
}
