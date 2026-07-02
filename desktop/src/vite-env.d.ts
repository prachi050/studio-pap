/// <reference types="vite/client" />

type GhostDesignerIpcInvokeChannel = 'app:ping' | 'screen:capture-primary';
type GhostDesignerIpcListenChannel = 'app:ping';

type GhostDesignerApi = {
  invoke: <TResponse>(
    channel: GhostDesignerIpcInvokeChannel,
    payload?: unknown,
  ) => Promise<TResponse>;
  on: (channel: GhostDesignerIpcListenChannel, listener: (...args: unknown[]) => void) => () => void;
};

interface Window {
  ghostDesigner: GhostDesignerApi;
}
