import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle2,
  Cloud,
  CloudOff,
  RefreshCw,
  Server,
} from "lucide-react";
import { Button, Input, Label } from "@fin-catch/ui/components/atoms";
import {
  authGetStatus,
  syncGetStatus,
  configureSync,
  syncNow,
  syncWithProgress,
} from "@fin-catch/ui/services";
import {
  AuthStatus,
  SyncProgress,
  SyncResult,
  SyncStatus,
} from "@fin-catch/shared";
import { isTauri } from "@fin-catch/ui/utils";

interface SyncSettingsProps {
  onLogout?: () => void;
}

export const SyncSettings: React.FC<SyncSettingsProps> = () => {
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [serverUrl, setServerUrl] = useState("http://localhost:3000");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  // Load auth and sync status on mount
  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const [auth, sync] = await Promise.all([
        authGetStatus(),
        syncGetStatus(),
      ]);
      setAuthStatus(auth);
      setSyncStatus(sync);
      if (auth.serverUrl) {
        setServerUrl(auth.serverUrl);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load status");
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const handleConfigureSync = async () => {
    try {
      await configureSync({
        serverUrl,
      });
      await loadStatus();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to configure sync");
    }
  };

  const handleSync = async () => {
    if (!authStatus?.isAuthenticated) {
      setError("You must be logged in to sync");
      return;
    }

    setIsSyncing(true);
    setError(null);
    setSyncResult(null);
    setSyncProgress(null);

    try {
      // Use syncWithProgress from service layer
      const result = await syncWithProgress((progress) => {
        setSyncProgress(progress);
      });
      setSyncResult(result);

      // Reload sync status to update last sync time
      await loadStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setIsSyncing(false);
      setSyncProgress(null);
    }
  };

  const formatTimestamp = (timestamp?: string | number) => {
    if (!timestamp) return "Never";
    try {
      // Handle Unix timestamp (number in seconds) or ISO string
      const date =
        typeof timestamp === "number"
          ? new Date(timestamp * 1000)
          : new Date(timestamp);
      return date.toLocaleString();
    } catch {
      return "Invalid date";
    }
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      {/* Cloud Sync Status Card */}
      <div
        className="rounded-xl shadow-sm p-6"
        style={{
          background: "var(--glass-bg-dark-strong)",
          borderWidth: "1px",
          borderStyle: "solid",
          borderColor: "var(--glass-border-light)",
        }}
      >
        <div className="flex items-start gap-4">
          <Cloud
            className="w-6 h-6"
            style={{ color: "var(--color-blue-500)" }}
          />
          <div className="flex-1">
            <h2
              className="text-2xl font-semibold mb-2"
              style={{ color: "var(--color-text-primary)" }}
            >
              Cloud Sync
            </h2>
            <p
              className="mb-4"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Keep your data synchronized across devices
            </p>

            {/* Status indicator */}
            <div className="flex items-center gap-2 mb-4">
              {isSyncing ? (
                <RefreshCw
                  className="w-4 h-4 animate-spin"
                  style={{ color: "var(--color-blue-500)" }}
                />
              ) : authStatus?.isAuthenticated ? (
                <CheckCircle2
                  className="w-4 h-4"
                  style={{ color: "var(--color-green-500)" }}
                />
              ) : (
                <CloudOff
                  className="w-4 h-4"
                  style={{ color: "var(--color-text-muted)" }}
                />
              )}
              <span
                className="text-sm"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {isSyncing
                  ? "Syncing..."
                  : authStatus?.isAuthenticated
                    ? "Connected"
                    : "Not logged in"}
              </span>
              {syncStatus?.lastSyncAt && (
                <span
                  className="text-xs"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  — Last sync: {formatTimestamp(syncStatus.lastSyncAt)}
                </span>
              )}
            </div>

            {/* Pending Changes Badge */}
            {syncStatus?.pendingChanges !== undefined &&
              syncStatus.pendingChanges > 0 && (
                <div
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-4"
                  style={{
                    background: "var(--color-sync-pending-bg)",
                    color: "var(--color-sync-pending-text)",
                    borderWidth: "1px",
                    borderStyle: "solid",
                    borderColor: "var(--color-sync-pending-border)",
                  }}
                >
                  <AlertCircle className="w-3 h-3" />
                  {syncStatus.pendingChanges} pending change
                  {syncStatus.pendingChanges !== 1 ? "s" : ""}
                </div>
              )}
          </div>
        </div>

        {/* Sync Result */}
        {syncResult && (
          <div
            className="mt-4 p-4 rounded-lg"
            style={{
              background: syncResult.success
                ? "var(--color-alert-success-bg)"
                : "var(--color-alert-error-bg)",
              borderWidth: "1px",
              borderStyle: "solid",
              borderColor: syncResult.success
                ? "var(--color-alert-success-border)"
                : "var(--color-alert-error-border)",
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              {syncResult.success ? (
                <CheckCircle2
                  className="w-4 h-4"
                  style={{ color: "var(--color-green-500)" }}
                />
              ) : (
                <AlertCircle
                  className="w-4 h-4"
                  style={{ color: "var(--color-red-500)" }}
                />
              )}
              <span
                className="text-sm font-semibold"
                style={{
                  color: syncResult.success
                    ? "var(--color-alert-success-text)"
                    : "var(--color-alert-error-text)",
                }}
              >
                {syncResult.success
                  ? "Sync completed"
                  : `Sync failed${syncResult.error ? `: ${syncResult.error}` : ""}`}
              </span>
            </div>

            {syncResult.success && (
              <div className="grid grid-cols-3 gap-3">
                <div
                  className="text-center p-2 rounded"
                  style={{
                    background: "var(--color-stat-box-bg)",
                    borderWidth: "1px",
                    borderStyle: "solid",
                    borderColor: "var(--color-stat-box-border)",
                  }}
                >
                  <ArrowUpCircle
                    className="w-4 h-4 mx-auto mb-1"
                    style={{ color: "var(--color-blue-500)" }}
                  />
                  <div
                    className="text-lg font-bold"
                    style={{ color: "var(--color-stat-box-text)" }}
                  >
                    {syncResult.pushed}
                  </div>
                  <div
                    className="text-xs"
                    style={{ color: "var(--color-stat-box-label)" }}
                  >
                    Pushed
                  </div>
                </div>
                <div
                  className="text-center p-2 rounded"
                  style={{
                    background: "var(--color-stat-box-bg)",
                    borderWidth: "1px",
                    borderStyle: "solid",
                    borderColor: "var(--color-stat-box-border)",
                  }}
                >
                  <ArrowDownCircle
                    className="w-4 h-4 mx-auto mb-1"
                    style={{ color: "var(--color-nav-portfolio-active)" }}
                  />
                  <div
                    className="text-lg font-bold"
                    style={{ color: "var(--color-stat-box-text)" }}
                  >
                    {syncResult.pulled}
                  </div>
                  <div
                    className="text-xs"
                    style={{ color: "var(--color-stat-box-label)" }}
                  >
                    Pulled
                  </div>
                </div>
                <div
                  className="text-center p-2 rounded"
                  style={{
                    background: "var(--color-stat-box-bg)",
                    borderWidth: "1px",
                    borderStyle: "solid",
                    borderColor: "var(--color-stat-box-border)",
                  }}
                >
                  <AlertCircle
                    className="w-4 h-4 mx-auto mb-1"
                    style={{
                      color:
                        syncResult.conflicts > 0
                          ? "var(--color-amber-500)"
                          : "var(--color-text-muted)",
                    }}
                  />
                  <div
                    className="text-lg font-bold"
                    style={{ color: "var(--color-stat-box-text)" }}
                  >
                    {syncResult.conflicts}
                  </div>
                  <div
                    className="text-xs"
                    style={{ color: "var(--color-stat-box-label)" }}
                  >
                    Conflicts
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sync Progress */}
        {isSyncing && syncProgress && (
          <div
            className="mt-4 p-3 rounded-lg"
            style={{
              background: "var(--color-sync-progress-bg)",
              borderWidth: "1px",
              borderStyle: "solid",
              borderColor: "var(--color-sync-progress-border)",
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <RefreshCw
                className="w-4 h-4 animate-spin"
                style={{ color: "var(--color-blue-500)" }}
              />
              <span
                className="text-sm font-medium"
                style={{ color: "var(--color-sync-progress-text)" }}
              >
                {syncProgress.phase === "pushing" ? "Pushing..." : "Pulling..."}
              </span>
            </div>
            <div
              className="text-sm"
              style={{ color: "var(--color-sync-progress-text)" }}
            >
              {syncProgress.phase === "pushing" ? (
                <span>{syncProgress.recordsPushed} records pushed</span>
              ) : (
                <span>
                  {syncProgress.recordsPulled} records pulled (page{" "}
                  {syncProgress.currentPage})
                  {syncProgress.hasMore && " - more pages available"}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            className="mt-4 p-3 rounded-lg text-sm"
            style={{
              background: "var(--color-alert-error-bg)",
              borderWidth: "1px",
              borderStyle: "solid",
              borderColor: "var(--color-alert-error-border)",
              color: "var(--color-alert-error-text)",
            }}
          >
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 flex flex-col gap-3">
          {authStatus?.isAuthenticated && (
            <>
              <Button
                variant="primary"
                onClick={handleSync}
                className="w-full"
                disabled={isSyncing || isLoadingStatus}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${isSyncing ? "animate-spin" : ""}`}
                />
                {isSyncing ? "Syncing..." : "Sync Now"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Server Configuration Card - Only shown in Tauri (native) mode */}
      {isTauri() && (
        <div
          className="rounded-xl shadow-sm p-6"
          style={{
            background: "var(--glass-bg-dark-strong)",
            borderWidth: "1px",
            borderStyle: "solid",
            borderColor: "var(--glass-border-light)",
          }}
        >
          <div className="flex items-start gap-4">
            <Server
              className="w-6 h-6"
              style={{ color: "var(--color-blue-500)" }}
            />
            <div className="flex-1">
              <h2
                className="text-2xl font-semibold mb-2"
                style={{ color: "var(--color-text-primary)" }}
              >
                Server Configuration
              </h2>
              <p
                className="mb-4"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Configure the sync server connection
              </p>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="server-url" className="mb-2 block text-sm">
                    Server URL
                  </Label>
                  <Input
                    id="server-url"
                    type="text"
                    placeholder="http://localhost:3000"
                    value={serverUrl}
                    onChange={(e) => setServerUrl(e.target.value)}
                    disabled={isLoadingStatus}
                  />
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleConfigureSync}
                  disabled={isLoadingStatus || !serverUrl}
                >
                  Save Configuration
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
