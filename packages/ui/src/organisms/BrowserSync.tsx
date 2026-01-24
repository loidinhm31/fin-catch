import React, { useEffect, useState } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  Globe,
  Monitor,
  Power,
  PowerOff,
} from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import { Button } from "@repo/ui/atoms";
import { isTauri } from "@repo/ui/utils";

/**
 * Browser Sync component for starting/stopping the embedded http server
 * and opening the app in a browser.
 */
export const BrowserSync: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [browserUrl, setBrowserUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Check if browser sync is active on mount
  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    if (!isTauri()) return;
    try {
      const active = await invoke<boolean>("is_browser_sync_active");
      setIsActive(active);
    } catch (err) {
      console.error("Failed to check browser sync status:", err);
    }
  };

  const handleStart = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const url = await invoke<string>("start_browser_sync");
      setBrowserUrl(url);
      setIsActive(true);
      // Open in external browser
      await openUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await invoke<string>("stop_browser_sync");
      setIsActive(false);
      setBrowserUrl(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyUrl = async () => {
    if (!browserUrl) return;
    try {
      await navigator.clipboard.writeText(browserUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error("Failed to copy URL");
    }
  };

  const handleOpenInBrowser = async () => {
    if (!browserUrl) return;
    try {
      await openUrl(browserUrl);
    } catch {
      console.error("Failed to open browser");
    }
  };

  // Only show in Tauri mode
  if (!isTauri()) {
    return null;
  }

  return (
    <div
      className="rounded-xl p-4 border"
      style={{
        background: "rgba(26, 31, 58, 0.6)",
        backdropFilter: "blur(16px)",
        borderColor: "rgba(123, 97, 255, 0.2)",
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="flex items-center justify-center w-10 h-10 rounded-lg"
          style={{
            background: isActive
              ? "linear-gradient(135deg, #00ff88 0%, #00d4ff 100%)"
              : "linear-gradient(135deg, #4a5568 0%, #2d3748 100%)",
            boxShadow: isActive ? "0 0 16px rgba(0, 255, 136, 0.4)" : "none",
          }}
        >
          <Globe className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Open in Browser
          </h3>
          <p className="text-xs text-[var(--color-text-secondary)]">
            {isActive
              ? "Web server is running"
              : "Access your data from any browser"}
          </p>
        </div>
        {/* Status indicator */}
        <div
          className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium"
          style={{
            background: isActive
              ? "rgba(0, 255, 136, 0.15)"
              : "rgba(113, 128, 150, 0.15)",
            color: isActive ? "#00ff88" : "#718096",
          }}
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{
              background: isActive ? "#00ff88" : "#718096",
              boxShadow: isActive ? "0 0 6px #00ff88" : "none",
            }}
          />
          {isActive ? "Active" : "Inactive"}
        </div>
      </div>

      {/* URL Display (when active) */}
      {isActive && browserUrl && (
        <div
          className="mb-4 p-3 rounded-lg border"
          style={{
            background: "rgba(0, 0, 0, 0.2)",
            borderColor: "rgba(0, 212, 255, 0.2)",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Monitor className="w-4 h-4" style={{ color: "#00d4ff" }} />
            <span className="text-xs text-[var(--color-text-secondary)]">
              Browser URL
            </span>
          </div>
          <div className="flex items-center gap-2">
            <code
              className="flex-1 text-xs px-2 py-1.5 rounded overflow-hidden text-ellipsis"
              style={{
                background: "rgba(0, 0, 0, 0.3)",
                color: "#00d4ff",
              }}
            >
              {browserUrl.split("?")[0]}
            </code>
            <button
              onClick={handleCopyUrl}
              className="p-1.5 rounded hover:bg-white/10 transition-colors"
              title="Copy URL"
            >
              {copied ? (
                <Check className="w-4 h-4" style={{ color: "#00ff88" }} />
              ) : (
                <Copy
                  className="w-4 h-4"
                  style={{ color: "var(--color-text-secondary)" }}
                />
              )}
            </button>
            <button
              onClick={handleOpenInBrowser}
              className="p-1.5 rounded hover:bg-white/10 transition-colors"
              title="Open in browser"
            >
              <ExternalLink
                className="w-4 h-4"
                style={{ color: "var(--color-text-secondary)" }}
              />
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          className="mb-4 p-3 rounded-lg text-sm border"
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
      {isActive ? (
        <Button
          variant="secondary"
          size="md"
          className="w-full"
          onClick={handleStop}
          disabled={isLoading}
        >
          <PowerOff className="w-4 h-4 mr-2" />
          Stop Web Server
        </Button>
      ) : (
        <Button
          variant="primary"
          size="md"
          className="w-full"
          onClick={handleStart}
          isLoading={isLoading}
          disabled={isLoading}
        >
          <Power className="w-4 h-4 mr-2" />
          Open in Browser
        </Button>
      )}

      {/* Info text */}
      <p className="mt-3 text-xs text-[var(--color-text-tertiary)] text-center">
        {isActive
          ? "The browser will receive a notification when you close this app."
          : "Starts a local server on port 25092. Only accessible on this computer."}
      </p>
    </div>
  );
};
