export interface Provider {
  id: string
  name: string
  url: string
  channels: string  // brief channel description
  category: 'streaming' | 'direct' | 'cable'
}

export const PROVIDERS: Provider[] = [
  // Streaming — no cable box needed
  { id: 'fubo',         name: 'FuboTV',       url: 'https://www.fubo.tv/welcome',          channels: 'Fox · FS1 · Telemundo', category: 'streaming' },
  { id: 'youtube-tv',   name: 'YouTube TV',   url: 'https://tv.youtube.com',               channels: 'Fox · FS1 · Telemundo', category: 'streaming' },
  { id: 'hulu',         name: 'Hulu Live',    url: 'https://www.hulu.com/live-tv',         channels: 'Fox · FS1',             category: 'streaming' },
  { id: 'sling',        name: 'Sling TV',     url: 'https://watch.sling.com',              channels: 'Fox · FS1',             category: 'streaming' },
  { id: 'directv',      name: 'DirecTV',      url: 'https://stream.directv.com',           channels: 'Fox · FS1',             category: 'streaming' },
  // Direct / Free with cable login
  { id: 'foxsports',    name: 'Fox Sports',   url: 'https://www.foxsports.com/live',       channels: 'Fox · FS1 direct',      category: 'direct'    },
  { id: 'peacock',      name: 'Peacock',      url: 'https://www.peacocktv.com',            channels: 'Telemundo en español',  category: 'direct'    },
  // Cable / Satellite
  { id: 'spectrum',     name: 'Spectrum',     url: 'https://watch.spectrum.net',           channels: 'Fox · FS1 · Telemundo', category: 'cable'     },
  { id: 'xfinity',      name: 'Xfinity',      url: 'https://tv.xfinity.com',              channels: 'Fox · FS1 · Telemundo', category: 'cable'     },
]

export const DEFAULT_PROVIDER_URL = 'https://watch.spectrum.net'

export function getProviderByUrl(url: string): Provider | undefined {
  return PROVIDERS.find((p) => p.url === url)
}

export const CATEGORY_LABELS: Record<Provider['category'], string> = {
  streaming: 'Streaming',
  direct: 'Free / Direct',
  cable: 'Cable',
}
