/**
 * IndexedDB Sync Storage
 *
 * Implements the LocalStorage pattern from qm-sync-client for IndexedDB/Dexie.
 * Provides methods for tracking pending changes, applying remote changes,
 * and managing sync checkpoints.
 *
 * Both local and server use camelCase field names - no conversion needed.
 * Only FK references need mapping: portfolioId <-> portfolioSyncUuid, entryId <-> entrySyncUuid
 */

import {
  db,
  getCurrentTimestamp,
  SYNC_META_KEYS,
} from "@fin-catch/ui/adapters/web";
import type { Checkpoint, PullRecord, SyncRecord } from "@fin-catch/shared";

/** Maps local Dexie table names → server sync protocol table names. */
const LOCAL_TO_SERVER_TABLE: Record<string, string> = {
  couponPayments: "bondCouponPayments",
};

/** Maps server sync protocol table names → local Dexie table names. */
const SERVER_TO_LOCAL_TABLE: Record<string, string> = Object.fromEntries(
  Object.entries(LOCAL_TO_SERVER_TABLE).map(([local, server]) => [server, local]),
);

/** Resolve local table name to server table name (identity if no mapping exists). */
function resolveTableName(localName: string): string {
  return LOCAL_TO_SERVER_TABLE[localName] ?? localName;
}

/**
 * IndexedDB implementation of sync storage.
 */
export class IndexedDBSyncStorage {
  // =========================================================================
  // Pending Changes
  // =========================================================================

  /**
   * Get all records that have pending changes (not yet synced).
   *
   * This combines two sources:
   * 1. Records where syncedAt is undefined (creates/updates)
   * 2. Records in _pendingChanges table with operation="delete" (deletes)
   */
  async getPendingChanges(): Promise<SyncRecord[]> {
    const records: SyncRecord[] = [];

    // 1. Get unsynced portfolios (syncedAt is undefined)
    const portfolios = await db.portfolios.toArray();
    for (const portfolio of portfolios) {
      if (portfolio.syncedAt === undefined || portfolio.syncedAt === null) {
        records.push({
          tableName: "portfolios",
          rowId: portfolio.id,
          data: {
            name: portfolio.name,
            description: portfolio.description,
            baseCurrency: portfolio.baseCurrency,
            createdAt: portfolio.createdAt,
          },
          version: portfolio.syncVersion || 1,
          deleted: false,
        });
      }
    }

    // 2. Get unsynced portfolio entries (syncedAt is undefined)
    const entries = await db.portfolioEntries.toArray();
    for (const entry of entries) {
      if (entry.syncedAt === undefined || entry.syncedAt === null) {
        records.push({
          tableName: "portfolioEntries",
          rowId: entry.id,
          data: {
            portfolioSyncUuid: entry.portfolioId, // Map FK reference for server
            assetType: entry.assetType,
            symbol: entry.symbol,
            quantity: entry.quantity,
            purchasePrice: entry.purchasePrice,
            currency: entry.currency,
            purchaseDate: entry.purchaseDate,
            notes: entry.notes,
            tags: entry.tags,
            transactionFees: entry.transactionFees,
            source: entry.source,
            createdAt: entry.createdAt,
            unit: entry.unit,
            goldType: entry.goldType,
            faceValue: entry.faceValue,
            couponRate: entry.couponRate,
            maturityDate: entry.maturityDate,
            couponFrequency: entry.couponFrequency,
            currentMarketPrice: entry.currentMarketPrice,
            lastPriceUpdate: entry.lastPriceUpdate,
            ytm: entry.ytm,
            targetPrice: entry.targetPrice,
            stopLoss: entry.stopLoss,
            alertEnabled: entry.alertEnabled,
            lastAlertAt: entry.lastAlertAt,
            alertCount: entry.alertCount,
            lastAlertType: entry.lastAlertType,
          },
          version: entry.syncVersion || 1,
          deleted: false,
        });
      }
    }

    // 3. Get unsynced coupon payments (syncedAt is undefined)
    const payments = await db.couponPayments.toArray();
    for (const payment of payments) {
      if (payment.syncedAt === undefined || payment.syncedAt === null) {
        records.push({
          tableName: resolveTableName("couponPayments"),
          rowId: payment.id,
          data: {
            entrySyncUuid: payment.entryId, // Map FK reference for server
            paymentDate: payment.paymentDate,
            amount: payment.amount,
            currency: payment.currency,
            notes: payment.notes,
            createdAt: payment.createdAt,
          },
          version: payment.syncVersion || 1,
          deleted: false,
        });
      }
    }

    // 4. Get pending deletes from _pendingChanges table
    const pendingDeletes = await db._pendingChanges
      .filter((change) => change.operation === "delete")
      .toArray();
    for (const change of pendingDeletes) {
      records.push({
        tableName: resolveTableName(change.tableName),
        rowId: change.rowId,
        data: {},
        version: change.version,
        deleted: true,
      });
    }

    return records;
  }

