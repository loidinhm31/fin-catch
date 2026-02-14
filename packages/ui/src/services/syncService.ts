import { SyncProgress, SyncResult, SyncStatus } from "@fin-catch/shared";
import { getSyncService } from "@fin-catch/ui/adapters/factory";

function handleError(error: unknown): Error {
  if (typeof error === "string") {
    return new Error(error);
  }
  return error instanceof Error ? error : new Error("Unknown error occurred");
}

export async function syncNow(): Promise<SyncResult> {
  try {
    return await getSyncService().syncNow();
  } catch (error) {
    console.error("Error syncing:", error);
    throw handleError(error);
  }
}

export async function syncGetStatus(): Promise<SyncStatus> {
  try {
    return await getSyncService().getStatus();
  } catch (error) {
    console.error("Error getting sync status:", error);
    return {
      configured: false,
      authenticated: false,
      pendingChanges: 0,
    };
  }
}

export async function syncWithProgress(
  onProgress: (progress: SyncProgress) => void,
): Promise<SyncResult> {
  try {
    const syncService = getSyncService();
    if (syncService.syncWithProgress) {
      return await syncService.syncWithProgress(onProgress);
    }
    // Fallback to syncNow if syncWithProgress is not available
    return await syncService.syncNow();
  } catch (error) {
    console.error("Error syncing with progress:", error);
    throw handleError(error);
  }
}
