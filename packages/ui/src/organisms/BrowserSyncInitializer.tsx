/**
 * BrowserSyncInitializer
 *
 * Wrapper component that maintains an SSE connection to the desktop server
 * when the app is running in browser mode. Shows a disconnected overlay
 * when the desktop server shuts down.
 */

import React from "react";
import { isOpenedFromDesktop } from "../utils/platform";
import { useServerConnection } from "../hooks/useServerConnection";
import { ServerDisconnectedOverlay } from "./ServerDisconnectedOverlay";

interface BrowserSyncInitializerProps {
  children: React.ReactNode;
}

export const BrowserSyncInitializer: React.FC<BrowserSyncInitializerProps> = ({
  children,
}) => {
  // SSE connection to detect server shutdown
  const { isDisconnected, acknowledgeDisconnect } = useServerConnection();

  // Only show overlay if opened from desktop and server disconnected
  const showOverlay = isOpenedFromDesktop() && isDisconnected;

  return (
    <>
      {/* Show disconnected overlay when server shuts down */}
      {showOverlay && (
        <ServerDisconnectedOverlay
          onDismiss={acknowledgeDisconnect}
          onRefresh={() => window.location.reload()}
        />
      )}
      {children}
    </>
  );
};
