/**
 * IndexedDB Sync Adapter
 *
 * Implements ISyncService for http applications using IndexedDB/Dexie.
 * Combines QmSyncClient and IndexedDBSyncStorage to provide full sync functionality.
 */

import type { ISyncService } from "@fin-catch/ui/adapters/factory/interfaces";
import type { SyncProgress, SyncResult, SyncStatus } from "@fin-catch/shared";
import {
  createSyncClientConfig,
  type HttpClientFn,
  QmSyncClient,
} from "@fin-catch/shared";
import { IndexedDBSyncStorage } from "./IndexedDBSyncStorage";
import { getCurrentTimestamp } from "../database";

/**
 * Token provider function type.
 * The sync adapter gets tokens from the auth service (single source of truth).
 */
export type TokenProvider = () => Promise<{
  accessToken?: string;
  refreshToken?: string;
  userId?: string;
}>;

/**
 * Token saver function type.
 * Used when sync service needs to save tokens (e.g., after token refresh).
 */
export type TokenSaver = (
  accessToken: string,
  refreshToken: string,
  userId: string,
) => Promise<void>;

/**
 * Sync config provider function type.
 * Returns current sync configuration dynamically.
 */
export type SyncConfigProvider = () => {
  serverUrl: string;
  appId: string;
  apiKey: string;
};

export interface IndexedDBSyncAdapterConfig {
  /** Dynamic config provider from auth service */
  getConfig: SyncConfigProvider;
  /** Optional custom HTTP client (defaults to fetch) */
  httpClient?: HttpClientFn;
  /** Token provider from auth service (single source of truth) */
  getTokens: TokenProvider;
  /** Optional token saver for when sync refreshes tokens */
  saveTokens?: TokenSaver;
}

/**
 * ISyncService implementation for IndexedDB.
 */
export class IndexedDBSyncAdapter implements ISyncService {
  private client: QmSyncClient | null = null;
  private storage: IndexedDBSyncStorage;
  private config: IndexedDBSyncAdapterConfig;
  private initialized = false;
  private lastConfigHash: string = "";

  constructor(config: IndexedDBSyncAdapterConfig) {
    this.config = config;
    this.storage = new IndexedDBSyncStorage();
  }

  private getConfigHash(syncConfig: {
    serverUrl: string;
    appId: string;
    apiKey: string;
  }): string {
    return `${syncConfig.serverUrl}|${syncConfig.appId}|${syncConfig.apiKey}`;
  }

  private ensureClient(): QmSyncClient {
    const syncConfig = this.config.getConfig();
    const configHash = this.getConfigHash(syncConfig);

    if (!this.client || configHash !== this.lastConfigHash) {
      const clientConfig = createSyncClientConfig(
        syncConfig.serverUrl,
        syncConfig.appId,
        syncConfig.apiKey,
      );
      this.client = new QmSyncClient(clientConfig, this.config.httpClient);
      this.lastConfigHash = configHash;
      this.initialized = false;
    }

    return this.client;
  }

  /**
   * Initialize the adapter by getting tokens from auth service (single source of truth).
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    const client = this.ensureClient();
    // Get tokens from auth service (single source of truth)
    const { accessToken, refreshToken, userId } = await this.config.getTokens();
    if (accessToken && refreshToken) {
      client.setTokens(accessToken, refreshToken, userId);
      console.log("[IndexedDBSyncAdapter] Tokens loaded from auth service");
    } else {
      console.log(
        "[IndexedDBSyncAdapter] No tokens available from auth service",
      );
    }

    this.initialized = true;
  }

  /**
   * Login and store tokens via auth service.
   * Note: In the unified token pattern, auth service handles login directly.
   * This method is kept for compatibility but delegates to auth service for token storage.
   */
  async login(email: string, password: string): Promise<void> {
    const client = this.ensureClient();
    const auth = await client.login(email, password);
    // Save tokens via auth service (single source of truth)
    if (this.config.saveTokens) {
      await this.config.saveTokens(
        auth.accessToken,
        auth.refreshToken,
        auth.userId,
      );
    }
  }

  /**
   * Register and store tokens via auth service.
   * Note: In the unified token pattern, auth service handles registration directly.
   * This method is kept for compatibility but delegates to auth service for token storage.
   */
  async register(
    username: string,
    email: string,
    password: string,
  ): Promise<void> {
    const client = this.ensureClient();
    const auth = await client.register(username, email, password);
    // Save tokens via auth service (single source of truth)
    if (this.config.saveTokens) {
      await this.config.saveTokens(
        auth.accessToken,
        auth.refreshToken,
        auth.userId,
      );
    }
  }

  /**
   * Logout - clears client state.
   * Note: Token clearing is handled by auth service.
   */
  async logout(): Promise<void> {
    const client = this.ensureClient();
    client.logout();
    this.initialized = false; // Reset so next sync will re-fetch tokens
  }

  /**
   * Check if authenticated.
   */
  isAuthenticated(): boolean {
    const client = this.ensureClient();
    return client.isAuthenticated();
  }

  // =========================================================================
  // ISyncService Implementation
  // =========================================================================

  /**
   * Trigger a sync operation.
   * Pushes local changes and pulls remote changes.
   */
  async syncNow(): Promise<SyncResult> {
    // Call syncWithProgress with a no-op callback for backwards compatibility
    return this.syncWithProgress(() => {});
  }

