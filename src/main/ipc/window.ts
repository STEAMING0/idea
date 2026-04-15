import { ipcMain, BrowserWindow } from 'electron'
import type { WindowManager } from '../WindowManager'

export function registerWindowHandlers(wm: WindowManager): void {
  ipcMain.handle('window:close', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    win?.hide()
  })

  ipcMain.handle('window:openSettings', () => wm.showSettings())
  ipcMain.handle('window:openLogViewer', () => wm.showLogViewer())
}
