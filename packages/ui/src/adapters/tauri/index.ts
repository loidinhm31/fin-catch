/**
 * Tauri adapters for native functionality
 *
 * These adapters use IPC to call native Rust commands in the Tauri backend.
 * Only used when running in a Tauri webview (detected via isTauri()).
 */

export { TauriDataAdapter } from "./TauriDataAdapter";
