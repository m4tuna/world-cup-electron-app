import https from 'https'
import http from 'http'
import { URL } from 'url'
import zlib from 'zlib'

export interface NewsItem {
  id: string
  title: string
  description: string
  url: string
  imageUrl?: string
  pubDate: string
  source: string
}

function httpGet(url: string, redirects = 5): Promise<string> {
  return new Promise((resolve, reject) => {
    if (redirects <= 0) { reject(new Error('Too many redirects')); return }
    const parsed = new URL(url)
    const lib = parsed.protocol === 'https:' ? https : http
    const req = lib.request({
      hostname: parsed.hostname,
      port: parsed.port || undefined,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xml,text/xml,*/*',
        'Accept-Encoding': 'gzip, deflate',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const next = res.headers.location.startsWith('http')
          ? res.headers.location
          : `${parsed.origin}${res.headers.location}`
        res.resume()
        httpGet(next, redirects - 1).then(resolve).catch(reject)
        return
      }
      const chunks: Buffer[] = []
      res.on('data', (c: Buffer) => chunks.push(c))
      res.on('end', () => {
        const raw = Buffer.concat(chunks)
        const enc = res.headers['content-encoding'] ?? ''
        try {
          if (enc === 'gzip') {
            zlib.gunzip(raw, (e, b) => e ? reject(e) : resolve(b.toString('utf8')))
          } else if (enc === 'deflate') {
            zlib.inflate(raw, (e, b) => e ? reject(e) : resolve(b.toString('utf8')))
          } else if (enc === 'br') {
            zlib.brotliDecompress(raw, (e, b) => e ? reject(e) : resolve(b.toString('utf8')))
          } else {
            resolve(raw.toString('utf8'))
          }
        } catch (e) { reject(e) }
      })
      res.on('error', reject)
    })
    req.on('error', reject)
    req.end()
  })
}

function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
}

function parseRss(xml: string, source: string): NewsItem[] {
  const items: NewsItem[] = []
  for (const match of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const item = match[1]

    const title = decodeHtml((
      item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]>/)?.[1] ??
      item.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? ''
    ).trim())

    // BBC uses plain URL; some feeds use CDATA
    const rawLink = (
      item.match(/<link><!\[CDATA\[([\s\S]*?)\]\]>/)?.[1] ??
      item.match(/<link>\s*(https?:\/\/[^\s<]+?)\s*<\/link>/)?.[1] ??
      item.match(/<guid[^>]*isPermaLink="true"[^>]*>(https?:\/\/[^\s<]+)<\/guid>/)?.[1] ??
      ''
    ).trim()
    const link = decodeHtml(rawLink)

    const rawDesc =
      item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]>/)?.[1] ??
      item.match(/<description>([\s\S]*?)<\/description>/)?.[1] ?? ''
    const desc = decodeHtml(rawDesc.replace(/<[^>]+>/g, '')).replace(/<[^>]+>/g, '').trim()

    const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() ?? ''

    const imageUrl =
      item.match(/<media:thumbnail[^>]+url="([^"]+)"/)?.[1] ??
      item.match(/<media:content[^>]+url="([^"]+)"/)?.[1] ??
      item.match(/<enclosure[^>]+url="([^"]+\.(?:jpg|jpeg|png|webp))"/i)?.[1] ??
      undefined

    if (title && link) {
      items.push({ id: link, title, description: desc, url: link, imageUrl, pubDate, source })
    }
  }
  return items
}

export async function fetchNewsFeed(): Promise<NewsItem[]> {
  const [bbc, guardian] = await Promise.allSettled([
    httpGet('https://feeds.bbci.co.uk/sport/football/world-cup/rss.xml'),
    httpGet('https://www.theguardian.com/football/rss'),
  ])

  const bbcItems = bbc.status === 'fulfilled' ? parseRss(bbc.value, 'BBC Sport') : []
  const guardianItems = guardian.status === 'fulfilled' ? parseRss(guardian.value, 'The Guardian') : []

  // Merge, deduplicate by title, sort newest first
  const seen = new Set<string>()
  const merged: NewsItem[] = []
  for (const item of [...bbcItems, ...guardianItems]) {
    const key = item.title.toLowerCase().slice(0, 60)
    if (!seen.has(key)) { seen.add(key); merged.push(item) }
  }

  merged.sort((a, b) => {
    const da = new Date(a.pubDate).getTime() || 0
    const db = new Date(b.pubDate).getTime() || 0
    return db - da
  })

  return merged.slice(0, 30)
}

export async function fetchArticleHtml(url: string): Promise<string> {
  return httpGet(url)
}
