import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Cloud,
  CloudOff,
  RefreshCw,
} from "lucide-react";
import { finCatchAPI } from "@fin-catch/ui/services";
import { AuthStatus, SyncStatus } from "@fin-catch/shared";

interface SyncStatusIndicatorProps {
  onTap?: () => void;
  autoRefreshInterval?: number; // milliseconds, default 30000 (30s)
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  onTap,
  autoRefreshInterval = 30000,
}) => {
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncSuccess, setLastSyncSuccess] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load status
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

  // Auto-refresh status
  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, autoRefreshInterval);
    return () => clearInterval(interval);
  }, [autoRefreshInterval]);

  // Handle sync trigger
  const handleSync = async () => {
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

    if (!authStatus?.isAuthenticated) {
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
    if (isSyncing) return "#00d4ff"; // Electric blue
    if (!authStatus?.isAuthenticated) return "#718096"; // Muted
    if (error) return "#ff3366"; // Bright red
    if (lastSyncSuccess === false) return "#ffaa00"; // Warning
    if (syncStatus?.pendingChanges && syncStatus.pendingChanges > 0)
      return "#00d4ff"; // Electric blue
    if (lastSyncSuccess === true) return "#00ff88"; // Neon green
    return "#a0aec0"; // Secondary
  };

  const showBadge =
    authStatus?.isAuthenticated &&
    syncStatus?.pendingChanges &&
    syncStatus.pendingChanges > 0;

  const getTooltip = () => {
    if (isSyncing) return "Syncing...";
    if (!authStatus?.isAuthenticated) return "Not logged in";
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
        background: "rgba(26, 31, 58, 0.6)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(123, 97, 255, 0.2)",
        color: getColor(),
        boxShadow: isSyncing
          ? "0 0 16px rgba(0, 212, 255, 0.4)"
          : "0 2px 8px rgba(0, 0, 0, 0.2)",
      }}
    >
      {getIcon()}

      {/* Badge for pending changes */}
      {showBadge && (
        <div
          className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold"
          style={{
            background: "linear-gradient(135deg, #00d4ff 0%, #7b61ff 100%)",
            color: "#ffffff",
            boxShadow: "0 0 12px rgba(0, 212, 255, 0.6)",
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
            background: "rgba(0, 212, 255, 0.2)",
            pointerEvents: "none",
          }}
        />
      )}
    </button>
  );
};
