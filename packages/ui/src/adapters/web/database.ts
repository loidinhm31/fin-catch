/**
 * IndexedDB Database Setup using Dexie
 *
 * Dexie provides a minimalistic wrapper for IndexedDB with a powerful
 * and intuitive API. All fields use camelCase to match the server schema.
 */

import Dexie, { type EntityTable, type Table } from "dexie";
import type {
  BondCouponPayment,
  Portfolio,
  PortfolioEntry,
} from "@fin-catch/shared";

// =============================================================================
// Sync Metadata Types
// =============================================================================

/**
 * Sync metadata stored in IndexedDB
 */
export interface SyncMeta {
  key: string;
  value: string;
}

/**
 * Pending change record for tracking local modifications
 */
export interface PendingChange {
  id?: number; // Auto-increment
  tableName: string;
  rowId: string;
  operation: "create" | "update" | "delete";
  data: Record<string, unknown>;
  version: number;
  createdAt: number;
}

// =============================================================================
// Database Class
// =============================================================================

/**
 * FinCatch Database class extending Dexie
 */
export class FinCatchDatabase extends Dexie {
  // Entity tables
  portfolios!: EntityTable<Portfolio, "id">;
  portfolioEntries!: EntityTable<PortfolioEntry, "id">;
  couponPayments!: EntityTable<BondCouponPayment, "id">;

  // Sync tables
  _syncMeta!: Table<SyncMeta, string>;
  _pendingChanges!: Table<PendingChange, number>;

  constructor() {
    super("FinCatchDB");

    // Version 1: Legacy snake_case schema (kept for migration reference)
    this.version(1).stores({
      portfolios: "id, created_at, sync_version, synced_at",
      portfolioEntries:
        "id, portfolio_id, asset_type, symbol, created_at, sync_version, synced_at",
      couponPayments: "id, entry_id, payment_date, sync_version, synced_at",
      _syncMeta: "key",
      _pendingChanges: "++id, tableName, rowId",
    });

    // Version 2: camelCase schema (matches server)
    this.version(2)
      .stores({
        portfolios: "id, createdAt, syncVersion, syncedAt",
        portfolioEntries:
          "id, portfolioId, assetType, symbol, createdAt, syncVersion, syncedAt",
        couponPayments: "id, entryId, paymentDate, syncVersion, syncedAt",
        _syncMeta: "key",
        _pendingChanges: "++id, tableName, rowId",
      })
      .upgrade((trans) => {
        // Clear all data on upgrade - fresh start with camelCase
        // This is acceptable since data syncs from server
        return Promise.all([
          trans.table("portfolios").clear(),
          trans.table("portfolioEntries").clear(),
          trans.table("couponPayments").clear(),
          trans.table("_syncMeta").clear(),
          trans.table("_pendingChanges").clear(),
        ]);
      });

    // Map table names
    this.portfolios = this.table("portfolios");
    this.portfolioEntries = this.table("portfolioEntries");
    this.couponPayments = this.table("couponPayments");
    this._syncMeta = this.table("_syncMeta");
    this._pendingChanges = this.table("_pendingChanges");
  }

  /**
   * Get a sync meta value by key
   */
  async getSyncMeta(key: string): Promise<string | undefined> {
    const record = await this._syncMeta.get(key);
    return record?.value;
  }

  /**
   * Set a sync meta value
   */
  async setSyncMeta(key: string, value: string): Promise<void> {
    await this._syncMeta.put({ key, value });
  }

  /**
   * Delete a sync meta value
   */
  async deleteSyncMeta(key: string): Promise<void> {
    await this._syncMeta.delete(key);
  }
}

// Singleton database instance
export const db = new FinCatchDatabase();

/**
 * Generate a UUID v4
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Get current Unix timestamp in seconds
 */
export function getCurrentTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

// =============================================================================
// Sync Meta Keys
// =============================================================================

export const SYNC_META_KEYS = {
  CHECKPOINT: "checkpoint",
  LAST_SYNC_AT: "lastSyncAt",
  // Note: Token storage has been moved to auth service (localStorage)
  // for unified token management across auth and sync services
} as const;