  /**
   * Get the count of pending changes.
   */
  async getPendingChangesCount(): Promise<number> {
    let count = 0;

    // Count unsynced portfolios
    const portfolios = await db.portfolios.toArray();
    count += portfolios.filter(
      (p) => p.syncedAt === undefined || p.syncedAt === null,
    ).length;

    // Count unsynced entries
    const entries = await db.portfolioEntries.toArray();
    count += entries.filter(
      (e) => e.syncedAt === undefined || e.syncedAt === null,
    ).length;

    // Count unsynced payments
    const payments = await db.couponPayments.toArray();
    count += payments.filter(
      (p) => p.syncedAt === undefined || p.syncedAt === null,
    ).length;

    // Count pending deletes
    count += await db._pendingChanges
      .filter((change) => change.operation === "delete")
      .count();

    return count;
  }

  /**
   * Track a new pending change.
   */
  async trackChange(
    tableName: string,
    rowId: string,
    operation: "create" | "update" | "delete",
    data: Record<string, unknown>,
    version: number,
  ): Promise<void> {
    // Check if there's already a pending change for this record
    const existing = await db._pendingChanges
      .where({ tableName, rowId })
      .first();

    if (existing) {
      // Update the existing pending change
      await db._pendingChanges.update(existing.id!, {
        operation,
        data,
        version,
        createdAt: getCurrentTimestamp(),
      });
    } else {
      // Add a new pending change
      await db._pendingChanges.add({
        tableName,
        rowId,
        operation,
        data,
        version,
        createdAt: getCurrentTimestamp(),
      });
    }
  }

  /**
   * Mark records as synced after successful push.
   * Remove from pending changes and update syncedAt on the records.
   */
  async markSynced(
    recordIds: Array<{ tableName: string; rowId: string }>,
  ): Promise<void> {
    const now = getCurrentTimestamp();

    await db.transaction(
      "rw",
      [
        db._pendingChanges,
        db.portfolios,
        db.portfolioEntries,
        db.couponPayments,
      ],
      async () => {
        for (const { tableName, rowId } of recordIds) {
          // Convert server table names to local names for _pendingChanges lookup
          const localTableName = this.serverToLocalTableName(tableName);

          // Remove from pending changes (deletes are tracked here)
          await db._pendingChanges
            .where({ tableName: localTableName, rowId })
            .delete();

          // Update syncedAt on the actual record (if it still exists - not for deletes)
          const table = this.getTable(tableName);
          if (table) {
            // Only update if record exists (won't exist for deletes)
            const exists = await table.get(rowId);
            if (exists) {
              await table.update(rowId, { syncedAt: now });
            }
          }
        }
      },
    );
  }

  /** Convert server table name to local Dexie table name for _pendingChanges lookup. */
  private serverToLocalTableName(tableName: string): string {
    return SERVER_TO_LOCAL_TABLE[tableName] ?? tableName;
  }

  // =========================================================================
  // Remote Changes
  // =========================================================================

  /**
   * Apply changes received from the server.
   * Handles creates, updates, and deletes.
   */
  async applyRemoteChanges(records: PullRecord[]): Promise<void> {
    const now = getCurrentTimestamp();

    // Separate by deleted status
    const nonDeleted = records.filter((r) => !r.deleted);
    const deleted = records.filter((r) => r.deleted);

    // Sort non-deleted: parents first (portfolios=0 -> entries=1 -> payments=2)
    nonDeleted.sort(
      (a, b) =>
        this.getTableOrder(a.tableName) - this.getTableOrder(b.tableName),
    );

    // Sort deleted: children first (reverse order)
    deleted.sort(
      (a, b) =>
        this.getTableOrder(b.tableName) - this.getTableOrder(a.tableName),
    );

    await db.transaction(
      "rw",
      [db.portfolios, db.portfolioEntries, db.couponPayments],
      async () => {
        // Apply non-deleted first
        for (const record of nonDeleted) {
          await this.upsertRecord(record, now);
        }

        // Then apply deleted
        for (const record of deleted) {
          await this.deleteRecord(record);
        }
      },
    );
  }

  /**
   * Validate a record pulled from the server before inserting into IDB.
   * Rejects records with missing required fields or invalid enum values.
   */
  private validatePullRecord(record: PullRecord): boolean {
    if (!record.rowId || typeof record.rowId !== "string") return false;
    if (!record.data || typeof record.data !== "object") return false;

    switch (record.tableName) {
      case "portfolios": {
        const { name, createdAt } = record.data as Record<string, unknown>;
        if (!name || typeof name !== "string") return false;
        if (createdAt !== undefined && typeof createdAt !== "number")
          return false;
        break;
      }
      case "portfolioEntries": {
        const { assetType } = record.data as Record<string, unknown>;
        const validTypes = ["stock", "bond", "gold", "cash", "crypto"];
        if (!assetType || !validTypes.includes(assetType as string))
          return false;
        break;
      }
      case "bondCouponPayments": {
        const { amount, paymentDate } = record.data as Record<string, unknown>;
        if (typeof amount !== "number") return false;
        if (typeof paymentDate !== "number") return false;
        break;
      }
      default:
        return false;
    }
    return true;
  }

