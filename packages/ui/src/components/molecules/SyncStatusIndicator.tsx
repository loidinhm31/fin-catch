import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Cloud,
  CloudOff,
  RefreshCw,
} from "lucide-react";
import { syncGetStatus, syncNow } from "@fin-catch/ui/services";
import { AUTH_STORAGE_KEYS, SyncStatus } from "@fin-catch/shared";

/**
 * Check auth status from localStorage without calling the server.
 * This is used for periodic status checks to avoid unnecessary API calls.
 */
function getLocalAuthStatus(): { isAuthenticated: boolean } {
  const accessToken = localStorage.getItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN);
  return { isAuthenticated: !!accessToken };
}

interface SyncStatusIndicatorProps {
  onTap?: () => void;
  autoRefreshInterval?: number; // milliseconds, default 30000 (30s)
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  onTap,
  autoRefreshInterval = 30000,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncSuccess, setLastSyncSuccess] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load status - uses localStorage for auth to avoid server calls
  const loadStatus = async () => {
    try {
      // Get auth status from localStorage (no server call)
      const auth = getLocalAuthStatus();
      setIsAuthenticated(auth.isAuthenticated);

      // Only get sync status from server
      const sync = await syncGetStatus();
      setSyncStatus(sync);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load status");
    }
  };

  // Auto-refresh status
  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, autoRefreshInterval);
    return () => clearInterval(interval);
  }, [autoRefreshInterval]);

  // Handle sync trigger
  const handleSync = async () => {
    if (!isAuthenticated) {
      setError("Not logged in");
      return;
    }

    if (isSyncing) return;

    setIsSyncing(true);
    setError(null);

    try {
      const result = await syncNow();
      setLastSyncSuccess(result.success);
      // Reload status after sync
      await loadStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
      setLastSyncSuccess(false);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClick = () => {
    if (onTap) {
      onTap();
    } else {
      handleSync();
    }
  };

  // Determine icon and color
  const getIcon = () => {
    if (isSyncing) {
      return <RefreshCw className="w-5 h-5 animate-spin" />;
    }

    if (!isAuthenticated) {
      return <CloudOff className="w-5 h-5" />;
    }

    if (error) {
      return <AlertCircle className="w-5 h-5" />;
    }

    if (lastSyncSuccess === false) {
      return <AlertTriangle className="w-5 h-5" />;
    }

    if (syncStatus?.pendingChanges && syncStatus.pendingChanges > 0) {
      return <Cloud className="w-5 h-5" />;
    }

    if (lastSyncSuccess === true) {
      return <CheckCircle2 className="w-5 h-5" />;
    }

    return <Cloud className="w-5 h-5" />;
  };

  const getColor = () => {
    if (isSyncing) return "var(--color-market-live)"; // Electric blue
    if (!isAuthenticated) return "var(--color-text-muted)"; // Muted
    if (error) return "var(--color-trade-sell)"; // Bright red
    if (lastSyncSuccess === false) return "var(--color-amber-400)"; // Warning
    if (syncStatus?.pendingChanges && syncStatus.pendingChanges > 0)
      return "var(--color-market-live)"; // Electric blue
    if (lastSyncSuccess === true) return "var(--color-trade-buy)"; // Neon green
    return "var(--chart-axis)"; // Secondary
  };

  const showBadge =
    isAuthenticated &&
    syncStatus?.pendingChanges &&
    syncStatus.pendingChanges > 0;

  const getTooltip = () => {
    if (isSyncing) return "Syncing...";
    if (!isAuthenticated) return "Not logged in";
    if (error) return `Error: ${error}`;
    if (lastSyncSuccess === false) return "Sync failed";
    if (syncStatus?.pendingChanges && syncStatus.pendingChanges > 0)
      return `${syncStatus.pendingChanges} pending change${syncStatus.pendingChanges !== 1 ? "s" : ""}`;
    if (lastSyncSuccess === true) return "Synced";
    return "Tap to sync";
  };

  return (
    <button
      onClick={handleClick}
      disabled={isSyncing}
      title={getTooltip()}
      className="relative p-2 rounded-lg transition-all active:scale-95"
      style={{
        background: "var(--glass-bg-dark)",
        backdropFilter: "blur(16px)",
        border: "1px solid var(--glass-border-medium)",
        color: getColor(),
        boxShadow: isSyncing ? "var(--shadow-glow-cyan)" : "var(--shadow-sm)",
      }}
    >
      {getIcon()}

      {/* Badge for pending changes */}
      {showBadge && (
        <div
          className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold"
          style={{
            background: "var(--color-violet-500)",
            color: "var(--color-text-primary)",
            boxShadow: "var(--shadow-glow-violet)",
          }}
        >
          {syncStatus.pendingChanges > 99 ? "99+" : syncStatus.pendingChanges}
        </div>
      )}

      {/* Pulse effect when syncing */}
      {isSyncing && (
        <div
          className="absolute inset-0 rounded-lg animate-pulse"
          style={{
            background: "var(--color-sync-pending-bg)",
            pointerEvents: "none",
          }}
        />
      )}
    </button>
  );
};
