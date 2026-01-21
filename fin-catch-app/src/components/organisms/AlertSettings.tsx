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
          <Bell className="w-5 h-5" style={{ color: "var(--cube-gray-600)" }} />
          <h3
            style={{
              fontSize: "var(--text-lg)",
              fontWeight: "var(--font-semibold)",
              color: "var(--cube-gray-900)",
            }}
          >
            Price Alerts
          </h3>
        </div>
        <button
          onClick={loadPreferences}
          disabled={isLoading}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <RefreshCw
            className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
            style={{ color: "var(--cube-gray-500)" }}
          />
        </button>
      </div>

      {/* Server status indicator */}
      <div
        className="flex items-center gap-2 p-2 rounded-lg"
        style={{
          backgroundColor: serverConnected
            ? "rgba(16, 185, 129, 0.1)"
            : "rgba(245, 158, 11, 0.1)",
        }}
      >
        <Cloud
          className="w-4 h-4"
          style={{ color: serverConnected ? "#10b981" : "#f59e0b" }}
        />
        <span
          style={{
            fontSize: "var(--text-sm)",
            color: serverConnected ? "#065f46" : "#92400e",
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
            style={{ color: "var(--cube-gray-400)" }}
          />
        </div>
      ) : (
        <>
          {/* Notification Preferences */}
          <div className="space-y-4">
            <p
              style={{
                fontSize: "var(--text-sm)",
                color: "var(--cube-gray-600)",
              }}
            >
              Configure how you receive price alerts when your target or stop
              loss prices are hit.
            </p>

            {/* Push Notifications */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
              <div className="flex items-center gap-3">
                <Smartphone
                  className="w-5 h-5"
                  style={{ color: "var(--cube-gray-600)" }}
                />
                <div>
                  <span
                    style={{
                      fontSize: "var(--text-sm)",
                      fontWeight: "var(--font-medium)",
                      color: "var(--cube-gray-900)",
                    }}
                  >
                    Push Notifications
                  </span>
                  <p
                    style={{
                      fontSize: "var(--text-xs)",
                      color: "var(--cube-gray-500)",
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
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Email Notifications */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
              <div className="flex items-center gap-3">
                <Mail
                  className="w-5 h-5"
                  style={{ color: "var(--cube-gray-600)" }}
                />
                <div>
                  <span
                    style={{
                      fontSize: "var(--text-sm)",
                      fontWeight: "var(--font-medium)",
                      color: "var(--cube-gray-900)",
                    }}
                  >
                    Email Notifications
                  </span>
                  <p
                    style={{
                      fontSize: "var(--text-xs)",
                      color: "var(--cube-gray-500)",
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
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Email address input (shown when email is enabled) */}
            {preferences.email_enabled && (
              <div className="pl-8">
                <label
                  style={{
                    fontSize: "var(--text-sm)",
                    fontWeight: "var(--font-medium)",
                    color: "var(--cube-gray-700)",
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
                  className="w-full mt-1 px-3 py-2 rounded-lg border"
                  style={{
                    borderColor: "var(--cube-gray-300)",
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
                    ? "var(--primary-color, #3b82f6)"
                    : "#9ca3af",
                color: "white",
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
            className="pt-4 border-t"
            style={{ borderColor: "rgba(0, 0, 0, 0.1)" }}
          >
            <p
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--cube-gray-500)",
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
