import React, { useState, useEffect, useCallback, useRef } from "react";
import { Bell, RefreshCw, Cloud, Smartphone, Mail, Zap } from "lucide-react";
import { AUTH_STORAGE_KEYS } from "@fin-catch/shared";
import { authGetStatus } from "@fin-catch/ui/services";

interface NotificationPreferences {
  push_enabled: boolean;
  email_enabled: boolean;
  email_address?: string;
  alert_mode?: "auto" | "realtime" | "cronjob";
}

type AlertMode = "auto" | "realtime" | "cronjob";

const ALERT_MODE_OPTIONS: { value: AlertMode; label: string; description: string }[] = [
  { value: "auto", label: "Auto", description: "Realtime when DNSE active, scheduled otherwise" },
  { value: "cronjob", label: "Scheduled", description: "Polling every 60s via qm-hub" },
  { value: "realtime", label: "Realtime", description: "MQTT ticks via DNSE trading session" },
];

export const AlertSettings: React.FC = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    push_enabled: true,
    email_enabled: false,
    alert_mode: undefined,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [serverConnected, setServerConnected] = useState(false);
  const [serverUrl, setServerUrl] = useState<string>("http://localhost:3000");
  const [error, setError] = useState<string | null>(null);
  // Ref to always have the latest preferences for rollback without stale closure
  const preferencesRef = useRef(preferences);
  const emailDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    preferencesRef.current = preferences;
  }, [preferences]);

  const loadPreferences = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const status = await authGetStatus();
      if (!status.isAuthenticated) {
        setServerConnected(false);
        return;
      }
      const url = status.serverUrl || "http://localhost:3000";
      setServerUrl(url);
      const token = localStorage.getItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN);
      const res = await fetch(`${url}/api/v1/notifications/preferences`, {
        headers: { Authorization: `Bearer ${token ?? ""}` },
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data: NotificationPreferences = await res.json();
      setPreferences(data);
      setServerConnected(true);
    } catch (err) {
      console.error("Failed to load notification preferences:", err);
      setError(err instanceof Error ? err.message : "Failed to load preferences");
      setServerConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  useEffect(() => {
    return () => {
      if (emailDebounceRef.current) clearTimeout(emailDebounceRef.current);
    };
  }, []);

  const savePreferences = useCallback(
    async (updated: NotificationPreferences) => {
      if (!serverConnected) return;
      const previous = preferencesRef.current;
      setPreferences(updated); // optimistic
      setIsSaving(true);
      setError(null);
      try {
        const token = localStorage.getItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN);
        const res = await fetch(`${serverUrl}/api/v1/notifications/preferences`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token ?? ""}`,
          },
          body: JSON.stringify(updated),
        });
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
      } catch (err) {
        setPreferences(previous); // rollback to stable ref snapshot
        setError(err instanceof Error ? err.message : "Failed to save preferences");
        console.error("Failed to save notification preferences:", err);
      } finally {
        setIsSaving(false);
      }
    },
    [serverConnected, serverUrl],
  );

  const currentAlertMode = preferences.alert_mode ?? "auto";

  return (
    <div className="glass-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5" style={{ color: "var(--color-text-secondary)" }} />
          <h3
            style={{
              fontSize: "var(--text-lg)",
              fontWeight: "var(--font-semibold)",
              color: "var(--color-text-primary)",
            }}
          >
            Price Alerts
          </h3>
        </div>
        <button
          onClick={loadPreferences}
          disabled={isLoading}
          className="p-2 rounded-lg transition-colors"
          style={{ background: "transparent" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--color-action-expand-bg)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          <RefreshCw
            className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
            style={{ color: "var(--color-text-secondary)" }}
          />
        </button>
      </div>

      {/* Server status indicator */}
      <div
        className="flex items-center gap-2 p-2 rounded-lg"
        style={{
          backgroundColor: serverConnected
            ? "var(--color-alert-success-bg)"
            : "var(--color-alert-warning-bg)",
        }}
      >
        <Cloud
          className="w-4 h-4"
          style={{
            color: serverConnected
              ? "var(--color-green-500)"
              : "var(--color-amber-400)",
          }}
        />
        <span
          style={{
            fontSize: "var(--text-sm)",
            color: serverConnected
              ? "var(--color-alert-success-text)"
              : "var(--color-alert-warning-text)",
          }}
        >
          {serverConnected
            ? "Connected to qm-hub server"
            : "Alerts will be active when qm-hub server is connected"}
        </span>
      </div>

      {error && (
        <p style={{ fontSize: "var(--text-sm)", color: "var(--color-red-500)" }}>
          {error}
        </p>
      )}

      {isLoading ? (
        <div className="flex justify-center py-4">
          <RefreshCw
            className="w-6 h-6 animate-spin"
            style={{ color: "var(--color-text-muted)" }}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
            Configure how you receive price alerts when your target or stop loss prices are hit.
          </p>

          {/* Push Notifications */}
          <div
            className="flex items-center justify-between p-3 rounded-lg"
            style={{ background: "var(--glass-bg-dark)" }}
          >
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5" style={{ color: "var(--color-text-secondary)" }} />
              <div>
                <span
                  style={{
                    fontSize: "var(--text-sm)",
                    fontWeight: "var(--font-medium)",
                    color: "var(--color-text-primary)",
                  }}
                >
                  Push Notifications
                </span>
                <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                  Receive instant alerts on your device
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={preferences.push_enabled}
                disabled={!serverConnected || isSaving}
                onChange={(e) =>
                  savePreferences({ ...preferences, push_enabled: e.target.checked })
                }
              />
              <div
                className="w-11 h-6 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:rounded-full after:h-5 after:w-5 after:transition-all"
                style={{
                  background: preferences.push_enabled
                    ? "var(--color-violet-500)"
                    : "var(--glass-border-medium)",
                }}
              >
                <div
                  className="absolute top-[2px] left-[2px] h-5 w-5 rounded-full transition-all"
                  style={{
                    background: "var(--color-bg-white)",
                    transform: preferences.push_enabled ? "translateX(20px)" : "translateX(0)",
                  }}
                />
              </div>
            </label>
          </div>

          {/* Email Notifications */}
          <div
            className="flex items-center justify-between p-3 rounded-lg"
            style={{ background: "var(--glass-bg-dark)" }}
          >
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5" style={{ color: "var(--color-text-secondary)" }} />
              <div>
                <span
                  style={{
                    fontSize: "var(--text-sm)",
                    fontWeight: "var(--font-medium)",
                    color: "var(--color-text-primary)",
                  }}
                >
                  Email Notifications
                </span>
                <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                  Receive alerts via email
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={preferences.email_enabled}
                disabled={!serverConnected || isSaving}
                onChange={(e) =>
                  savePreferences({ ...preferences, email_enabled: e.target.checked })
                }
              />
              <div
                className="w-11 h-6 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:rounded-full after:h-5 after:w-5 after:transition-all"
                style={{
                  background: preferences.email_enabled
                    ? "var(--color-violet-500)"
                    : "var(--glass-border-medium)",
                }}
              >
                <div
                  className="absolute top-[2px] left-[2px] h-5 w-5 rounded-full transition-all"
                  style={{
                    background: "var(--color-bg-white)",
                    transform: preferences.email_enabled ? "translateX(20px)" : "translateX(0)",
                  }}
                />
              </div>
            </label>
          </div>

          {/* Email address input */}
          {preferences.email_enabled && (
            <div className="pl-8">
              <label
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-medium)",
                  color: "var(--color-text-primary)",
                }}
              >
                Email Address
              </label>
              <input
                type="email"
                value={preferences.email_address || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setPreferences((prev) => ({ ...prev, email_address: value }));
                  if (emailDebounceRef.current) clearTimeout(emailDebounceRef.current);
                  emailDebounceRef.current = setTimeout(() => {
                    savePreferences({ ...preferencesRef.current, email_address: value });
                  }, 600);
                }}
                placeholder="your@email.com"
                disabled={!serverConnected || isSaving}
                className="glass-input w-full mt-1 px-3 py-2 rounded-lg"
                style={{ fontSize: "var(--text-sm)" }}
              />
            </div>
          )}

          {/* Alert Mode */}
          <div
            className="p-3 rounded-lg space-y-3"
            style={{ background: "var(--glass-bg-dark)" }}
          >
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5" style={{ color: "var(--color-text-secondary)" }} />
              <div>
                <span
                  style={{
                    fontSize: "var(--text-sm)",
                    fontWeight: "var(--font-medium)",
                    color: "var(--color-text-primary)",
                  }}
                >
                  Alert Mode
                </span>
                <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                  How prices are monitored for your portfolio
                </p>
              </div>
            </div>
            <div className="flex gap-1 flex-wrap">
              {ALERT_MODE_OPTIONS.map(({ value, label, description }) => (
                <button
                  key={value}
                  onClick={() =>
                    savePreferences({
                      ...preferences,
                      alert_mode: value === "auto" ? undefined : value,
                    })
                  }
                  disabled={!serverConnected || isSaving}
                  title={description}
                  className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                  style={
                    currentAlertMode === value
                      ? {
                          background: "var(--color-violet-500)",
                          color: "var(--color-bg-white)",
                        }
                      : {
                          background: "transparent",
                          color: "var(--color-text-secondary)",
                          border: "1px solid var(--glass-border-medium)",
                        }
                  }
                >
                  {label}
                </button>
              ))}
            </div>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
              {ALERT_MODE_OPTIONS.find((o) => o.value === currentAlertMode)?.description}
            </p>
          </div>

          {isSaving && (
            <div className="flex items-center gap-2">
              <RefreshCw
                className="w-3 h-3 animate-spin"
                style={{ color: "var(--color-text-muted)" }}
              />
              <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                Saving...
              </span>
            </div>
          )}

          <div className="pt-4" style={{ borderTop: "1px solid var(--glass-border-light)" }}>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
              Price alerts are monitored by the qm-hub server. Set target and stop-loss prices
              on your portfolio entries, and you&apos;ll be notified when those prices are
              reached — even when the app is closed.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
