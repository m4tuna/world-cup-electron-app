# Sports Notifier

A macOS menu bar app for live sports scores and notifications. Tracks **World Cup 2026, Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Champions League, MLS, Liga MX, NBA, MLB, and NHL** — all from a single compact panel that lives in your menu bar.

---

## Features

### Menu Bar
- **Idle**: sport icon in your menu bar
- **Live match**: real-time score ticker for your favorite teams across all enabled leagues — `🇦🇷 2-1 🇫🇷  45'` or `LAL 108-102 BOS  Q3`
- **Half time / delay / period end**: shows `HT`, `ET`, or ⏸
- **Click** to open the panel; **right-click** → Quit
- Tray shows subscribed games across **all** enabled leagues simultaneously, not just the active sport

### League Picker
- Click the league name in the panel header to switch sports
- 12 leagues across Soccer, Basketball, Baseball, and Hockey
- Grouped by sport in a scrollable popover

### Scores Tab
- Full match cards for every game today — live, upcoming, and finished
- Player photo backgrounds with team flag / logo overlays
- **Live badge** with pulsing dot and game clock
- **Goal / score events** listed under each team (soccer only)
- Winner indication on finished matches
- TV broadcast badges
- Date navigation with calendar picker; World Cup restricts to tournament dates, other leagues are unrestricted
- Team logos shown for club and non-soccer teams; country flags for international soccer

### Group Standings Tab *(soccer leagues)*
- All group tables with P / W / D / L / GD / GF / Pts
- Advance / bubble / eliminated highlighting
- Click any team to open the team page

### Bracket Tab *(World Cup, Champions League)*
- Full knockout bracket with live scores and winner highlighting
- Cinematic layout with animated trophy SVG for the final

### Leaders Tab *(World Cup)*
- Sortable player stats table: goals, assists, shots on target, yellow/red cards, fouls

### News Tab
- In-app article reader — no browser required

### Team Pages
- Squad roster grouped by position with jersey numbers and photos
- Coach and W-D-L record
- Click any player to drill into their player page

### Player Pages
- Hero card with photo, jersey number, position, and nation badge
- Stats, date of birth, club affiliation

### Match Detail View
- **Feed** — full play-by-play commentary
- **Lineups** — starting XI and bench for both teams
- **Stats** — momentum graph, moneyline odds, grouped stat bars, attendance

### Notifications
- Native macOS notification **N minutes before kickoff** (configurable 5–60 min)
- Optional sound on notification
- **Sport-aware**: soccer and hockey notify per goal; basketball and baseball skip per-basket/run alerts (full-time only)
- Per-match mute or subscribe from the match card

### Settings
- **League Subscriptions** — enable/disable any of the 12 leagues and pick favorite teams per league, all in one place regardless of which sport is active
- **Notifications** — timing slider, sound, per-event toggles (goal scored, half time, full time) with sound picker and preview
- **Phone notifications** — push to iPhone via Expo Go companion app
- **Watch** — TV provider picker (Spectrum, YouTube TV, Hulu, ESPN+, etc.) and launch method (browser or AirPlay via Safari)
- **Alerts** — reset all per-match overrides

---

## Subscription Model

Notifications require **explicit team selection** — enabling a league shows you scores but doesn't generate any alerts. To receive notifications:

1. Open Settings → **League Subscriptions**
2. Expand a league (▾) and pick your favorite teams
3. Matches with those teams will trigger pre-match and in-game notifications

