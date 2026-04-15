import { app } from 'electron'
import { join } from 'path'
import { initDb, getAllSettings, getAllPeriods } from './db'
import { WindowManager } from './WindowManager'
import { TrayManager } from './TrayManager'
import { Scheduler } from './Scheduler'
import { registerPeriodHandlers } from './ipc/periods'
import { registerEntryHandlers } from './ipc/entries'
import { registerSettingsHandlers } from './ipc/settings'
import { registerExportHandlers } from './ipc/export'
import { registerWindowHandlers } from './ipc/window'

// Subscribing to this event suppresses Electron's default quit-on-all-closed behavior
app.on('window-all-closed', () => {})

app.whenReady().then(() => {
  // Hide from macOS dock — the app lives in the menu bar only
  if(process.platform === 'darwin') app.dock?.hide()

  initDb()

  const settings = getAllSettings()

  // Sync autostart with OS on every launch in case the setting drifted
  // Note: setLoginItemSettings is a no-op on Linux; a .desktop file approach is needed there
  app.setLoginItemSettings({ openAtLogin: settings.autostart })

  const preloadPath = join(__dirname, '../preload/index.js')
  const wm = new WindowManager(preloadPath)
  const scheduler = new Scheduler(wm)

  // IPC handlers — period/settings changes feed back into the scheduler
  registerPeriodHandlers(() => scheduler.reload())
  registerEntryHandlers((periodId, snoozeUntil) => scheduler.snooze(periodId, snoozeUntil))
  registerSettingsHandlers()
  registerExportHandlers()
  registerWindowHandlers(wm)

  // Tray must be created before scheduler fires (notifications need an app icon on some platforms)
  new TrayManager(wm)

  scheduler.start()

  // Open settings on first launch so the user can configure periods
  if(getAllPeriods().length === 0) wm.showSettings()
})
