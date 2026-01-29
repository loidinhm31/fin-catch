import type { ISyncService, SyncResult, SyncStatus } from "@fin-catch/shared";
import { tauriInvoke } from "./tauriInvoke";

export class TauriSyncAdapter implements ISyncService {
  async syncNow(): Promise<SyncResult> {
    return tauriInvoke<SyncResult>("sync_now");
  }

  async getStatus(): Promise<SyncStatus> {
    return tauriInvoke<SyncStatus>("sync_get_status");
  }
}
