/**
 * AlertModeSelector — compact per-user alert mode control for the portfolio page.
 *
 * Fetches current alert_mode from GET /api/v1/notifications/preferences and saves
 * via PUT on selection. Self-contained — no props required.
 * Only renders when authenticated and server-connected.
 */

import React, { useState, useEffect, useCallback } from "react";
import { Zap } from "lucide-react";
import { AUTH_STORAGE_KEYS } from "@fin-catch/shared";
import { authGetStatus } from "@fin-catch/ui/services";

type AlertMode = "auto" | "realtime" | "cronjob";

const MODES: { value: AlertMode; label: string; title: string }[] = [
  { value: "auto", label: "Auto", title: "Realtime when DNSE active, scheduled otherwise" },
  { value: "cronjob", label: "Scheduled", title: "Price polling every 60s" },
  { value: "realtime", label: "Realtime", title: "MQTT ticks via DNSE trading session" },
];

export const AlertModeSelector: React.FC = () => {
  const [mode, setMode] = useState<AlertMode>("auto");
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const status = await authGetStatus();
      if (!status.isAuthenticated) return;
      const url = status.serverUrl || "http://localhost:3000";
      setServerUrl(url);
      const token = localStorage.getItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN);
      const res = await fetch(`${url}/api/v1/notifications/preferences`, {
        headers: { Authorization: `Bearer ${token ?? ""}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMode(data.alert_mode ?? "auto");
      }
    } catch {
      // silently fail — not critical for portfolio display
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSelect = useCallback(
    async (selected: AlertMode) => {
      if (!serverUrl || saving) return;
      const previous = mode;
      setMode(selected);
      setSaving(true);
      try {
        const token = localStorage.getItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN);
        const res = await fetch(`${serverUrl}/api/v1/notifications/preferences`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token ?? ""}`,
          },
          body: JSON.stringify({ alert_mode: selected === "auto" ? null : selected }),
        });
        if (!res.ok) setMode(previous);
      } catch {
        setMode(previous);
      } finally {
        setSaving(false);
      }
    },
    [serverUrl, saving, mode],
  );

  if (!serverUrl) return null;

  return (
    <div className="flex items-center gap-2">
      <Zap
        className="w-3.5 h-3.5 shrink-0"
        style={{ color: "var(--color-text-muted)" }}
      />
      <div className="flex gap-1">
        {MODES.map(({ value, label, title }) => (
          <button
            key={value}
            onClick={() => handleSelect(value)}
            disabled={saving}
            title={title}
            className="px-2.5 py-1 rounded-md text-xs font-medium transition-all"
            style={
              mode === value
                ? {
                    background: "var(--color-violet-500)",
                    color: "var(--color-bg-white)",
                    opacity: saving ? 0.7 : 1,
                  }
                : {
                    background: "transparent",
                    color: "var(--color-text-secondary)",
                    border: "1px solid var(--glass-border-medium)",
                    opacity: saving ? 0.5 : 1,
                  }
            }
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};
