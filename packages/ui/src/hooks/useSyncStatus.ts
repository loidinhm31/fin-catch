import { useEffect, useState } from "react";
import { SyncStatus, AuthStatus } from "@fin-catch/shared";
import { finCatchAPI } from "@fin-catch/ui/services";

interface UseSyncStatusOptions {
  autoRefreshInterval?: number;
}

interface UseSyncStatusResult {
  authStatus: AuthStatus | null;
  syncStatus: SyncStatus | null;
  isSyncing: boolean;
  lastSyncSuccess: boolean | null;
  error: string | null;
  triggerSync: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useSyncStatus(
  options: UseSyncStatusOptions = {},
): UseSyncStatusResult {
  const { autoRefreshInterval = 30000 } = options;

  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncSuccess, setLastSyncSuccess] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = async () => {
    try {
      const [auth, sync] = await Promise.all([
        finCatchAPI.authGetStatus(),
        finCatchAPI.syncGetStatus(),
      ]);
      setAuthStatus(auth);
      setSyncStatus(sync);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load status");
    }
  };

  const triggerSync = async () => {
    if (!authStatus?.isAuthenticated) {
      setError("Not logged in");
      return;
    }

    if (isSyncing) return;

    setIsSyncing(true);
    setError(null);

    try {
      const result = await finCatchAPI.syncNow();
      setLastSyncSuccess(result.success);
      await loadStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
      setLastSyncSuccess(false);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, autoRefreshInterval);
    return () => clearInterval(interval);
  }, [autoRefreshInterval]);

  return {
    authStatus,
    syncStatus,
    isSyncing,
    lastSyncSuccess,
    error,
    triggerSync,
    refresh: loadStatus,
  };
}
