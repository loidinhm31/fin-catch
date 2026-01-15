import React, { useEffect, useState } from "react";
import {
  Cloud,
  CloudOff,
  RefreshCw,
  User,
  Mail,
  Server,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Clock,
  ArrowUpCircle,
  ArrowDownCircle,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import { finCatchAPI } from "@/services/api";
import { AuthStatus, SyncStatus, SyncResult } from "@/types";

interface SyncSettingsProps {
  onLogout?: () => void;
}

export const SyncSettings: React.FC<SyncSettingsProps> = ({ onLogout }) => {
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

  const handleLogout = async () => {
    try {
      await finCatchAPI.authLogout();
      setAuthStatus({ isAuthenticated: false });
      setSyncResult(null);
      setError(null);
      onLogout?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to logout");
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

  const getStatusColor = () => {
    if (isSyncing) return "#00d4ff"; // Electric blue
    if (syncResult?.success) return "#00ff88"; // Neon green
    if (error) return "#ff3366"; // Bright red
    return "#a0aec0"; // Secondary text
  };

  const getStatusIcon = () => {
    if (isSyncing) return <RefreshCw className="w-5 h-5 animate-spin" />;
    if (syncResult?.success) return <CheckCircle2 className="w-5 h-5" />;
    if (error) return <AlertCircle className="w-5 h-5" />;
    return <Cloud className="w-5 h-5" />;
  };

  const getStatusText = () => {
    if (isSyncing) return "Syncing...";
    if (syncResult?.success) return "Sync successful";
    if (error) return "Sync error";
    return authStatus?.isAuthenticated ? "Ready to sync" : "Not logged in";
  };

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="text-center mb-6">
        <div
          className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-3"
          style={{
            background: "linear-gradient(135deg, #7b61ff 0%, #00d4ff 100%)",
            boxShadow: "0 0 24px rgba(123, 97, 255, 0.4)",
          }}
        >
          <Cloud className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
          Sync Settings
        </h2>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Keep your data synchronized across devices
        </p>
      </div>

      {/* Status Card */}
      <div
        className="rounded-xl p-4 border"
        style={{
          background: "rgba(26, 31, 58, 0.6)",
          backdropFilter: "blur(16px)",
          borderColor: "rgba(123, 97, 255, 0.2)",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
        }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div style={{ color: getStatusColor() }}>{getStatusIcon()}</div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">
              {getStatusText()}
            </p>
            {syncStatus?.lastSyncAt && (
              <div className="flex items-center gap-1 mt-1">
                <Clock className="w-3 h-3 text-[var(--color-text-tertiary)]" />
                <p className="text-xs text-[var(--color-text-tertiary)]">
                  Last sync: {formatTimestamp(syncStatus.lastSyncAt)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sync Result - Enhanced Display */}
        {syncResult && (
          <div
            className="mt-3 p-4 rounded-lg border"
            style={{
              background: syncResult.success
                ? "rgba(0, 255, 136, 0.1)"
                : "rgba(255, 51, 102, 0.1)",
              borderColor: syncResult.success
                ? "rgba(0, 255, 136, 0.3)"
                : "rgba(255, 51, 102, 0.3)",
            }}
          >
            {/* Summary Message */}
            <div className="flex items-center gap-2 mb-3">
              {syncResult.success ? (
                <CheckCircle2
                  className="w-4 h-4"
                  style={{ color: "#00ff88" }}
                />
              ) : (
                <AlertCircle className="w-4 h-4" style={{ color: "#ff3366" }} />
              )}
              <span
                className="font-semibold text-sm"
                style={{ color: syncResult.success ? "#00ff88" : "#ff3366" }}
              >
                {syncResult.success
                  ? `Sync completed successfully`
                  : `Sync failed${syncResult.error ? `: ${syncResult.error}` : ""}`}
              </span>
            </div>

            {/* Sync Statistics Grid */}
            {syncResult.success && (
              <div className="grid grid-cols-3 gap-3">
                {/* Pushed */}
                <div
                  className="flex flex-col items-center p-2 rounded-lg"
                  style={{ background: "rgba(0, 0, 0, 0.2)" }}
                >
                  <ArrowUpCircle
                    className="w-4 h-4 mb-1"
                    style={{ color: "#00d4ff" }}
                  />
                  <span className="text-lg font-bold text-[var(--color-text-primary)]">
                    {syncResult.pushed}
                  </span>
                  <span className="text-xs text-[var(--color-text-secondary)]">
                    Pushed
                  </span>
                </div>

                {/* Pulled */}
                <div
                  className="flex flex-col items-center p-2 rounded-lg"
                  style={{ background: "rgba(0, 0, 0, 0.2)" }}
                >
                  <ArrowDownCircle
                    className="w-4 h-4 mb-1"
                    style={{ color: "#7b61ff" }}
                  />
                  <span className="text-lg font-bold text-[var(--color-text-primary)]">
                    {syncResult.pulled}
                  </span>
                  <span className="text-xs text-[var(--color-text-secondary)]">
                    Pulled
                  </span>
                </div>

                {/* Conflicts */}
                <div
                  className="flex flex-col items-center p-2 rounded-lg"
                  style={{ background: "rgba(0, 0, 0, 0.2)" }}
                >
                  <AlertTriangle
                    className="w-4 h-4 mb-1"
                    style={{
                      color: syncResult.conflicts > 0 ? "#ffb800" : "#4a5568",
                    }}
                  />
                  <span
                    className="text-lg font-bold"
                    style={{
                      color:
                        syncResult.conflicts > 0
                          ? "#ffb800"
                          : "var(--color-text-primary)",
                    }}
                  >
                    {syncResult.conflicts}
                  </span>
                  <span className="text-xs text-[var(--color-text-secondary)]">
                    Conflicts
                  </span>
                </div>
              </div>
            )}

            {/* Sync Time */}
            {syncResult.success && syncResult.syncedAt && (
              <div
                className="flex items-center gap-1 mt-3 pt-2 border-t"
                style={{ borderColor: "rgba(255, 255, 255, 0.1)" }}
              >
                <Clock className="w-3 h-3 text-[var(--color-text-tertiary)]" />
                <span className="text-xs text-[var(--color-text-tertiary)]">
                  Completed at {formatTimestamp(syncResult.syncedAt)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Pending Changes Badge */}
        {syncStatus?.pendingChanges !== undefined &&
          syncStatus.pendingChanges > 0 && (
            <div
              className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
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

      {/* Error Message */}
      {error && (
        <div
          className="p-3 rounded-lg text-sm border"
          style={{
            background: "rgba(255, 51, 102, 0.1)",
            borderColor: "rgba(255, 51, 102, 0.3)",
            color: "#ff3366",
          }}
        >
          {error}
        </div>
      )}

      {/* Account Info */}
      {authStatus?.isAuthenticated && (
        <div
          className="rounded-xl p-4 border"
          style={{
            background: "rgba(26, 31, 58, 0.6)",
            backdropFilter: "blur(16px)",
            borderColor: "rgba(123, 97, 255, 0.2)",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
          }}
        >
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
            Account Information
          </h3>

          {authStatus.username && (
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4" style={{ color: "#00d4ff" }} />
              <span className="text-sm text-[var(--color-text-secondary)]">
                {authStatus.username}
              </span>
            </div>
          )}

          {authStatus.email && (
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" style={{ color: "#00d4ff" }} />
              <span className="text-sm text-[var(--color-text-secondary)]">
                {authStatus.email}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Server Configuration */}
      <div
        className="rounded-xl p-4 border"
        style={{
          background: "rgba(26, 31, 58, 0.6)",
          backdropFilter: "blur(16px)",
          borderColor: "rgba(123, 97, 255, 0.2)",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
        }}
      >
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
          Server Configuration
        </h3>

        <div>
          <Label htmlFor="server-url" style={{ marginBottom: "8px" }}>
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4" style={{ color: "#00d4ff" }} />
              Server URL
            </div>
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
          size="md"
          className="w-full mt-3"
          onClick={handleConfigureSync}
          disabled={isLoadingStatus || !serverUrl}
        >
          Save Configuration
        </Button>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {authStatus?.isAuthenticated ? (
          <>
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleSync}
              isLoading={isSyncing}
              disabled={isSyncing || isLoadingStatus}
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Sync Now
                </>
              )}
            </Button>

            <Button
              variant="secondary"
              size="md"
              className="w-full"
              onClick={handleLogout}
              disabled={isLoadingStatus}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </>
        ) : (
          <div
            className="p-4 rounded-lg text-center border"
            style={{
              background: "rgba(26, 31, 58, 0.4)",
              borderColor: "rgba(123, 97, 255, 0.2)",
            }}
          >
            <CloudOff
              className="w-8 h-8 mx-auto mb-2"
              style={{ color: "#718096" }}
            />
            <p className="text-sm text-[var(--color-text-secondary)] mb-1">
              Not logged in
            </p>
            <p className="text-xs text-[var(--color-text-tertiary)]">
              Please log in to enable sync
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
