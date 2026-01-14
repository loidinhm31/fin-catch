// Sync types for data synchronization with sync-center

/**
 * Sync configuration status
 */
export interface SyncStatus {
  configured: boolean;
  authenticated: boolean;
  lastSyncAt?: number; // Unix timestamp
  pendingChanges: number;
  serverUrl?: string;
}

/**
 * Result of a sync operation
 */
export interface SyncResult {
  pushed: number; // Number of records pushed to server
  pulled: number; // Number of records pulled from server
  conflicts: number; // Number of conflicts detected
  success: boolean;
  error?: string;
  syncedAt: number; // Unix timestamp when sync completed
}

/**
 * Sync record for a single data item
 */
export interface SyncRecord {
  tableName: string;
  rowId: string; // UUID for sync
  data: Record<string, unknown>;
  version: number;
  deleted: boolean;
  syncedAt?: number;
}

/**
 * Metadata stored for each table's sync state
 */
export interface SyncMetadata {
  tableName: string;
  lastSyncTimestamp?: string;
  appId?: string;
  apiKey?: string;
}
