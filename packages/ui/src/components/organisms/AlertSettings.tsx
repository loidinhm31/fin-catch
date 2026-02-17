import React, { useState, useEffect, useCallback } from "react";
import { Bell, RefreshCw, Cloud, Smartphone, Mail } from "lucide-react";

/**
 * Notification preferences for qm-sync server
 * These control how alerts are delivered when triggered
 */
interface NotificationPreferences {
  push_enabled: boolean;
  email_enabled: boolean;
  email_address?: string;
}

/**
 * AlertSettings Component
 *
 * Manages notification preferences for price alerts.
 * Price monitoring is now handled server-side by qm-sync.
 * This component configures how users receive alert notifications.
 */
export const AlertSettings: React.FC = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    push_enabled: true,
    email_enabled: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [serverConnected, setServerConnected] = useState(false);

  const loadPreferences = useCallback(async () => {
    setIsLoading(true);
    try {
      // TODO: Fetch from qm-sync server when notification API is ready
      // const response = await fetch(`${QM_SYNC_URL}/api/v1/notifications/preferences`);
      // const prefs = await response.json();
      // setPreferences(prefs);
      // setServerConnected(true);

      // For now, use local defaults
      setPreferences({
        push_enabled: true,
        email_enabled: false,
      });
      setServerConnected(false);
    } catch (error) {
      console.error("Failed to load notification preferences:", error);
      setServerConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // TODO: Save to qm-sync server when notification API is ready
      // await fetch(`${QM_SYNC_URL}/api/v1/notifications/preferences`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(preferences),
      // });
      console.log("Notification preferences saved (local only):", preferences);
    } catch (error) {
      console.error("Failed to save notification preferences:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="glass-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell
            className="w-5 h-5"
            style={{ color: "var(--color-text-secondary)" }}
          />
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
          style={{
            background: "transparent",
          }}
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
              : "var(--color-amber-500)",
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
            ? "Connected to qm-sync server"
            : "Alerts will be active when qm-sync server is connected"}
        </span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-4">
          <RefreshCw
            className="w-6 h-6 animate-spin"
            style={{ color: "var(--color-text-muted)" }}
          />
        </div>
      ) : (
        <>
          {/* Notification Preferences */}
          <div className="space-y-4">
            <p
              style={{
                fontSize: "var(--text-sm)",
                color: "var(--color-text-secondary)",
              }}
            >
              Configure how you receive price alerts when your target or stop
              loss prices are hit.
            </p>

            {/* Push Notifications */}
            <div
              className="flex items-center justify-between p-3 rounded-lg"
              style={{ background: "var(--glass-bg-dark)" }}
            >
              <div className="flex items-center gap-3">
                <Smartphone
                  className="w-5 h-5"
                  style={{ color: "var(--color-text-secondary)" }}
                />
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
                  <p
                    style={{
                      fontSize: "var(--text-xs)",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    Receive instant alerts on your device
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={preferences.push_enabled}
                  onChange={(e) =>
                    setPreferences((prev) => ({
                      ...prev,
                      push_enabled: e.target.checked,
                    }))
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
                      background: "var(--color-bg-tertiary)",
                      transform: preferences.push_enabled
                        ? "translateX(20px)"
                        : "translateX(0)",
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
                <Mail
                  className="w-5 h-5"
                  style={{ color: "var(--color-text-secondary)" }}
                />
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
                  <p
                    style={{
                      fontSize: "var(--text-xs)",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    Receive alerts via email
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={preferences.email_enabled}
                  onChange={(e) =>
                    setPreferences((prev) => ({
                      ...prev,
                      email_enabled: e.target.checked,
                    }))
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
                      background: "var(--color-bg-tertiary)",
                      transform: preferences.email_enabled
                        ? "translateX(20px)"
                        : "translateX(0)",
                    }}
                  />
                </div>
              </label>
            </div>

            {/* Email address input (shown when email is enabled) */}
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
                  onChange={(e) =>
                    setPreferences((prev) => ({
                      ...prev,
                      email_address: e.target.value,
                    }))
                  }
                  placeholder="your@email.com"
                  className="glass-input w-full mt-1 px-3 py-2 rounded-lg"
                  style={{
                    fontSize: "var(--text-sm)",
                  }}
                />
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={isSaving || !serverConnected}
              className="w-full py-2 px-4 rounded-lg transition-colors"
              style={{
                backgroundColor:
                  serverConnected && !isSaving
                    ? "var(--color-violet-500)"
                    : "var(--color-text-muted)",
                color: "var(--color-text-primary)",
                opacity: isSaving ? 0.7 : 1,
                cursor: serverConnected ? "pointer" : "not-allowed",
              }}
            >
              {isSaving
                ? "Saving..."
                : serverConnected
                  ? "Save Preferences"
                  : "Connect to Server First"}
            </button>
          </div>

          {/* Info about server-side monitoring */}
          <div
            className="pt-4"
            style={{
              borderTop: "1px solid var(--glass-border-light)",
            }}
          >
            <p
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--color-text-secondary)",
              }}
            >
              Price alerts are monitored by the qm-sync server. Set target and
              stop-loss prices on your portfolio entries, and you&apos;ll be
              notified when those prices are reached - even when the app is
              closed.
            </p>
          </div>
        </>
      )}
    </div>
  );
};
