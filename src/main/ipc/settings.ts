import { ipcMain } from 'electron'
import { getAllSettings, setSetting } from '../db'
import type { IpcInput } from '@shared/types/ipc'

export function registerSettingsHandlers(): void {
  ipcMain.handle('settings:getAll', () => getAllSettings())

  ipcMain.handle('settings:set', (_, input: IpcInput<'settings:set'>) => {
    setSetting(input.key, input.value)
  })
}
