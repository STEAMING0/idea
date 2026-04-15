import { ipcMain } from 'electron'
import { getAllEntries, getEntriesByPeriod, createEntry } from '../db'
import type { IpcInput } from '@shared/types/ipc'

type SnoozeCallback = (periodId: number, snoozeUntil: string) => void

export function registerEntryHandlers(onSnooze: SnoozeCallback): void {
  ipcMain.handle('entries:getAll', (_, input: IpcInput<'entries:getAll'>) =>
    getAllEntries(input.limit, input.offset)
  )

  ipcMain.handle('entries:getByPeriod', (_, input: IpcInput<'entries:getByPeriod'>) =>
    getEntriesByPeriod(input.periodId)
  )

  ipcMain.handle('entries:create', (_, input: IpcInput<'entries:create'>) => {
    const entry = createEntry(input)
    if(entry.status === 'snoozed' && entry.snoozeUntil){
      onSnooze(entry.periodId, entry.snoozeUntil)
    }
    return entry
  })
}
