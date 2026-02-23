import { SyncProgress, SyncResult, SyncStatus } from "@fin-catch/shared";
import { getSyncService } from "@fin-catch/ui/adapters/factory";

export async function syncNow(): Promise<SyncResult> {
  return getSyncService().syncNow();
}

export async function syncGetStatus(): Promise<SyncStatus> {
  return getSyncService().getStatus();
}

export async function syncWithProgress(
  onProgress: (progress: SyncProgress) => void,
): Promise<SyncResult> {
  const syncService = getSyncService();
  if (syncService.syncWithProgress) {
    return syncService.syncWithProgress(onProgress);
  }
  // Fallback to syncNow if syncWithProgress is not available
  return syncService.syncNow();
}
