# World Cup 2026 Notifier

A macOS menu bar app for the 2026 FIFA World Cup (USA · Canada · Mexico). Lives in your menu bar, shows live scores, sends match notifications, and gives you a full tournament dashboard in a compact panel.

![World Cup 2026](resources/icon-tray.png)

---

## Features

### Menu Bar
- **Idle**: ⚽ icon in your menu bar
- **Live match**: score ticker updates in real time — `🇦🇷 2-1 🇫🇷  45'`
- **Half time / delay**: shows `HT` or ⏸ suffix
- **Click** to open the panel; **right-click** → Quit

### Today Tab
- Full match cards for every game today — live, upcoming, and finished
- Player photo backgrounds (TheSportsDB) with team flag + name overlays
- **Live badge** with pulsing dot and game clock
- **Goal scorers** listed under each team
- **Winner indication** on finished matches — winning score in green, losing side dimmed, full-country winner label
- TV broadcast badges (Fox, FS1, Telemundo, Univision, Peacock)
- Mute individual match notifications per match

### Schedule Tab
- All upcoming matches grouped by day
- Compact rows with teams, kickoff time, and broadcast channel
- Click any row to open the match detail view

### Group Standings Tab
- All 12 group tables with P / W / D / L / GD / GF / Pts
- **Green highlight** — confirmed advance to Round of 32
- **Amber highlight** — best 3rd-place bubble teams
- **Dimmed** — eliminated teams
- Sorted by points, then goal difference, then goals scored
- **Click any team** to open that nation's team page
- Powered by ESPN's official standings API

### Bracket Tab
- Full knockout bracket (Round of 32 → Round of 16 → QF → SF → Final)
- Cinematic layout with gold-tinted Final column and animated World Cup Trophy SVG
- Shows confirmed teams once the group stage concludes; slot labels (e.g. "Group A 2nd Place") before teams are determined
- Live scores and winner highlighting during knockout matches
- **Click any team** to open that nation's team page

### Team Pages
- Full squad roster grouped by position (GK → DEF → MID → FWD) with jersey numbers and photos
- Coach and W-D-L record
- **Click any player** to drill into their player page
- Links through from match cards (flag/name), standings, bracket, and match detail lineups
- "View full page on ESPN ↗" quick-link

### Player Pages
- Hero card with photo background, jersey number, name, position, and nation badge
- Stat pills: age, height, weight, nationality
- Date of birth and club affiliation
- **Team badge is clickable** — navigates back to the team roster
- "View full profile on ESPN ↗" quick-link
- Reachable by clicking goal scorer names on match cards, or any player in a lineup or team roster

### Match Detail View
- Click any match card or schedule row to drill in
- **Feed tab** — full play-by-play commentary with custom SVG icons per event type (goal, yellow/red card, substitution, shot, corner, VAR, foul, offside…)
- **Lineups tab** — starting XI and bench for both teams with jersey numbers and positions
- **Stats tab**
  - Momentum graph (5-min attack buckets, home↑ / away↓)
  - DraftKings 3-way moneyline odds with spread and over/under
  - Grouped stat bars: Attack / Defense / Passing
  - Attendance figure
- Player photo split background in the score header with live clock badge

### Notifications
- Native macOS notification **N minutes before kickoff** (configurable 5–60 min, default 30)
- Optional whistle sound on notification
- Per-match mute from the match card or schedule row
- Click notification → focuses the app and opens that match

### Settings (⚙️ gear icon)
- **Notify before kickoff** — slider 5–60 min
- **Sound alert** — toggle
- **Muted matches** — count + reset all
- Spectrum TV quick-launch button with cast detection

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | [Electron](https://www.electronjs.org/) + [electron-vite](https://electron-vite.org/) |
| UI | React 18 + TypeScript |
| State | [Zustand](https://github.com/pmndrs/zustand) |
| Settings persistence | [electron-store](https://github.com/sindresorhus/electron-store) |
| Match data | [ESPN unofficial API](https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard) |
| Player photos | [TheSportsDB](https://www.thesportsdb.com/) free tier |
| Standings | ESPN `v2` standings endpoint |
| Bracket | ESPN scoreboard with knockout-round date range |
| Cast detection | mDNS scan for Chromecast devices on local network |

---

## Data Sources

### ESPN (no API key required)
- **Live scoreboard**: `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard`
- **Match summary** (lineups, stats, commentary, odds): `…/summary?event={id}`
- **Standings**: `https://site.api.espn.com/apis/v2/sports/soccer/fifa.world/standings`
- **Bracket / knockout schedule**: `…/scoreboard?dates=20260628-20260719`
- Polled every 60 s during live matches, every 5 min otherwise

### TheSportsDB (free tier)
- Player headshot photos via `searchplayers.php?p={name}`
- Cached in memory per session to avoid redundant requests

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
ESPN API ──60s poll──▶ poller.ts ──IPC──▶ renderer matchStore
                           │
                      scheduler.ts  (checks upcoming matches every 30 s)
                           │
              N min before kickoff?
                           │
                   notifications.ts
                    ├─ macOS Notification
                    └─ IPC → renderer plays whistle sound
                           │
                       tray.ts  updates menu bar title
```

**Main process** (`src/main/`): API fetching, polling, scheduling, notifications, tray, IPC handlers, cast detection via mDNS.

**Renderer** (`src/renderer/`): React UI, Zustand store, all visual components. Communicates with main exclusively through the `window.api` contextBridge.

**Preload** (`src/preload/`): Secure `contextBridge` — no `nodeIntegration`, no remote module, explicit allowlist of exposed methods.

---

## Project Structure

```
src/
  main/
    index.ts          App lifecycle, window + tray creation
    tray.ts           Menu bar icon and score ticker
    poller.ts         ESPN polling loop, IPC broadcast
    scheduler.ts      Pre-match notification scheduler
    notifications.ts  macOS Notification + sound trigger
    api.ts            ESPN + TheSportsDB HTTP clients
    store.ts          electron-store: settings + muted matches
    ipc.ts            All ipcMain handlers
    cast.ts           mDNS Chromecast discovery
  preload/
    index.ts          contextBridge API surface
  renderer/src/
    App.tsx           Tab layout + panel resize logic
    components/
      MatchCard.tsx       Big card: photos, score, goals, channels, mute
      MatchDetail.tsx     Feed / Lineups / Stats drill-down
      GroupStandings.tsx  12-group standings tables
      Bracket.tsx         Knockout bracket tree with Trophy SVG
      TeamPage.tsx        Squad roster, coach, record
      PlayerPage.tsx      Player bio, stats, club
      LiveBadge.tsx       Pulsing LIVE dot + clock
      UpcomingMatch.tsx   Compact schedule row
      ChannelBadge.tsx    TV broadcast pill
      SettingsPanel.tsx   Notification prefs
      CastPanel.tsx       Chromecast device list
    store/
      matchStore.ts     Zustand store
    types.ts            Shared TypeScript interfaces
```

---

## License

MIT
