import { useCallback, useState } from 'react';

import { getBackendStatus } from '../services/apiClient';

type BackendConnectionState = 'idle' | 'checking' | 'connected' | 'offline';

export function useBackendStatus() {
  const [status, setStatus] = useState<BackendConnectionState>('idle');
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);

  const checkBackend = useCallback(async () => {
    setStatus('checking');

    try {
      const response = await getBackendStatus();
      setStatus(response.status === 'running' ? 'connected' : 'offline');
    } catch {
      setStatus('offline');
    } finally {
      setLastCheckedAt(new Date());
    }
  }, []);

  return {
    status,
    lastCheckedAt,
    checkBackend,
  };
}
