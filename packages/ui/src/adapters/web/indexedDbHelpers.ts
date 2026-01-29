import { db, generateId, getCurrentTimestamp } from "./database";

interface SyncTracked {
  id?: string;
  created_at?: number;
  sync_version?: number;
  synced_at?: number;
}

export function withSyncTracking<T extends SyncTracked>(
  entity: T,
  existing?: T,
): T {
  const now = getCurrentTimestamp();
  return {
    ...entity,
    id: entity.id || generateId(),
    created_at: entity.created_at || now,
    sync_version: (existing?.sync_version || 0) + 1,
    synced_at: undefined,
  };
}

export async function trackDelete(
  tableName: string,
  id: string,
  syncVersion: number,
): Promise<void> {
  await db._pendingChanges.add({
    tableName,
    rowId: id,
    operation: "delete",
    data: {},
    version: (syncVersion || 0) + 1,
    createdAt: getCurrentTimestamp(),
  });
}