  /**
   * Trigger a sync operation with progress updates.
   * Handles hasMore pagination to pull all records from all pages.
   */
  async syncWithProgress(
    onProgress: (progress: SyncProgress) => void,
  ): Promise<SyncResult> {
    // Get fresh client with current config
    const client = this.ensureClient();

    // Always refresh tokens from auth service before syncing
    // This ensures we pick up tokens if user logged in after adapter was created
    const { accessToken, refreshToken, userId } = await this.config.getTokens();
    if (accessToken && refreshToken) {
      client.setTokens(accessToken, refreshToken, userId);
      console.log(
        "[IndexedDBSyncAdapter] Tokens refreshed from auth service for sync",
      );
    }
    this.initialized = true;

    if (!client.isAuthenticated()) {
      console.log("[IndexedDBSyncAdapter] Not authenticated - cannot sync");
      return {
        pushed: 0,
        pulled: 0,
        conflicts: 0,
        success: false,
        error: "Not authenticated",
        syncedAt: getCurrentTimestamp(),
      };
    }

    try {
      // Get pending local changes
      const pendingChanges = await this.storage.getPendingChanges();

      // Get last checkpoint
      const checkpoint = await this.storage.getCheckpoint();

      // Perform delta sync
      const response = await client.delta(pendingChanges, checkpoint);

      let pushed = 0;
      let pulled = 0;
      let conflicts = 0;

      // Handle push result
      if (response.push) {
        pushed = response.push.synced;
        conflicts = response.push.conflicts.length;

        // Mark pushed records as synced
        if (pushed > 0) {
          const syncedIds = pendingChanges.map((r) => ({
            tableName: r.tableName,
            rowId: r.rowId,
          }));
          await this.storage.markSynced(syncedIds);
        }

        // Emit progress after push phase
        onProgress({
          phase: "pushing",
          recordsPushed: pushed,
          recordsPulled: 0,
          hasMore: response.pull?.hasMore ?? false,
          currentPage: 0,
        });
      }

      // Handle pull result with hasMore pagination
      if (response.pull) {
        // Collect ALL records from ALL pages first to ensure proper ordering
        const allRecords = [...response.pull.records];
        pulled = allRecords.length;

        // Auto-continue pulling while hasMore is true
        let currentCheckpoint = response.pull.checkpoint;
        let hasMore = response.pull.hasMore;
        let page = 1;

        // Emit progress after initial pull
        onProgress({
          phase: "pulling",
          recordsPushed: pushed,
          recordsPulled: pulled,
          hasMore,
          currentPage: page,
        });

        while (hasMore) {
          page++;
          console.log(
            "[IndexedDBSyncAdapter] Pulling more records, checkpoint:",
            currentCheckpoint,
          );

          const pullResponse = await client.pull(currentCheckpoint);

          // Collect records from this page
          allRecords.push(...pullResponse.records);
          pulled += pullResponse.records.length;

          currentCheckpoint = pullResponse.checkpoint;
          hasMore = pullResponse.hasMore;

          // Emit progress after each page
          onProgress({
            phase: "pulling",
            recordsPushed: pushed,
            recordsPulled: pulled,
            hasMore,
            currentPage: page,
          });
        }

        // Apply ALL changes at once after collecting from all pages
        console.log(
          `[IndexedDBSyncAdapter] Applying ${allRecords.length} total records from ${page} pages`,
        );
        if (allRecords.length > 0) {
          await this.storage.applyRemoteChanges(allRecords);
        }

        // Save new checkpoint
        await this.storage.saveCheckpoint(currentCheckpoint);
      }

      // Save last sync timestamp
      const syncedAt = getCurrentTimestamp();
      await this.storage.saveLastSyncAt(syncedAt);

      return {
        pushed,
        pulled,
        conflicts,
        success: true,
        syncedAt,
      };
    } catch (error) {
      console.error("Sync failed:", error);
      return {
        pushed: 0,
        pulled: 0,
        conflicts: 0,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        syncedAt: getCurrentTimestamp(),
      };
    }
  }

  /**
   * Get current sync status.
   */
  async getStatus(): Promise<SyncStatus> {
    await this.initialize();

    const client = this.ensureClient();
    const [pendingChanges, lastSyncAt] = await Promise.all([
      this.storage.getPendingChangesCount(),
      this.storage.getLastSyncAt(),
    ]);

    return {
      configured: true,
      authenticated: client.isAuthenticated(),
      lastSyncAt,
      pendingChanges,
    };
  }

  // =========================================================================
  // Storage Access
  // =========================================================================

  /**
   * Get the storage instance for direct access.
   */
  getStorage(): IndexedDBSyncStorage {
    return this.storage;
  }

  /**
   * Get the client instance for direct access.
   */
  getClient(): QmSyncClient {
    return this.ensureClient();
  }
}

/**
 * Create a configured IndexedDBSyncAdapter.
 * @param config - Full configuration including token provider from auth service
 */
export function createIndexedDBSyncAdapter(
  config: IndexedDBSyncAdapterConfig,
): IndexedDBSyncAdapter {
  return new IndexedDBSyncAdapter(config);
}
