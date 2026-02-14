import React, { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import { PriceAlertEvent } from "@fin-catch/shared";

interface ToastItem {
  id: string;
  alert: PriceAlertEvent;
  createdAt: number;
}

interface PriceAlertToastProps {
  /** Duration in milliseconds before auto-dismiss (default: 10000) */
  duration?: number;
  /** Callback when an alert is clicked */
  onAlertClick?: (alert: PriceAlertEvent) => void;
}

export const PriceAlertToast: React.FC<PriceAlertToastProps> = ({
  duration = 10000,
  onAlertClick,
}) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((alert: PriceAlertEvent) => {
    const id = `${alert.entryId}-${alert.triggeredAt}`;
    setToasts((prev) => {
      // Don't add duplicate toasts
      if (prev.some((t) => t.id === id)) {
        return prev;
      }
      return [
        ...prev,
        {
          id,
          alert,
          createdAt: Date.now(),
        },
      ];
    });
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Auto-dismiss toasts
  useEffect(() => {
    if (toasts.length === 0) return;

    const timer = setInterval(() => {
      const now = Date.now();
      setToasts((prev) =>
        prev.filter((toast) => now - toast.createdAt < duration),
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [toasts.length, duration]);

  // Expose addToast for SSE alerts via a global callback
  // This allows qm-sync SSE connection to dispatch alerts to this component
  // Usage: window.__priceAlertToast?.addToast(alert)
  useEffect(() => {
    window.__priceAlertToast = { addToast };
    return () => {
      delete window.__priceAlertToast;
    };
  }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          onClick={() => onAlertClick?.(toast.alert)}
          className="animate-slide-up cursor-pointer"
          style={{
            backgroundColor:
              toast.alert.alertType === "target" ? "#d1fae5" : "#fee2e2",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            overflow: "hidden",
          }}
        >
          <div className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">
                    {toast.alert.alertType === "target" ? "🎯" : "🛑"}
                  </span>
                  <span
                    style={{
                      fontSize: "var(--text-base)",
                      fontWeight: "var(--font-bold)",
                      color:
                        toast.alert.alertType === "target"
                          ? "#065f46"
                          : "#991b1b",
                    }}
                  >
                    {toast.alert.symbol}
                  </span>
                  <span
                    style={{
                      fontSize: "var(--text-sm)",
                      color:
                        toast.alert.alertType === "target"
                          ? "#047857"
                          : "#b91c1c",
                    }}
                  >
                    {toast.alert.alertType === "target"
                      ? "Target Reached!"
                      : "Stop Loss Hit!"}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: "var(--text-sm)",
                    color: "var(--cube-gray-700)",
                  }}
                >
                  <span>Current: </span>
                  <span style={{ fontWeight: "var(--font-semibold)" }}>
                    {toast.alert.currentPrice.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                  <span> | Threshold: </span>
                  <span style={{ fontWeight: "var(--font-semibold)" }}>
                    {toast.alert.thresholdPrice.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeToast(toast.id);
                }}
                className="p-1 rounded-full hover:bg-black/10 transition-colors"
              >
                <X
                  className="w-4 h-4"
                  style={{ color: "var(--cube-gray-600)" }}
                />
              </button>
            </div>
          </div>
          {/* Progress bar */}
          <div
            className="h-1"
            style={{
              backgroundColor:
                toast.alert.alertType === "target" ? "#10b981" : "#ef4444",
              animation: `shrink ${duration}ms linear`,
              transformOrigin: "left",
            }}
          />
        </div>
      ))}

      <style>{`
        @keyframes shrink {
          from {
            transform: scaleX(1);
          }
          to {
            transform: scaleX(0);
          }
        }
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

// Type declaration for the global callback
declare global {
  interface Window {
    __priceAlertToast?: {
      addToast: (alert: PriceAlertEvent) => void;
    };
  }
}