You can also **Subscribe** or **Mute** individual matches directly from the scoreboard as one-off overrides.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | [Electron](https://www.electronjs.org/) + [electron-vite](https://electron-vite.org/) |
| UI | React 18 + TypeScript |
| State | [Zustand](https://github.com/pmndrs/zustand) |
| Settings persistence | [electron-store](https://github.com/sindresorhus/electron-store) |
| Match data | ESPN public API (`site.api.espn.com`) |
| Player photos | [TheSportsDB](https://www.thesportsdb.com/) free tier |
| Cast detection | mDNS scan for Chromecast / Apple TV devices |
| Phone push | [Expo Go](https://expo.dev/) + Expo Push API |

---

## Data Sources

### ESPN (no API key required)

All sports follow the same URL pattern:

```
https://site.api.espn.com/apis/site/v2/sports/{sport}/{league}/scoreboard
https://site.api.espn.com/apis/v2/sports/{sport}/{league}/standings
https://site.api.espn.com/apis/site/v2/sports/{sport}/{league}/teams
```

Supported sport/league slugs: `soccer/fifa.world`, `soccer/eng.1`, `soccer/esp.1`, `soccer/ita.1`, `soccer/ger.1`, `soccer/fra.1`, `soccer/uefa.champions`, `soccer/usa.1`, `soccer/mex.1`, `basketball/nba`, `baseball/mlb`, `hockey/nhl`

- Polled every **60 s** during live matches, every **5 min** otherwise
- All enabled leagues are polled simultaneously

### TheSportsDB (free tier)
- Player headshot photos via `searchplayers.php?p={name}`
- Cached in memory per session

---

## Getting Started

```bash
# Install dependencies
npm install

# Development (Electron + Vite HMR)
npm run dev

# Production build (.app bundle)
npm run build
```

### Requirements
- macOS 12+
- Node.js 18+

---

## Architecture

```
ESPN API ──▶ poller.ts (all enabled leagues, Promise.allSettled)
                │
                ├─ active league matches ──IPC──▶ renderer matchStore
                │
                ├─ all leagues: subscribed live matches ──▶ tray.ts
                │
                └─ notifications.ts
                    ├─ pre-match reminder (N min before)
                    ├─ score change (soccer/hockey only)
                    ├─ half time
                    └─ full time
```

**Main process** (`src/main/`): API fetching, multi-league polling, notifications, tray, IPC handlers, cast detection.

**Renderer** (`src/renderer/`): React UI, Zustand store, all visual components. Communicates with main exclusively through `window.api` contextBridge.

**Preload** (`src/preload/`): Secure `contextBridge` — no `nodeIntegration`, explicit allowlist of exposed methods.

---

## Project Structure

```
src/
  main/
    index.ts          App lifecycle, window + tray creation
    tray.ts           Menu bar icon and score ticker
    poller.ts         Multi-league ESPN polling loop
    notifications.ts  macOS Notification + sound trigger
    api.ts            ESPN + TheSportsDB HTTP clients
    leagues.ts        Main-process league config (ESPN slugs, behavior flags)
    store.ts          electron-store: settings, subscriptions, team favorites
    ipc.ts            All ipcMain handlers
    news.ts           News feed + article fetching
    phone.ts          Expo push notification client
    cast.ts           mDNS Chromecast discovery
  preload/
    index.ts          contextBridge API surface
  renderer/src/
    App.tsx           League picker, tab layout, panel resize
    lib/
      leagues.ts      Renderer league config (icons, sport labels, tab visibility)
      teams.ts        WC team list with flag emojis
      sounds.ts       Sound library
    components/
      MatchCard.tsx       Score card: logos/flags, score, events, channels
      MatchDetail.tsx     Feed / Lineups / Stats drill-down
      GroupStandings.tsx  Group standings tables
      Bracket.tsx         Knockout bracket tree
      Leaders.tsx         Sortable player stats table
      NewsFeed.tsx        Article list
      ArticleReader.tsx   In-app article reader
      TeamPage.tsx        Squad roster, coach, record
      PlayerPage.tsx      Player bio, stats, club
      SettingsPanel.tsx   League subscriptions + notification prefs
      CastPanel.tsx       Chromecast device list
    store/
      matchStore.ts     Zustand store
    types.ts            Shared TypeScript interfaces
  phone-companion/      Expo Go iOS companion app (push token + match feed)
```

---

## License

MIT
