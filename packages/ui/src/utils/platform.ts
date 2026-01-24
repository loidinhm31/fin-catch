/**
 * Platform detection utilities for fin-catch app
 * Enables the same React bundle to run in both Tauri and http browser
 */

/**
 * Check if running inside Tauri webview
 * Detects presence of Tauri's injected API
 */
export const isTauri = (): boolean => {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
};

/**
 * Check if running in a regular http browser
 */
export const isWeb = (): boolean => !isTauri();

/**
 * Port for the embedded http server (must match Rust web_server.rs)
 */
export const WEB_SERVER_PORT = 25092;

/**
 * Get the URL for the embedded http server
 */
export const getWebServerUrl = (): string =>
  `http://localhost:${WEB_SERVER_PORT}`;

/**
 * Get the session token from URL query params (for browser mode)
 */
export const getSessionToken = (): string | null => {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  return params.get("session");
};

/**
 * Check if the browser was opened from the desktop app (has session token)
 */
export const isOpenedFromDesktop = (): boolean => {
  return getSessionToken() !== null;
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
 * Check if running on desktop Tauri (not Android/iOS)
 */
export const isDesktop = (): boolean => {
  return isTauri() && !isMobile();
};

/**
 * Get platform name for logging/display
 */
export const getPlatformName = (): "tauri" | "http" => {
  return isTauri() ? "tauri" : "http";
};

/**
 * Check if native file system access is available
 */
export const hasNativeFileSystem = (): boolean => isTauri();

/**
 * Check if auth/sync features are available
 * Available on all platforms via qm-center-server
 */
export const hasAuthSupport = (): boolean => true;

/**
 * Check if market data APIs are available
 * Available on all platforms via qm-center-server
 */
export const hasMarketDataSupport = (): boolean => true;
