import { app } from 'electron'
import { join } from 'path'
import { initDb } from './db'
import { WindowManager } from './WindowManager'
import { Scheduler } from './Scheduler'
import { registerPeriodHandlers } from './ipc/periods'
import { registerEntryHandlers } from './ipc/entries'
import { registerSettingsHandlers } from './ipc/settings'
import { registerExportHandlers } from './ipc/export'
import { registerWindowHandlers } from './ipc/window'
import { TrayManager } from './TrayManager'

// Subscribing to this event suppresses Electron's default quit-on-all-closed behavior
app.on('window-all-closed', () => {})

app.whenReady().then(() => {
  initDb()

  const preloadPath = join(__dirname, '../preload/index.js')
  const wm = new WindowManager(preloadPath)
  const scheduler = new Scheduler(wm)

  // IPC handlers — period/settings changes feed back into the scheduler
  registerPeriodHandlers(() => scheduler.reload())
  registerEntryHandlers()
  registerSettingsHandlers()
  registerExportHandlers()
  registerWindowHandlers(wm)

  new TrayManager(wm)
  scheduler.start()

  // Always open the main window on launch
  wm.showMain()
})
