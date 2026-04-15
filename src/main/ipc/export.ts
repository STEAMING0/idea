import { ipcMain, dialog, app } from 'electron'
import fs from 'fs'
import path from 'path'
import { getEntriesForExport } from '../db'
import { entriesToCsv, entriesToText } from '@shared/utils/export'
import type { IpcInput } from '@shared/types/ipc'

export function registerExportHandlers(): void {
  ipcMain.handle('export:csv', async (_, input: IpcInput<'export:csv'>) => {
    const entries = getEntriesForExport(input.from, input.to)
    return saveFile(entriesToCsv(entries), 'journal-export.csv', [{ name: 'CSV Files', extensions: ['csv'] }])
  })

  ipcMain.handle('export:text', async (_, input: IpcInput<'export:text'>) => {
    const entries = getEntriesForExport(input.from, input.to)
    return saveFile(entriesToText(entries), 'journal-export.txt', [{ name: 'Text Files', extensions: ['txt'] }])
  })
}

async function saveFile(
  content: string,
  defaultName: string,
  filters: Electron.FileFilter[]
): Promise<string> {
  const { filePath } = await dialog.showSaveDialog({
    defaultPath: path.join(app.getPath('documents'), defaultName),
    filters
  })
  if(!filePath) return ''
  fs.writeFileSync(filePath, content, 'utf-8')
  return filePath
}
