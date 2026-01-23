/**
 * IndexedDB Sync Adapter
 *
 * Implements ISyncService for web applications using IndexedDB/Dexie.
 * Combines QmSyncClient and IndexedDBSyncStorage to provide full sync functionality.
 */

import type { ISyncService } from "@repo/shared/services";
import type { SyncResult, SyncStatus } from "@repo/shared/types";
import {
  createSyncClientConfig,
  type HttpClientFn,
  QmSyncClient,
} from "./QmSyncClient";
import { IndexedDBSyncStorage } from "./IndexedDBSyncStorage";
import { getCurrentTimestamp } from "../adapters/indexeddb/database";

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

export interface IndexedDBSyncAdapterConfig {
  serverUrl: string;
  appId: string;
  apiKey: string;
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
  private client: QmSyncClient;
  private storage: IndexedDBSyncStorage;
  private config: IndexedDBSyncAdapterConfig;
  private initialized = false;

  constructor(config: IndexedDBSyncAdapterConfig) {
    this.config = config;
    const clientConfig = createSyncClientConfig(
      config.serverUrl,
      config.appId,
      config.apiKey,
    );
    this.client = new QmSyncClient(clientConfig, config.httpClient);
    this.storage = new IndexedDBSyncStorage();
  }

  /**
   * Initialize the adapter by getting tokens from auth service (single source of truth).
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Get tokens from auth service (single source of truth)
    const { accessToken, refreshToken, userId } = await this.config.getTokens();
    if (accessToken && refreshToken) {
      this.client.setTokens(accessToken, refreshToken, userId);
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
    const auth = await this.client.login(email, password);
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
    const auth = await this.client.register(username, email, password);
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
    this.client.logout();
    this.initialized = false; // Reset so next sync will re-fetch tokens
  }

  /**
   * Check if authenticated.
   */
  isAuthenticated(): boolean {
    return this.client.isAuthenticated();
  }

  // =========================================================================
  // ISyncService Implementation
  // =========================================================================

  /**
   * Trigger a sync operation.
   * Pushes local changes and pulls remote changes.
   */
  async syncNow(): Promise<SyncResult> {
    // Always refresh tokens from auth service before syncing
    // This ensures we pick up tokens if user logged in after adapter was created
    const { accessToken, refreshToken, userId } = await this.config.getTokens();
    if (accessToken && refreshToken) {
      this.client.setTokens(accessToken, refreshToken, userId);
      console.log(
        "[IndexedDBSyncAdapter] Tokens refreshed from auth service for sync",
      );
    }
    this.initialized = true;

    if (!this.client.isAuthenticated()) {
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
      const response = await this.client.delta(pendingChanges, checkpoint);

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
      }

      // Handle pull result
      if (response.pull) {
        pulled = response.pull.records.length;

        // Apply remote changes to local DB
        if (pulled > 0) {
          await this.storage.applyRemoteChanges(response.pull.records);
        }

        // Save new checkpoint
        await this.storage.saveCheckpoint(response.pull.checkpoint);
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

    const [pendingChanges, lastSyncAt] = await Promise.all([
      this.storage.getPendingChangesCount(),
      this.storage.getLastSyncAt(),
    ]);

    return {
      configured: true,
      authenticated: this.client.isAuthenticated(),
      lastSyncAt,
      pendingChanges,
      serverUrl: this.client.config.serverUrl,
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
    return this.client;
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
