import { contextBridge, ipcRenderer } from 'electron'
import type { IpcChannel, IpcInput, IpcOutput } from '@shared/types/ipc'

// Typed bridge — invoke for request/response, on for push events from main
contextBridge.exposeInMainWorld('ipc', {
  invoke: <C extends IpcChannel>(channel: C, input: IpcInput<C>): Promise<IpcOutput<C>> =>
    ipcRenderer.invoke(channel, input),
  on: <C extends IpcChannel>(channel: C, callback: (data: IpcInput<C>) => void): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, data: IpcInput<C>) => callback(data)
    ipcRenderer.on(channel, handler)
    return () => ipcRenderer.removeListener(channel, handler)
  }
})
