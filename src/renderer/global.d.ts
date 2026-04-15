import type { IpcChannel, IpcInput, IpcOutput } from '@shared/types/ipc'

declare global {
  interface Window {
    ipc: {
      invoke<C extends IpcChannel>(channel: C, input: IpcInput<C>): Promise<IpcOutput<C>>
      on<C extends IpcChannel>(channel: C, callback: (data: IpcInput<C>) => void): () => void
    }
  }
}
