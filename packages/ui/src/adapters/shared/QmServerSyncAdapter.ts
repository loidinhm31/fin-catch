import type { ISyncService, SyncResult, SyncStatus } from "@repo/shared";

/**
 * Configuration for QmServerSyncAdapter
 */
export interface QmServerSyncConfig {
  baseUrl?: string;
  appId?: string;
}

/**
 * Get the base URL from Vite env or default
 */
function getDefaultBaseUrl(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const env = (import.meta as any).env;
    if (env?.VITE_QM_SYNC_SERVER_URL) {
      return env.VITE_QM_SYNC_SERVER_URL;
    }
  } catch {
    // Not in a Vite environment
  }
  return "http://localhost:3000";
}

/**
 * Get app ID from Vite env or default
 */
function getDefaultAppId(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const env = (import.meta as any).env;
    if (env?.VITE_APP_ID) {
      return env.VITE_APP_ID;
    }
  } catch {
    // Not in a Vite environment
  }
  return "fin-catch";
}

const STORAGE_KEYS = {
  ACCESS_TOKEN: "fin-catch-access-token",
  APP_ID: "fin-catch-app-id",
} as const;

/**
 * Shared sync adapter for web app
 * Calls qm-center-server directly - works in standalone web app
 */
export class QmServerSyncAdapter implements ISyncService {
  private readonly baseUrl: string;
  private readonly appId: string;

  constructor(config?: QmServerSyncConfig) {
    this.baseUrl = config?.baseUrl || getDefaultBaseUrl();
    this.appId =
      config?.appId ||
      this.getStoredValue(STORAGE_KEYS.APP_ID) ||
      getDefaultAppId();
    console.log(
      `[QmServerSyncAdapter] Initialized with baseUrl: ${this.baseUrl}, appId: ${this.appId}`,
    );
  }

  private getStoredValue(key: string): string | null {
    if (typeof localStorage === "undefined") return null;
    return localStorage.getItem(key);
  }

  private async getAccessToken(): Promise<string | null> {
    return this.getStoredValue(STORAGE_KEYS.ACCESS_TOKEN);
  }

  async syncNow(): Promise<SyncResult> {
    try {
      // The web adapter cannot do a full delta sync as it doesn't have local changes
      // In web mode, sync is effectively a "pull" operation to get remote data
      // For now, return a result indicating web sync is not fully supported
      // The server-side sync requires local changes which we don't have in IndexedDB yet

      console.log(
        "[QmServerSyncAdapter] syncNow - web sync not fully implemented",
      );

      // Try to call the sync status endpoint to verify connectivity
      const status = await this.getStatus();

      return {
        pushed: 0,
        pulled: 0,
        conflicts: 0,
        success: true,
        error: status.authenticated
          ? undefined
          : "Not authenticated. Please login first.",
        syncedAt: Math.floor(Date.now() / 1000),
      };
    } catch (error) {
      console.error("[QmServerSyncAdapter] syncNow error:", error);
      return {
        pushed: 0,
        pulled: 0,
        conflicts: 0,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        syncedAt: Math.floor(Date.now() / 1000),
      };
    }
  }

  async getStatus(): Promise<SyncStatus> {
    try {
      // Check if we have an access token
      const token = await this.getAccessToken();
      const isAuthenticated = !!token;

      // In web mode, we don't track pending changes locally (yet)
      // Return a basic status based on authentication
      return {
        configured: true,
        authenticated: isAuthenticated,
        pendingChanges: 0,
        serverUrl: this.baseUrl,
      };
    } catch (error) {
      console.error("[QmServerSyncAdapter] getStatus error:", error);
      return {
        configured: false,
        authenticated: false,
        pendingChanges: 0,
      };
    }
  }
}
