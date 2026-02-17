/**
 * Platform detection utilities for fin-catch app
 * Storage uses IndexedDB on all platforms.
 * Tauri provides native fin-catch-data commands for market data (better performance).
 */

/**
 * Check if running inside a Tauri webview
 * Used to select native data adapter vs HTTP adapter
 */
export const isTauri = (): boolean => {
  // Check for Tauri v2 runtime
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
};

/**
 * Check if running on mobile device (Android/iOS) via user agent
 */
export const isMobile = (): boolean => {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes("android") || ua.includes("iphone") || ua.includes("ipad");
};

/**
 * Check if auth/sync features are available
 * Available on all platforms via qm-hub-server
 */
export const hasAuthSupport = (): boolean => true;

/**
 * Check if market data APIs are available
 * Available on all platforms via qm-hub-server
 */
export const hasMarketDataSupport = (): boolean => true;
