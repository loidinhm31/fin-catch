/**
 * IndexedDB Sync Storage
 *
 * Implements the LocalStorage pattern from qm-sync-client for IndexedDB/Dexie.
 * Provides methods for tracking pending changes, applying remote changes,
 * and managing sync checkpoints.
 *
 * Sync tracking approach (matches Rust/SQLite implementation):
 * - Creates/updates: Records have synced_at = undefined (pending)
 * - Deletes: Tracked in _pendingChanges table before hard delete
 * - After successful sync: synced_at is set, _pendingChanges entries removed
 */

import {
  db,
  getCurrentTimestamp,
  SYNC_META_KEYS,
} from "@fin-catch/ui/adapters/web";
import type { Checkpoint, PullRecord, SyncRecord } from "@fin-catch/shared";

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
   * 1. Records where synced_at is undefined (creates/updates) - like Rust implementation
   * 2. Records in _pendingChanges table with operation="delete" (deletes)
   */
  async getPendingChanges(): Promise<SyncRecord[]> {
    const records: SyncRecord[] = [];

    // 1. Get unsynced portfolios (synced_at is undefined)
    const portfolios = await db.portfolios.toArray();
    for (const portfolio of portfolios) {
      if (portfolio.synced_at === undefined || portfolio.synced_at === null) {
        records.push({
          tableName: "portfolios",
          rowId: portfolio.id,
          data: {
            name: portfolio.name,
            description: portfolio.description,
            baseCurrency: portfolio.base_currency,
            createdAt: portfolio.created_at,
          },
          version: portfolio.sync_version || 1,
          deleted: false,
        });
      }
    }

    // 2. Get unsynced portfolio entries (synced_at is undefined)
    const entries = await db.portfolioEntries.toArray();
    for (const entry of entries) {
      if (entry.synced_at === undefined || entry.synced_at === null) {
        records.push({
          tableName: "portfolio_entries",
          rowId: entry.id,
          data: {
            portfolioSyncUuid: entry.portfolio_id,
            assetType: entry.asset_type,
            symbol: entry.symbol,
            quantity: entry.quantity,
            purchasePrice: entry.purchase_price,
            currency: entry.currency,
            purchaseDate: entry.purchase_date,
            notes: entry.notes,
            tags: entry.tags,
            transactionFees: entry.transaction_fees,
            source: entry.source,
            createdAt: entry.created_at,
            unit: entry.unit,
            goldType: entry.gold_type,
            faceValue: entry.face_value,
            couponRate: entry.coupon_rate,
            maturityDate: entry.maturity_date,
            couponFrequency: entry.coupon_frequency,
            currentMarketPrice: entry.current_market_price,
            lastPriceUpdate: entry.last_price_update,
            ytm: entry.ytm,
            targetPrice: entry.target_price,
            stopLoss: entry.stop_loss,
            alertEnabled: entry.alert_enabled,
            lastAlertAt: entry.last_alert_at,
            alertCount: entry.alert_count,
            lastAlertType: entry.last_alert_type,
          },
          version: entry.sync_version || 1,
          deleted: false,
        });
      }
    }

    // 3. Get unsynced coupon payments (synced_at is undefined)
    const payments = await db.couponPayments.toArray();
    for (const payment of payments) {
      if (payment.synced_at === undefined || payment.synced_at === null) {
        records.push({
          tableName: "bond_coupon_payments",
          rowId: payment.id,
          data: {
            entrySyncUuid: payment.entry_id,
            paymentDate: payment.payment_date,
            amount: payment.amount,
            currency: payment.currency,
            notes: payment.notes,
            createdAt: payment.created_at,
          },
          version: payment.sync_version || 1,
          deleted: false,
        });
      }
    }

    // 4. Get pending deletes from _pendingChanges table
    const pendingDeletes = await db._pendingChanges
      .filter((change) => change.operation === "delete")
      .toArray();
    for (const change of pendingDeletes) {
      // Map local table names to server table names
      let tableName = change.tableName;
      if (tableName === "portfolioEntries") tableName = "portfolio_entries";
      if (tableName === "couponPayments") tableName = "bond_coupon_payments";

      records.push({
        tableName,
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
      (p) => p.synced_at === undefined || p.synced_at === null,
    ).length;

    // Count unsynced entries
    const entries = await db.portfolioEntries.toArray();
    count += entries.filter(
      (e) => e.synced_at === undefined || e.synced_at === null,
    ).length;

    // Count unsynced payments
    const payments = await db.couponPayments.toArray();
    count += payments.filter(
      (p) => p.synced_at === undefined || p.synced_at === null,
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
   * Remove from pending changes and update synced_at on the records.
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

          // Update synced_at on the actual record (if it still exists - not for deletes)
          const table = this.getTable(tableName);
          if (table) {
            // Only update if record exists (won't exist for deletes)
            const exists = await table.get(rowId);
            if (exists) {
              await table.update(rowId, { synced_at: now });
            }
          }
        }
      },
    );
  }

  /**
   * Convert server table name to local table name for _pendingChanges.
   */
  private serverToLocalTableName(tableName: string): string {
    switch (tableName) {
      case "portfolio_entries":
        return "portfolioEntries";
      case "bond_coupon_payments":
      case "coupon_payments":
        return "couponPayments";
      default:
        return tableName;
    }
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
   * Insert or update a record from the server.
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

    // Build the data object with server data
    // Use Record<string, unknown> to allow dynamic property access
    const data: Record<string, unknown> = {
      ...record.data,
      id: record.rowId,
      sync_version: record.version,
      synced_at: syncedAt,
    };

    // Convert camelCase to snake_case for all known fields
    // This handles the mismatch between server (camelCase) and local DB (snake_case)
    this.convertCamelToSnake(data, "createdAt", "created_at");
    this.convertCamelToSnake(data, "syncVersion", "sync_version");
    this.convertCamelToSnake(data, "syncedAt", "synced_at");

    // Portfolio entry fields
    this.convertCamelToSnake(data, "portfolioId", "portfolio_id");
    this.convertCamelToSnake(data, "portfolioSyncUuid", "portfolio_id"); // Server uses this name
    this.convertCamelToSnake(data, "assetType", "asset_type");
    this.convertCamelToSnake(data, "purchasePrice", "purchase_price");
    this.convertCamelToSnake(data, "purchaseDate", "purchase_date");
    this.convertCamelToSnake(data, "transactionFees", "transaction_fees");
    this.convertCamelToSnake(data, "goldType", "gold_type");
    this.convertCamelToSnake(data, "faceValue", "face_value");
    this.convertCamelToSnake(data, "couponRate", "coupon_rate");
    this.convertCamelToSnake(data, "maturityDate", "maturity_date");
    this.convertCamelToSnake(data, "couponFrequency", "coupon_frequency");
    this.convertCamelToSnake(
      data,
      "currentMarketPrice",
      "current_market_price",
    );
    this.convertCamelToSnake(data, "lastPriceUpdate", "last_price_update");
    this.convertCamelToSnake(data, "targetPrice", "target_price");
    this.convertCamelToSnake(data, "stopLoss", "stop_loss");
    this.convertCamelToSnake(data, "alertEnabled", "alert_enabled");
    // Alert tracking fields (server-updated)
    this.convertCamelToSnake(data, "lastAlertAt", "last_alert_at");
    this.convertCamelToSnake(data, "alertCount", "alert_count");
    this.convertCamelToSnake(data, "lastAlertType", "last_alert_type");

    // Coupon payment fields
    this.convertCamelToSnake(data, "entryId", "entry_id");
    this.convertCamelToSnake(data, "entrySyncUuid", "entry_id"); // Server might use this
    this.convertCamelToSnake(data, "paymentDate", "payment_date");

    // Portfolio fields
    this.convertCamelToSnake(data, "baseCurrency", "base_currency");

    // Ensure created_at exists (use current time as fallback)
    if (!data.created_at) {
      data.created_at = syncedAt;
    }

    console.log(
      `[IndexedDBSyncStorage] Upserting to ${record.tableName}:`,
      data,
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await table.put(data as any);
  }

  /**
   * Convert a camelCase field to snake_case if it exists.
   */
  private convertCamelToSnake(
    data: Record<string, unknown>,
    camelKey: string,
    snakeKey: string,
  ): void {
    if (data[camelKey] !== undefined && data[snakeKey] === undefined) {
      data[snakeKey] = data[camelKey];
      delete data[camelKey];
    }
  }

  /**
   * Delete a record that was deleted on the server.
   */
  private async deleteRecord(record: PullRecord): Promise<void> {
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
  // Note: Token storage has been removed from IndexedDBSyncStorage
  // Tokens are now managed by the auth service (single source of truth)
  // The sync adapter receives tokens via a provider function from auth service
  // =========================================================================

  // =========================================================================
  // Helpers
  // =========================================================================

  /**
   * Get the Dexie table by name.
   * Handles both camelCase (local) and snake_case (server) naming conventions.
   */
  private getTable(tableName: string) {
    switch (tableName) {
      case "portfolios":
        return db.portfolios;
      case "portfolioEntries":
      case "portfolio_entries":
        return db.portfolioEntries;
      case "couponPayments":
      case "coupon_payments":
      case "bondCouponPayments":
      case "bond_coupon_payments":
        return db.couponPayments;
      default:
        return undefined;
    }
  }

  /**
   * Get table order for FK-safe insert/delete ordering.
   * Lower = parent (insert first, delete last)
   * Handles both camelCase (local) and snake_case (server) naming conventions.
   */
  private getTableOrder(tableName: string): number {
    switch (tableName) {
      case "portfolios":
        return 0;
      case "portfolioEntries":
      case "portfolio_entries":
        return 1;
      case "couponPayments":
      case "coupon_payments":
      case "bondCouponPayments":
      case "bond_coupon_payments":
        return 2;
      default:
        return 99;
    }
  }
}
