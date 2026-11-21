import { useCallback, useSyncExternalStore } from "react";

import { getBackendStatus } from "../services/apiClient";

export type BackendConnectionState =
  | "idle"
  | "checking"
  | "connected"
  | "offline";

type BackendStatusSnapshot = {
  status: BackendConnectionState;
  lastCheckedAt: Date | null;
};

let snapshot: BackendStatusSnapshot = {
  status: "idle",
  lastCheckedAt: null,
};

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): BackendStatusSnapshot {
  return snapshot;
}

function emitChange() {
  listeners.forEach((listener) => listener());
}

function updateSnapshot(
  updates: Partial<BackendStatusSnapshot>,
) {
  snapshot = {
    ...snapshot,
    ...updates,
  };

  emitChange();
}

export function useBackendStatus() {
  const currentSnapshot = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getSnapshot,
  );

  const checkBackend = useCallback(async () => {
    updateSnapshot({
      status: "checking",
    });

    try {
      const response = await getBackendStatus();

      updateSnapshot({
        status:
          response.status === "running"
            ? "connected"
            : "offline",
        lastCheckedAt: new Date(),
      });
    } catch {
      updateSnapshot({
        status: "offline",
        lastCheckedAt: new Date(),
      });
    }
  }, []);

  return {
    status: currentSnapshot.status,
    lastCheckedAt: currentSnapshot.lastCheckedAt,
    checkBackend,
  };
}