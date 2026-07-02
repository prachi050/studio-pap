/// <reference types="vite/client" />

type GhostDesignerApi = {
  invoke: <TResponse>(channel: 'app:ping', payload?: unknown) => Promise<TResponse>;
  on: (channel: 'app:ping', listener: (...args: unknown[]) => void) => () => void;
};

interface Window {
  ghostDesigner: GhostDesignerApi;
}
