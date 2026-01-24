import { invoke } from "@tauri-apps/api/core";
import type { ISyncService, SyncResult, SyncStatus } from "@fin-catch/shared";

/**
 * Tauri adapter for sync operations
 * Wraps invoke() calls to Rust backend
 */
export class TauriSyncAdapter implements ISyncService {
  async syncNow(): Promise<SyncResult> {
    console.log("[Tauri IPC] sync_now");
    const result = await invoke<SyncResult>("sync_now");
    console.log("[Tauri IPC Response]", result);
    return result;
  }

  async getStatus(): Promise<SyncStatus> {
    console.log("[Tauri IPC] sync_get_status");
    const status = await invoke<SyncStatus>("sync_get_status");
    console.log("[Tauri IPC Response]", status);
    return status;
  }
}
