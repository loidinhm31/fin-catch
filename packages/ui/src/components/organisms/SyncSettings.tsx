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
import { finCatchAPI } from "@fin-catch/ui/services";
import { AuthStatus, SyncResult, SyncStatus } from "@fin-catch/shared";

interface SyncSettingsProps {
  onLogout?: () => void;
}

export const SyncSettings: React.FC<SyncSettingsProps> = () => {
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [serverUrl, setServerUrl] = useState("http://localhost:3000");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
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
        finCatchAPI.authGetStatus(),
        finCatchAPI.syncGetStatus(),
      ]);
      setAuthStatus(auth);
      setSyncStatus(sync);
      if (sync.serverUrl) {
        setServerUrl(sync.serverUrl);
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
      await finCatchAPI.authConfigureSync({
        serverUrl,
        appId: "fin-catch",
        apiKey: "", // API key is not needed for user auth
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

    try {
      const result = await finCatchAPI.syncNow();
      setSyncResult(result);
      // Reload sync status to update last sync time
      await loadStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setIsSyncing(false);
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
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
        <div className="flex items-start gap-4">
          <Cloud className="w-6 h-6 text-blue-500" />
          <div className="flex-1">
            <h2 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-white">
              Cloud Sync
            </h2>
            <p className="mb-4 text-gray-500 dark:text-gray-400">
              Keep your data synchronized across devices
            </p>

            {/* Status indicator */}
            <div className="flex items-center gap-2 mb-4">
              {isSyncing ? (
                <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
              ) : authStatus?.isAuthenticated ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : (
                <CloudOff className="w-4 h-4 text-gray-400" />
              )}
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {isSyncing
                  ? "Syncing..."
                  : authStatus?.isAuthenticated
                    ? "Connected"
                    : "Not logged in"}
              </span>
              {syncStatus?.lastSyncAt && (
                <span className="text-xs text-gray-400">
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
                    background: "rgba(0, 212, 255, 0.1)",
                    color: "#00d4ff",
                    border: "1px solid rgba(0, 212, 255, 0.3)",
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
            className="mt-4 p-4 rounded-lg border"
            style={{
              background: syncResult.success
                ? "rgba(0, 255, 136, 0.1)"
                : "rgba(255, 51, 102, 0.1)",
              borderColor: syncResult.success
                ? "rgba(0, 255, 136, 0.3)"
                : "rgba(255, 51, 102, 0.3)",
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              {syncResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-500" />
              )}
              <span
                className={`text-sm font-semibold ${syncResult.success ? "text-green-500" : "text-red-500"}`}
              >
                {syncResult.success
                  ? "Sync completed"
                  : `Sync failed${syncResult.error ? `: ${syncResult.error}` : ""}`}
              </span>
            </div>

            {syncResult.success && (
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-2 rounded bg-black/20 border border-gray-700">
                  <ArrowUpCircle className="w-4 h-4 mx-auto mb-1 text-blue-500" />
                  <div className="text-lg font-bold text-white">
                    {syncResult.pushed}
                  </div>
                  <div className="text-xs text-gray-400">Pushed</div>
                </div>
                <div className="text-center p-2 rounded bg-black/20 border border-gray-700">
                  <ArrowDownCircle className="w-4 h-4 mx-auto mb-1 text-purple-500" />
                  <div className="text-lg font-bold text-white">
                    {syncResult.pulled}
                  </div>
                  <div className="text-xs text-gray-400">Pulled</div>
                </div>
                <div className="text-center p-2 rounded bg-black/20 border border-gray-700">
                  <AlertCircle
                    className={`w-4 h-4 mx-auto mb-1 ${syncResult.conflicts > 0 ? "text-amber-500" : "text-gray-400"}`}
                  />
                  <div className="text-lg font-bold text-white">
                    {syncResult.conflicts}
                  </div>
                  <div className="text-xs text-gray-400">Conflicts</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            className="mt-4 p-3 rounded-lg text-sm border"
            style={{
              background: "rgba(255, 51, 102, 0.1)",
              borderColor: "rgba(255, 51, 102, 0.3)",
              color: "#ff3366",
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

      {/* Server Configuration Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
        <div className="flex items-start gap-4">
          <Server className="w-6 h-6 text-blue-500" />
          <div className="flex-1">
            <h2 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-white">
              Server Configuration
            </h2>
            <p className="mb-4 text-gray-500 dark:text-gray-400">
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
    </div>
  );
};