  /**
   * Insert or update a record from the server.
   * Server and local both use camelCase - only FK references need mapping.
   */
  private async upsertRecord(
    record: PullRecord,
    syncedAt: number,
  ): Promise<void> {
    const table = this.getTable(record.tableName);
    if (!table) {
      console.warn(`Unknown table: ${record.tableName}`);
      return;
    }

    if (!this.validatePullRecord(record)) {
      console.warn(
        `[IndexedDBSyncStorage] Rejected invalid record from server:`,
        { tableName: record.tableName, rowId: record.rowId },
      );
      return;
    }

    // Build the data object - server already sends camelCase
    const data: Record<string, unknown> = {
      ...record.data,
      id: record.rowId,
      syncVersion: record.version,
      syncedAt: syncedAt,
    };

    // Map FK references from server naming to local naming
    // Server uses portfolioSyncUuid/entrySyncUuid, local uses portfolioId/entryId
    if (data.portfolioSyncUuid !== undefined) {
      data.portfolioId = data.portfolioSyncUuid;
      delete data.portfolioSyncUuid;
    }
    if (data.entrySyncUuid !== undefined) {
      data.entryId = data.entrySyncUuid;
      delete data.entrySyncUuid;
    }

    // Ensure createdAt exists (use current time as fallback)
    if (!data.createdAt) {
      data.createdAt = syncedAt;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await table.put(data as any);
  }

  /**
   * Delete a record that was deleted on the server.
   */
  private async deleteRecord(record: PullRecord): Promise<void> {
    if (!record.rowId || typeof record.rowId !== "string") {
      console.warn(`[IndexedDBSyncStorage] Skipping delete with invalid rowId`, {
        tableName: record.tableName,
      });
      return;
    }
    const table = this.getTable(record.tableName);
    if (!table) {
      console.warn(`Unknown table: ${record.tableName}`);
      return;
    }

    await table.delete(record.rowId);
  }

  // =========================================================================
  // Checkpoint Management
  // =========================================================================

  /**
   * Get the last sync checkpoint.
   */
  async getCheckpoint(): Promise<Checkpoint | undefined> {
    const checkpointJson = await db.getSyncMeta(SYNC_META_KEYS.CHECKPOINT);
    if (!checkpointJson) return undefined;

    try {
      return JSON.parse(checkpointJson) as Checkpoint;
    } catch {
      return undefined;
    }
  }

  /**
   * Save the sync checkpoint.
   */
  async saveCheckpoint(checkpoint: Checkpoint): Promise<void> {
    await db.setSyncMeta(SYNC_META_KEYS.CHECKPOINT, JSON.stringify(checkpoint));
  }

  /**
   * Get the last sync timestamp.
   */
  async getLastSyncAt(): Promise<number | undefined> {
    const value = await db.getSyncMeta(SYNC_META_KEYS.LAST_SYNC_AT);
    return value ? parseInt(value, 10) : undefined;
  }

  /**
   * Save the last sync timestamp.
   */
  async saveLastSyncAt(timestamp: number): Promise<void> {
    await db.setSyncMeta(SYNC_META_KEYS.LAST_SYNC_AT, timestamp.toString());
  }

  // =========================================================================
  // Cleanup
  // =========================================================================

  /**
   * Hard delete records that were soft-deleted and synced.
   * Returns the number of records cleaned up.
   */
  async cleanupDeleted(): Promise<number> {
    // For now, we do hard deletes immediately, so nothing to clean up
    // This could be extended to support soft-delete patterns
    return 0;
  }

  /**
   * Clear all pending changes (e.g., after a full reset).
   */
  async clearPendingChanges(): Promise<void> {
    await db._pendingChanges.clear();
  }

  // =========================================================================
  // Helpers
  // =========================================================================

  /**
   * Get the Dexie table by name.
   */
  private getTable(tableName: string) {
    switch (tableName) {
      case "portfolios":
        return db.portfolios;
      case "portfolioEntries":
        return db.portfolioEntries;
      case "bondCouponPayments":
      case "couponPayments":
        return db.couponPayments;
      default:
        return undefined;
    }
  }

  /**
   * Get table order for FK-safe insert/delete ordering.
   * Lower = parent (insert first, delete last)
   */
  private getTableOrder(tableName: string): number {
    switch (tableName) {
      case "portfolios":
        return 0;
      case "portfolioEntries":
        return 1;
      case "bondCouponPayments":
      case "couponPayments":
        return 2;
      default:
        return 99;
    }
  }
}
