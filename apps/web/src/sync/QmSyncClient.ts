/**
 * QM Sync Client for Browser
 *
 * TypeScript port of qm-sync-client using fetch for HTTP transport.
 * Implements the same API as the Rust SyncClient.
 */

import type {
  AuthHeaders,
  AuthResponse,
  Checkpoint,
  DeltaRequest,
  DeltaResponse,
  HttpRequest,
  HttpResponse,
  PullRequest,
  PullResponse,
  PushRecord,
  PushRequest,
  PushResponse,
  RefreshResponse,
  SyncClientConfig,
  SyncRecord,
} from "@repo/shared";

/**
 * HTTP client function type.
 * Implement this to provide custom HTTP transport.
 */
export type HttpClientFn = (request: HttpRequest) => Promise<HttpResponse>;

/**
 * Default fetch-based HTTP client implementation.
 */
export async function fetchHttpClient(
  request: HttpRequest,
): Promise<HttpResponse> {
  const headers: HeadersInit = {
    "Content-Type": request.headers.contentType,
    "X-API-Key": request.headers.apiKey,
    "X-App-Id": request.headers.appId,
  };

  if (request.headers.authorization) {
    headers["Authorization"] = request.headers.authorization;
  }

  try {
    const response = await fetch(request.url, {
      method: request.method,
      headers,
      body: request.body,
    });

    return {
      status: response.status,
      body: await response.text(),
    };
  } catch (error) {
    throw new Error(
      `HTTP request failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Sync client for communicating with qm-center-server.
 */
export class QmSyncClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private userId: string | null = null;

  constructor(
    public readonly config: SyncClientConfig,
    private readonly http: HttpClientFn = fetchHttpClient,
  ) {}

  // =========================================================================
  // Authentication
  // =========================================================================

  /**
   * Register a new user.
   */
  async register(
    username: string,
    email: string,
    password: string,
  ): Promise<AuthResponse> {
    const url = `${this.config.serverUrl}/api/v1/auth/register`;
    const headers = this.buildHeaders();
    const body = JSON.stringify({ username, email, password });

    const response = await this.http({ method: "POST", url, headers, body });

    if (!this.isSuccess(response)) {
      throw new Error(
        `Registration failed: ${response.status} - ${response.body}`,
      );
    }

    const auth: AuthResponse = JSON.parse(response.body);
    this.storeTokens(auth);
    console.log("Registered user:", auth.userId);
    return auth;
  }

  /**
   * Login with email and password.
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    const url = `${this.config.serverUrl}/api/v1/auth/login`;
    const headers = this.buildHeaders();
    const body = JSON.stringify({ email, password });

    const response = await this.http({ method: "POST", url, headers, body });

    if (!this.isSuccess(response)) {
      throw new Error(`Login failed: ${response.status} - ${response.body}`);
    }

    const auth: AuthResponse = JSON.parse(response.body);
    this.storeTokens(auth);
    console.log("Logged in user:", auth.userId);
    return auth;
  }

  /**
   * Refresh the access token.
   */
  async refreshTokens(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error("Not authenticated - please login first");
    }

    const url = `${this.config.serverUrl}/api/v1/auth/refresh`;
    const headers = this.buildHeaders();
    const body = JSON.stringify({ refreshToken: this.refreshToken });

    const response = await this.http({ method: "POST", url, headers, body });

    if (!this.isSuccess(response)) {
      throw new Error(
        `Token refresh failed: ${response.status} - ${response.body}`,
      );
    }

    const refresh: RefreshResponse = JSON.parse(response.body);
    this.accessToken = refresh.accessToken;
    this.refreshToken = refresh.refreshToken;
    console.log("Token refreshed successfully");
  }

  /**
   * Logout and clear tokens.
   */
  logout(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.userId = null;
    console.log("Logged out");
  }

  /**
   * Check if the client is authenticated.
   */
  isAuthenticated(): boolean {
    return this.accessToken !== null;
  }

  /**
   * Set tokens directly (for restoring from storage).
   */
  setTokens(accessToken: string, refreshToken: string, userId?: string): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.userId = userId ?? null;
  }

  /**
   * Get current tokens (for persisting to storage).
   */
  getTokens(): { accessToken: string | null; refreshToken: string | null } {
    return { accessToken: this.accessToken, refreshToken: this.refreshToken };
  }

  /**
   * Get current user ID.
   */
  getUserId(): string | null {
    return this.userId;
  }

  // =========================================================================
  // Sync Operations
  // =========================================================================

  /**
   * Push local changes to the server.
   */
  async push(records: SyncRecord[]): Promise<PushResponse> {
    const request: PushRequest = {
      records: records.map(this.syncToPushRecord),
      clientTimestamp: new Date().toISOString(),
    };

    const url = `${this.config.serverUrl}/api/v1/sync/${this.config.appId}/push`;
    return this.authenticatedPost<PushRequest, PushResponse>(url, request);
  }

  /**
   * Pull changes from the server.
   */
  async pull(
    checkpoint?: Checkpoint,
    batchSize?: number,
  ): Promise<PullResponse> {
    const request: PullRequest = {
      checkpoint,
      batchSize: batchSize ?? this.config.defaultBatchSize,
    };

    const url = `${this.config.serverUrl}/api/v1/sync/${this.config.appId}/pull`;
    return this.authenticatedPost<PullRequest, PullResponse>(url, request);
  }

  /**
   * Perform a delta sync (push + pull in one request).
   */
  async delta(
    records: SyncRecord[],
    checkpoint?: Checkpoint,
  ): Promise<DeltaResponse> {
    const request: DeltaRequest = {
      push:
        records.length > 0
          ? {
              records: records.map(this.syncToPushRecord),
              clientTimestamp: new Date().toISOString(),
            }
          : undefined,
      pull: {
        checkpoint,
        batchSize: this.config.defaultBatchSize,
      },
    };

    const url = `${this.config.serverUrl}/api/v1/sync/${this.config.appId}/delta`;
    return this.authenticatedPost<DeltaRequest, DeltaResponse>(url, request);
  }

  // =========================================================================
  // Internal Helpers
  // =========================================================================

  private buildHeaders(accessToken?: string): AuthHeaders {
    const headers: AuthHeaders = {
      apiKey: this.config.apiKey,
      appId: this.config.appId,
      contentType: "application/json",
    };

    if (accessToken) {
      headers.authorization = `Bearer ${accessToken}`;
    }

    return headers;
  }

  private storeTokens(auth: AuthResponse): void {
    this.accessToken = auth.accessToken;
    this.refreshToken = auth.refreshToken;
    this.userId = auth.userId;
  }

  private isSuccess(response: HttpResponse): boolean {
    return response.status >= 200 && response.status < 300;
  }

  private isUnauthorized(response: HttpResponse): boolean {
    return response.status === 401;
  }

  private async authenticatedPost<T, R>(url: string, body: T): Promise<R> {
    if (!this.accessToken) {
      throw new Error("Not authenticated - please login first");
    }

    // First attempt
    const headers = this.buildHeaders(this.accessToken);
    const bodyJson = JSON.stringify(body);

    let response = await this.http({
      method: "POST",
      url,
      headers,
      body: bodyJson,
    });

    // If unauthorized, try to refresh and retry
    if (this.isUnauthorized(response)) {
      console.warn("Access token expired, attempting refresh");
      await this.refreshTokens();

      const newHeaders = this.buildHeaders(this.accessToken!);
      response = await this.http({
        method: "POST",
        url,
        headers: newHeaders,
        body: bodyJson,
      });

      if (!this.isSuccess(response)) {
        console.error(
          "Request failed after token refresh:",
          response.status,
          response.body,
        );
        throw new Error(
          `Request failed: ${response.status} - ${response.body}`,
        );
      }

      return JSON.parse(response.body);
    }

    if (!this.isSuccess(response)) {
      console.error("Request failed:", response.status, response.body);
      throw new Error(`Request failed: ${response.status} - ${response.body}`);
    }

    return JSON.parse(response.body);
  }

  private syncToPushRecord(record: SyncRecord): PushRecord {
    return {
      tableName: record.tableName,
      rowId: record.rowId,
      data: record.data,
      version: record.version,
      deleted: record.deleted,
    };
  }
}

/**
 * Create a default sync client config.
 */
export function createSyncClientConfig(
  serverUrl: string,
  appId: string,
  apiKey: string,
  options?: Partial<Pick<SyncClientConfig, "defaultBatchSize" | "timeoutMs">>,
): SyncClientConfig {
  return {
    serverUrl,
    appId,
    apiKey,
    defaultBatchSize: options?.defaultBatchSize ?? 100,
    timeoutMs: options?.timeoutMs ?? 30000,
  };
}
