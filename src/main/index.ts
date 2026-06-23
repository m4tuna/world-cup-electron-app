import { app, BrowserWindow, shell, screen, ipcMain } from 'electron'
import path from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { createTray, getTrayBounds } from './tray'
import { startPolling, stopPolling } from './poller'
import { registerIpcHandlers } from './ipc'
import { store } from './store'
import { startDiscovery, stopDiscovery } from './cast'

let mainWindow: BrowserWindow | null = null
let isQuitting = false

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}
app.on('second-instance', () => { if (mainWindow) showPanel() })

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 500,
    height: 700,
    show: false,
    frame: false,
    transparent: true,         // lets the caret triangle show against desktop
    hasShadow: false,          // card provides its own CSS shadow
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false,
    },
  })

  mainWindow.on('blur', () => { if (!isQuitting) mainWindow?.hide() })
  mainWindow.on('close', (e) => { if (!isQuitting) { e.preventDefault(); mainWindow!.hide() } })
  mainWindow.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' } })

  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

export function showPanel() {
  if (!mainWindow) return
  const trayBounds = getTrayBounds()
  if (!trayBounds) { mainWindow.show(); mainWindow.focus(); return }

  const { width: winW } = mainWindow.getBounds()
  const display = screen.getDisplayNearestPoint({ x: trayBounds.x, y: trayBounds.y })
  const wa = display.workArea

  // Center window on tray icon, flush against bottom of menu bar
  let x = Math.round(trayBounds.x + trayBounds.width / 2 - winW / 2)
  const y = Math.round(trayBounds.y + trayBounds.height)   // flush, no gap

  // Clamp to screen — track how much we shifted so caret can compensate
  const clampedX = Math.max(wa.x + 4, Math.min(x, wa.x + wa.width - winW - 4))
  // caretX: pixel position of tray-center relative to window left edge
  const caretX = Math.round((trayBounds.x + trayBounds.width / 2) - clampedX)

  // Fill from menu bar to bottom of screen
  const maxH = Math.round(wa.y + wa.height - y - 8)
  mainWindow.setSize(winW, maxH, false)
  mainWindow.setPosition(clampedX, y, false)
  mainWindow.webContents.send('panel:caret', caretX)
  mainWindow.show()
  mainWindow.focus()
}

// Renderer sends desired height; resize window to fit content, capped at available screen
ipcMain.on('panel:resize', (_, desiredH: number) => {
  if (!mainWindow) return
  const trayBounds = getTrayBounds()
  if (!trayBounds) return
  const display = screen.getDisplayNearestPoint({ x: trayBounds.x, y: trayBounds.y })
  const wa = display.workArea
  const y = Math.round(trayBounds.y + trayBounds.height)
  const maxH = Math.round(wa.y + wa.height - y - 8)
  const h = Math.min(Math.max(Math.round(desiredH), 200), maxH)
  const { width } = mainWindow.getBounds()
  mainWindow.setSize(width, h, false)
})

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.m42.worldcup-notifier')
  app.on('browser-window-created', (_, w) => optimizer.watchWindowShortcuts(w))

  const win = createWindow()
  createTray(win, showPanel)   // pass showPanel directly — no circular import
  registerIpcHandlers(win)
  startPolling(win)
  startDiscovery((devices) => {
    if (!win.isDestroyed()) win.webContents.send('cast:devices', devices)
  })

  app.on('activate', () => showPanel())
})

app.on('before-quit', () => { isQuitting = true; stopPolling(); stopDiscovery() })
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
