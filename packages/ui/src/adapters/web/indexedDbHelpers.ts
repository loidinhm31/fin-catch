import { db, generateId, getCurrentTimestamp } from "./database";

interface SyncTracked {
  id?: string;
  createdAt?: number;
  syncVersion?: number;
  syncedAt?: number;
}

export function withSyncTracking<T extends SyncTracked>(
  entity: T,
  existing?: T,
): T {
  const now = getCurrentTimestamp();
  return {
    ...entity,
    id: entity.id || generateId(),
    createdAt: entity.createdAt || now,
    syncVersion: (existing?.syncVersion || 0) + 1,
    syncedAt: undefined,
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
