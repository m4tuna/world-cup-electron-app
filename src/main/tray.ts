import { Tray, Menu, nativeImage, BrowserWindow, app, Rectangle } from 'electron'
import path from 'path'
import type { Match } from './api'

let tray: Tray | null = null
let lastLiveMatches: Match[] = []

function getIconPath() {
  return process.env.NODE_ENV === 'development'
    ? path.join(process.cwd(), 'resources', 'icon-tray.png')
    : path.join(process.resourcesPath, 'resources', 'icon-tray.png')
}

function teamLabel(team: Match['homeTeam']): string {
  return team.flagEmoji === '🏳️' ? team.abbreviation : team.flagEmoji
}

function buildTitle(liveMatches: Match[]) {
  if (!liveMatches.length) return '⚽'
  return liveMatches.map((m) => {
    const detail = (m.statusDetail ?? '').toLowerCase()
    let suffix: string
    if (detail.includes('half time') || detail.includes('halftime') || detail === 'ht') {
      suffix = '  HT'
    } else if (detail.includes('delay') || detail.includes('suspend') || detail.includes('interrupt')) {
      suffix = '  ⏸'
    } else if (detail.includes('end of period') || detail.includes('end period')) {
      suffix = '  ET'
    } else if (m.clock) {
      suffix = `  ${m.clock}`
    } else {
      suffix = ''
    }
    return `${teamLabel(m.homeTeam)} ${m.homeScore}-${m.awayScore} ${teamLabel(m.awayTeam)}${suffix}`
  }).join('   ')
}

export function getTrayBounds(): Rectangle | null {
  return tray?.getBounds() ?? null
}

export function createTray(win: BrowserWindow, onShow: () => void) {
  if (tray) { tray.destroy(); tray = null }

  const iconPath = getIconPath()
  let icon = nativeImage.createFromPath(iconPath)
  if (icon.isEmpty()) icon = nativeImage.createEmpty()

  // Mark as template so macOS auto-colors it for light/dark menu bar
  icon.setTemplateImage(true)

  tray = new Tray(icon)
  tray.setTitle(buildTitle([]))
  tray.setToolTip('World Cup 2026')

  // 'mouse-up' is the reliable tray event on macOS; 'click' is not
  tray.on('mouse-up', () => {
    if (win.isVisible() && win.isFocused()) {
      win.hide()
    } else {
      onShow()
    }
  })

  // Right-click only → Quit (via popUpContextMenu, never setContextMenu)
  tray.on('right-click', () => {
    tray?.popUpContextMenu(
      Menu.buildFromTemplate([
        { label: 'Quit World Cup', click: () => app.quit() },
      ])
    )
  })

  return tray
}

export function updateTray(liveMatches: Match[]) {
  if (!tray) return
  lastLiveMatches = liveMatches
  tray.setTitle(buildTitle(liveMatches))
}

export function destroyTray() {
  tray?.destroy(); tray = null
}
