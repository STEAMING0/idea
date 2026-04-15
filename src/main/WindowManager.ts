import { BrowserWindow } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { WINDOW_QUICK_ENTRY, WINDOW_SETTINGS, WINDOW_LOG_VIEWER } from '@shared/constants'
import type { IpcInput } from '@shared/types/ipc'

type WindowName = typeof WINDOW_QUICK_ENTRY | typeof WINDOW_SETTINGS | typeof WINDOW_LOG_VIEWER

export class WindowManager {
  private windows = new Map<WindowName, BrowserWindow>()
  private preloadPath: string

  constructor(preloadPath: string) {
    this.preloadPath = preloadPath
  }

  private getOrCreate(
    name: WindowName,
    opts: Electron.BrowserWindowConstructorOptions,
    urlSlug: string
  ): BrowserWindow {
    const existing = this.windows.get(name)
    if(existing && !existing.isDestroyed()) return existing

    const win = new BrowserWindow({
      ...opts,
      show: false,
      webPreferences: {
        preload: this.preloadPath,
        sandbox: false,
        contextIsolation: true
      }
    })

    // Hide on close instead of destroying — keeps the app alive in the tray
    win.on('close', (e) => {
      e.preventDefault()
      win.hide()
    })

    if(is.dev && process.env['ELECTRON_RENDERER_URL']){
      win.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/windows/${urlSlug}/index.html`)
    } else {
      win.loadFile(join(__dirname, `../renderer/windows/${urlSlug}/index.html`))
    }

    this.windows.set(name, win)
    return win
  }

  showQuickEntry(data: IpcInput<'notify:periodEnd'>): void {
    const win = this.getOrCreate(
      WINDOW_QUICK_ENTRY,
      { width: 480, height: 300, frame: false, alwaysOnTop: true, resizable: false },
      'quick-entry'
    )

    const sendAndShow = () => {
      win.webContents.send('notify:periodEnd', data)
      win.show()
      win.center()
      win.focus()
    }

    if(win.webContents.isLoading()){
      win.webContents.once('did-finish-load', sendAndShow)
    } else {
      sendAndShow()
    }
  }

  showSettings(): void {
    const win = this.getOrCreate(WINDOW_SETTINGS, { width: 640, height: 520 }, 'settings')
    this.showWhenReady(win)
  }

  showLogViewer(): void {
    const win = this.getOrCreate(WINDOW_LOG_VIEWER, { width: 760, height: 600 }, 'log-viewer')
    this.showWhenReady(win)
  }

  // ready-to-show fires only on the first load; for subsequent opens the window
  // is already loaded but hidden — so we check isLoading() directly
  private showWhenReady(win: BrowserWindow): void {
    if(win.webContents.isLoading()){
      win.webContents.once('did-finish-load', () => { win.show(); win.focus() })
    } else {
      win.show()
      win.focus()
    }
  }
}
