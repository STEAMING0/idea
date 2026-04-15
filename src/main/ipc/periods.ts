import { ipcMain } from 'electron'
import { getAllPeriods, createPeriod, updatePeriod, deletePeriod, setPeriodActive } from '../db'
import type { IpcInput } from '@shared/types/ipc'

export function registerPeriodHandlers(onPeriodsChanged: () => void): void {
  ipcMain.handle('periods:getAll', () => getAllPeriods())

  ipcMain.handle('periods:create', (_, input: IpcInput<'periods:create'>) => {
    const period = createPeriod(input)
    onPeriodsChanged()
    return period
  })

  ipcMain.handle('periods:update', (_, input: IpcInput<'periods:update'>) => {
    const period = updatePeriod(input)
    onPeriodsChanged()
    return period
  })

  ipcMain.handle('periods:delete', (_, input: IpcInput<'periods:delete'>) => {
    deletePeriod(input.id)
    onPeriodsChanged()
  })

  ipcMain.handle('periods:setActive', (_, input: IpcInput<'periods:setActive'>) => {
    setPeriodActive(input.id, input.active)
    onPeriodsChanged()
  })
}
