// Sync types for data synchronization with qm-sync

// Re-export sync protocol types from @qm-hub/sync-client-types (single source of truth)
export type {
  SyncRecord,
  Checkpoint,
  ConflictInfo,
  PushRequest,
  PushRecord,
  PushResponse,
  PullRequest,
  PullResponse,
  PullRecord,
  DeltaRequest,
  DeltaResponse,
  AuthHeaders,
  HttpRequest,
  HttpResponse,
  SyncClientConfig,
  RefreshResponse,
} from "@qm-hub/sync-client-types";

// Re-export helper functions
export {
  createAuthHeaders,
  withBearer,
  createSyncClientConfig,
  initialCheckpoint,
} from "@qm-hub/sync-client-types";

// Re-export client implementation for TypeScript/JavaScript apps
export {
  QmSyncClient,
  fetchHttpClient,
  type HttpClientFn,
} from "@qm-hub/sync-client-types";

// =============================================================================
// App-specific types (not in @qm-hub/sync-client-types)
// =============================================================================

/**
 * Sync configuration status
 */
export interface SyncStatus {
  configured: boolean;
  authenticated: boolean;
  lastSyncAt?: number; // Unix timestamp
  pendingChanges: number;
}

/**
 * Result of a sync operation.
 * Extends @qm-hub/sync-client-types SyncResult with app-specific syncedAt field.
 */
export interface SyncResult {
  pushed: number; // Number of records pushed to server
  pulled: number; // Number of records pulled from server
  conflicts: number; // Number of conflicts detected
  success: boolean;
  error?: string;
  syncedAt: number; // Unix timestamp when sync completed (app-specific)
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

/**
 * Progress information during sync operation
 */
export interface SyncProgress {
  phase: "pushing" | "pulling";
  recordsPushed: number;
  recordsPulled: number;
  hasMore: boolean;
  currentPage: number;
}
