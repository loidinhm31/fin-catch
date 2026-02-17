/**
 * ServerDisconnectedOverlay
 *
 * Full-screen overlay shown when the desktop server has shut down.
 * Informs the user that the connection is lost and provides options.
 * Auto-closes the page after countdown.
 */

import React, { useState, useEffect, useCallback } from "react";
import { WifiOff, RefreshCw, X, XCircle } from "lucide-react";

interface ServerDisconnectedOverlayProps {
  onDismiss?: () => void;
  onRefresh?: () => void;
  autoCloseSeconds?: number;
}

export const ServerDisconnectedOverlay: React.FC<
  ServerDisconnectedOverlayProps
> = ({ onDismiss, onRefresh, autoCloseSeconds = 10 }) => {
  const [countdown, setCountdown] = useState(autoCloseSeconds);
  const [closeAttempted, setCloseAttempted] = useState(false);

  const handleClosePage = useCallback(() => {
    setCloseAttempted(true);

    // Try to close the window/tab
    try {
      window.close();

      // If window.close() doesn't work (e.g., tab wasn't opened by script),
      // show a message after a short delay
      setTimeout(() => {
        console.log("window.close() didn't work - tab wasn't opened by script");
      }, 100);
    } catch (error) {
      console.error("Failed to close window:", error);
    }
  }, []);

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      window.location.reload();
    }
  };

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) {
      handleClosePage();
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, handleClosePage]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        background: "rgba(0, 0, 0, 0.85)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        className="relative max-w-md w-full mx-4 rounded-2xl overflow-hidden"
        style={{
          background: "#1a1f3a",
          border: "1px solid var(--color-violet-500)",
          boxShadow: "var(--shadow-glow-violet)",
        }}
      >
        {/* Dismiss button */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-200 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Visual indicator */}
        <div
          className="p-8 text-white text-center"
          style={{
            background: "#DC2626",
            boxShadow: "var(--shadow-glow-red)",
          }}
        >
          <div
            className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ background: "var(--color-white-10)" }}
          >
            <WifiOff className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Desktop Disconnected</h2>
          <p className="text-white/90 text-sm">
            The desktop app has stopped the web server
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Auto-close countdown */}
          <div
            className="rounded-lg p-4 text-center"
            style={{ background: "var(--color-black-30)" }}
          >
            <p className="text-gray-300">
              {closeAttempted ? (
                <span style={{ color: "#ffb800" }}>
                  Unable to close automatically. Please close this tab manually.
                </span>
              ) : (
                <>
                  This page will close in{" "}
                  <span
                    className="font-bold text-2xl mx-1"
                    style={{ color: "var(--color-trade-sell)" }}
                  >
                    {countdown}
                  </span>{" "}
                  seconds
                </>
              )}
            </p>
          </div>

          <p className="text-gray-400 text-center text-sm">
            The connection to the desktop application has been closed. This
            usually means the &quot;Stop Web Server&quot; button was clicked in
            the desktop app.
          </p>

          <div className="flex flex-col gap-3 pt-2">
            {/* Close Page button */}
            <button
              onClick={handleClosePage}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 font-medium rounded-xl transition-colors"
              style={{
                background: "#DC2626",
                boxShadow: "var(--shadow-glow-red)",
                color: "white",
              }}
            >
              <XCircle className="w-5 h-5" />
              Close Page Now
            </button>

            <button
              onClick={handleRefresh}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 font-medium rounded-xl transition-colors"
              style={{
                background: "#3B82F6",
                boxShadow: "var(--shadow-glow-violet)",
                color: "white",
              }}
            >
              <RefreshCw className="w-5 h-5" />
              Refresh Page
            </button>

            {onDismiss && (
              <button
                onClick={onDismiss}
                className="w-full px-4 py-3 font-medium rounded-xl transition-colors"
                style={{
                  background: "var(--color-white-10)",
                  color: "var(--chart-axis)",
                }}
              >
                Continue in Offline Mode
              </button>
            )}
          </div>

          <p className="text-xs text-gray-500 text-center pt-2">
            To reconnect, click &quot;Open in Browser&quot; in the desktop app
            again.
          </p>
        </div>
      </div>
    </div>
  );
};
