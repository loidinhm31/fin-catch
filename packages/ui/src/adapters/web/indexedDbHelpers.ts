import { db, generateId, getCurrentTimestamp } from "./database";

interface SyncTracked {
  id?: string;
  createdAt?: number;
  syncVersion?: number;
  syncedAt?: number;
  deleted?: boolean;
  deletedAt?: number | null;
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
    // On update: preserve existing soft-delete state unless caller explicitly sets it.
    // On create (no existing): default to not-deleted.
    deleted: entity.deleted ?? existing?.deleted ?? false,
    deletedAt: entity.deletedAt !== undefined ? entity.deletedAt : (existing?.deletedAt ?? null),
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
