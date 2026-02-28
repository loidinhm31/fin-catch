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

  constructor(dbName = "FinCatchDB") {
    super(dbName);

    this.version(1).stores({
      portfolios: "id, createdAt, syncVersion, syncedAt, deleted",
      portfolioEntries:
        "id, portfolioId, assetType, symbol, createdAt, syncVersion, syncedAt, deleted",
      couponPayments: "id, entryId, paymentDate, syncVersion, syncedAt, deleted",
      _syncMeta: "key",
      _pendingChanges: "++id, tableName, rowId",
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

// =============================================================================
// Per-user DB management
// =============================================================================

let _db: FinCatchDatabase | null = null;
let _currentUserId: string | null = null;

async function hashUserId(userId: string): Promise<string> {
  const encoded = new TextEncoder().encode(userId);
  const hash = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 12);
}

/**
 * Initialize (or reinitialize) the DB for a specific user.
 * If userId is undefined (standalone mode), uses the legacy "FinCatchDB" name.
 * Calling with the same userId is a no-op.
 */
export async function initDb(userId?: string): Promise<FinCatchDatabase> {
  if (!userId) {
    if (!_db || _currentUserId !== null) {
      if (_db) _db.close();
      _db = new FinCatchDatabase("FinCatchDB");
      _currentUserId = null;
    }
    return _db;
  }
  if (_db && _currentUserId === userId) return _db;
  if (_db) _db.close();
  const prefix = await hashUserId(userId);
  _db = new FinCatchDatabase(`FinCatchDB_${prefix}`);
  _currentUserId = userId;
  return _db;
}

/** Returns the active DB instance. Throws if initDb() has not been called. */
export function getDb(): FinCatchDatabase {
  if (!_db) throw new Error("FinCatchDB not initialized. Call initDb() first.");
  return _db;
}

/** Close and delete the current user's IndexedDB. Used on logout. */
export async function deleteCurrentDb(): Promise<void> {
  if (_db) {
    const name = _db.name;
    _db.close();
    await Dexie.delete(name);
    _db = null;
    _currentUserId = null;
  }
}

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
