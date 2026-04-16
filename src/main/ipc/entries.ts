import { ipcMain } from 'electron'
import { getAllEntries, getEntriesByPeriod, createEntry, updateEntry, deleteEntry } from '../db'
import type { IpcInput } from '@shared/types/ipc'

export function registerEntryHandlers(): void {
  ipcMain.handle('entries:getAll', (_, input: IpcInput<'entries:getAll'>) =>
    getAllEntries(input.limit, input.offset)
  )

  ipcMain.handle('entries:getByPeriod', (_, input: IpcInput<'entries:getByPeriod'>) =>
    getEntriesByPeriod(input.periodId)
  )

  ipcMain.handle('entries:create', (_, input: IpcInput<'entries:create'>) =>
    createEntry(input)
  )

  ipcMain.handle('entries:update', (_, input: IpcInput<'entries:update'>) =>
    updateEntry(input.id, input.text)
  )

  ipcMain.handle('entries:delete', (_, input: IpcInput<'entries:delete'>) =>
    deleteEntry(input.id)
  )
}
