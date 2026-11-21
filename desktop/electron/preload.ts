import {
  contextBridge,
  ipcRenderer,
} from 'electron';

type IpcEventChannel =
  | 'app:ping';

type IpcInvokeChannel =
  | IpcEventChannel
  | 'screen:capture-primary'
  | 'floating:show'
  | 'floating:hide'
  | 'floating:toggle'
  | 'floating:minimize'
  | 'main-window:show';

const electronApi = {
  invoke: <TResponse>(
    channel: IpcInvokeChannel,
    payload?: unknown,
  ): Promise<TResponse> => {
    return ipcRenderer.invoke(
      channel,
      payload,
    );
  },

  on: (
    channel: IpcEventChannel,
    listener: (
      ...args: unknown[]
    ) => void,
  ): (() => void) => {
    const wrappedListener = (
      _event: Electron.IpcRendererEvent,
      ...args: unknown[]
    ) => {
      listener(...args);
    };

    ipcRenderer.on(
      channel,
      wrappedListener,
    );

    return () => {
      ipcRenderer.removeListener(
        channel,
        wrappedListener,
      );
    };
  },

  floating: {
    show: (): Promise<{
      ok: boolean;
    }> => {
      return ipcRenderer.invoke(
        'floating:show',
      );
    },

    hide: (): Promise<{
      ok: boolean;
    }> => {
      return ipcRenderer.invoke(
        'floating:hide',
      );
    },

    toggle: (): Promise<{
      ok: boolean;
    }> => {
      return ipcRenderer.invoke(
        'floating:toggle',
      );
    },

    minimize: (): Promise<{
      ok: boolean;
    }> => {
      return ipcRenderer.invoke(
        'floating:minimize',
      );
    },

    openMainApp: (): Promise<{
      ok: boolean;
    }> => {
      return ipcRenderer.invoke(
        'main-window:show',
      );
    },
  },

  screen: {
    capturePrimary: <
      TResponse,
    >(): Promise<TResponse> => {
      return ipcRenderer.invoke(
        'screen:capture-primary',
      );
    },
  },
};

contextBridge.exposeInMainWorld(
  'ghostDesigner',
  electronApi,
);