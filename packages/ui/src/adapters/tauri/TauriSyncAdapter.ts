import type { SyncResult, SyncStatus } from "@fin-catch/shared";
import { tauriInvoke } from "./tauriInvoke";
import { ISyncService } from "@fin-catch/ui/adapters/factory/interfaces";

export class TauriSyncAdapter implements ISyncService {
  async syncNow(): Promise<SyncResult> {
    return tauriInvoke<SyncResult>("sync_now");
  }

  async getStatus(): Promise<SyncStatus> {
    return tauriInvoke<SyncStatus>("sync_get_status");
  }
}
