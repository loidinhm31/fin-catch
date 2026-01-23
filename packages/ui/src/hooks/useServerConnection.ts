/**
 * useServerConnection Hook
 *
 * Maintains an SSE connection to the desktop server when running in browser mode.
 * Listens for shutdown events and updates connection state accordingly.
 * When the server shuts down, sets the disconnected state which triggers a UI overlay.
 *
 * Note: Price alerts are now handled by qm-sync server via push/email/SSE notifications.
 * This hook only manages the browser-mode connection to the local desktop server.
 */

import { useState, useEffect, useCallback } from "react";
import {
  isOpenedFromDesktop,
  getSessionToken,
  WEB_SERVER_PORT,
} from "../utils/platform";

export interface ServerConnectionState {
  isConnected: boolean;
  isDisconnected: boolean;
  error: string | null;
  reconnectAttempts: number;
}

export function useServerConnection() {
  const [state, setState] = useState<ServerConnectionState>({
    isConnected: false,
    isDisconnected: false,
    error: null,
    reconnectAttempts: 0,
  });

  const connect = useCallback(() => {
    // Only connect if we're in browser mode opened from desktop
    if (!isOpenedFromDesktop()) {
      return null;
    }

    const token = getSessionToken();
    if (!token) {
      console.log("[SSE] No session token, skipping SSE connection");
      return null;
    }

    console.log("[SSE] Connecting to server...");

    const eventSource = new EventSource(
      `http://localhost:${WEB_SERVER_PORT}/api/events?token=${encodeURIComponent(token)}`,
    );

    eventSource.onopen = () => {
      console.log("[SSE] Connection opened");
      setState((prev) => ({
        ...prev,
        isConnected: true,
        isDisconnected: false,
        error: null,
        reconnectAttempts: 0,
      }));
    };

    // Handle custom events
    eventSource.addEventListener("connected", (event) => {
      console.log("[SSE] Received: connected -", event.data);
      setState((prev) => ({
        ...prev,
        isConnected: true,
        isDisconnected: false,
      }));
    });

    eventSource.addEventListener("shutdown", (event) => {
      console.log("[SSE] Received: shutdown -", event.data);
      // Server is shutting down - set disconnected state
      setState((prev) => ({
        ...prev,
        isConnected: false,
        isDisconnected: true,
        error: null,
      }));
      // Close the connection
      eventSource.close();
    });

    eventSource.addEventListener("ping", (event) => {
      console.log("[SSE] Received: ping -", event.data);
    });

    // Note: price-alert events removed - alerts now come from qm-sync server
    // via push notifications, email, or qm-sync SSE subscription

    eventSource.onerror = (error) => {
      console.error("[SSE] Connection error:", error);

      // Check if this is a connection failure (server not running)
      if (eventSource.readyState === EventSource.CLOSED) {
        setState((prev) => {
          // If we were previously connected, this is a disconnect
          if (prev.isConnected) {
            return {
              ...prev,
              isConnected: false,
              isDisconnected: true,
              error: "Server connection lost",
            };
          }
          // Otherwise, increment reconnect attempts
          return {
            ...prev,
            isConnected: false,
            reconnectAttempts: prev.reconnectAttempts + 1,
            error: "Failed to connect to server",
          };
        });
      }
    };

    return eventSource;
  }, []);

  useEffect(() => {
    const eventSource = connect();

    // Cleanup on unmount
    return () => {
      if (eventSource) {
        console.log("[SSE] Closing connection");
        eventSource.close();
      }
    };
  }, [connect]);

  // Provide a way to manually acknowledge disconnection
  const acknowledgeDisconnect = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isDisconnected: false,
    }));
  }, []);

  return {
    ...state,
    acknowledgeDisconnect,
  };
}
