import { contextBridge, ipcRenderer } from 'electron';

type IpcChannel = 'app:ping';

const electronApi = {
  invoke: <TResponse>(channel: IpcChannel, payload?: unknown): Promise<TResponse> => {
    return ipcRenderer.invoke(channel, payload);
  },
  on: (channel: IpcChannel, listener: (...args: unknown[]) => void): (() => void) => {
    const wrappedListener = (_event: Electron.IpcRendererEvent, ...args: unknown[]) => {
      listener(...args);
    };

    ipcRenderer.on(channel, wrappedListener);
    return () => ipcRenderer.removeListener(channel, wrappedListener);
  },
};

contextBridge.exposeInMainWorld('ghostDesigner', electronApi);
