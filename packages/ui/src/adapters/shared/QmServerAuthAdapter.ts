import type {
  AuthResponse,
  AuthStatus,
  IAuthService,
  SyncConfig,
} from "@repo/shared";
import { AUTH_STORAGE_KEYS } from "@repo/shared/constants";

/**
 * Configuration for QmServerAuthAdapter
 */
export interface QmServerAuthConfig {
  baseUrl?: string;
  appId?: string;
  apiKey?: string;
}

/**
 * API response wrapper from qm-center-server
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Token storage keys - use centralized keys for SSO across qm-center ecosystem
 */
const STORAGE_KEYS = AUTH_STORAGE_KEYS;

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
 * Get app credentials from Vite env or default
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
  return "";
}

function getDefaultApiKey(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const env = (import.meta as any).env;
    if (env?.VITE_API_KEY) {
      return env.VITE_API_KEY;
    }
  } catch {
    // Not in a Vite environment
  }
  return "";
}

/**
 * Shared adapter for auth APIs
 * Calls qm-center-server directly - works in both Tauri webview and browser
 * Stores tokens in localStorage (for http) - note: less secure than Tauri's encrypted storage
 */
export class QmServerAuthAdapter implements IAuthService {
  private baseUrl: string;
  private appId: string;
  private apiKey: string;

  constructor(config?: QmServerAuthConfig) {
    // Try to load from storage first, then use config, then defaults
    this.baseUrl =
      config?.baseUrl ||
      this.getStoredValue(STORAGE_KEYS.SERVER_URL) ||
      getDefaultBaseUrl();
    this.appId =
      config?.appId ||
      this.getStoredValue(STORAGE_KEYS.APP_ID) ||
      getDefaultAppId();
    this.apiKey =
      config?.apiKey ||
      this.getStoredValue(STORAGE_KEYS.API_KEY) ||
      getDefaultApiKey();

    console.log(
      `[QmServerAuthAdapter] Initialized with baseUrl: ${this.baseUrl}`,
    );
  }

  private getStoredValue(key: string): string | null {
    if (typeof localStorage === "undefined") return null;
    return localStorage.getItem(key);
  }

  private setStoredValue(key: string, value: string): void {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(key, value);
  }

  private removeStoredValue(key: string): void {
    if (typeof localStorage === "undefined") return;
    localStorage.removeItem(key);
  }

  private async post<TReq, TRes>(
    endpoint: string,
    request: TReq,
    includeAuth = false,
  ): Promise<TRes> {
    const url = `${this.baseUrl}${endpoint}`;
    console.log(`[QmServerAuthAdapter] POST ${endpoint}`, request);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-App-Id": this.appId,
      "X-API-Key": this.apiKey,
    };

    if (includeAuth) {
      const token = await this.getAccessToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log(`[QmServerAuthAdapter] Response`, result);

    // Check if response is wrapped in ApiResponse
    if ("success" in result) {
      const apiResponse = result as ApiResponse<TRes>;
      if (!apiResponse.success) {
        throw new Error(apiResponse.error || "Unknown API error");
      }
      return apiResponse.data!;
    }

    // Direct response (auth endpoints return data directly)
    return result as TRes;
  }

  private async get<TRes>(
    endpoint: string,
    includeAuth = false,
  ): Promise<TRes> {
    const url = `${this.baseUrl}${endpoint}`;
    console.log(`[QmServerAuthAdapter] GET ${endpoint}`);

    const headers: Record<string, string> = {
      Accept: "application/json",
      "X-App-Id": this.appId,
      "X-API-Key": this.apiKey,
    };

    if (includeAuth) {
      const token = await this.getAccessToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log(`[QmServerAuthAdapter] Response`, result);

    // Check if response is wrapped in ApiResponse
    if ("success" in result) {
      const apiResponse = result as ApiResponse<TRes>;
      if (!apiResponse.success) {
        throw new Error(apiResponse.error || "Unknown API error");
      }
      return apiResponse.data!;
    }

    return result as TRes;
  }

  async configureSync(config: SyncConfig): Promise<void> {
    if (config.serverUrl) {
      this.baseUrl = config.serverUrl;
      this.setStoredValue(STORAGE_KEYS.SERVER_URL, config.serverUrl);
    }
    if (config.appId) {
      this.appId = config.appId;
      this.setStoredValue(STORAGE_KEYS.APP_ID, config.appId);
    }
    if (config.apiKey) {
      this.apiKey = config.apiKey;
      this.setStoredValue(STORAGE_KEYS.API_KEY, config.apiKey);
    }
    console.log("[QmServerAuthAdapter] Sync configured", {
      serverUrl: this.baseUrl,
      appId: this.appId,
    });
  }

  async register(
    username: string,
    email: string,
    password: string,
  ): Promise<AuthResponse> {
    try {
      const response = await this.post<
        { username: string; email: string; password: string },
        AuthResponse
      >("/api/v1/auth/register", { username, email, password });

      // Store auth data
      this.storeAuthData(response);

      return response;
    } catch (error) {
      console.error("[QmServerAuthAdapter] Register error:", error);
      throw error;
    }
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await this.post<
        { email: string; password: string },
        AuthResponse
      >("/api/v1/auth/login", { email, password });

      // Store auth data
      this.storeAuthData(response);

      return response;
    } catch (error) {
      console.error("[QmServerAuthAdapter] Login error:", error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    // Clear all stored auth data
    this.removeStoredValue(STORAGE_KEYS.ACCESS_TOKEN);
    this.removeStoredValue(STORAGE_KEYS.REFRESH_TOKEN);
    this.removeStoredValue(STORAGE_KEYS.USER_ID);
    this.removeStoredValue(STORAGE_KEYS.APPS);
    this.removeStoredValue(STORAGE_KEYS.IS_ADMIN);
    console.log("[QmServerAuthAdapter] Logged out");
  }

  async refreshToken(): Promise<void> {
    const refreshToken = this.getStoredValue(STORAGE_KEYS.REFRESH_TOKEN);
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    try {
      const response = await this.post<
        { refreshToken: string },
        { accessToken: string; refreshToken: string }
      >("/api/v1/auth/refresh", { refreshToken });

      // Update stored tokens
      this.setStoredValue(STORAGE_KEYS.ACCESS_TOKEN, response.accessToken);
      this.setStoredValue(STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken);
      console.log("[QmServerAuthAdapter] Token refreshed");
    } catch (error) {
      console.error("[QmServerAuthAdapter] Token refresh error:", error);
      // Clear tokens on refresh failure
      await this.logout();
      throw error;
    }
  }

  async getStatus(): Promise<AuthStatus> {
    const accessToken = this.getStoredValue(STORAGE_KEYS.ACCESS_TOKEN);
    if (!accessToken) {
      return {
        isAuthenticated: false,
        serverUrl: this.baseUrl,
      };
    }

    // Check if token is expired
    if (this.isTokenExpired(accessToken)) {
      try {
        await this.refreshToken();
      } catch {
        return {
          isAuthenticated: false,
          serverUrl: this.baseUrl,
        };
      }
    }

    // Try to get user info from server
    try {
      const userInfo = await this.get<{
        userId: string;
        username: string;
        email: string;
        apps: string[];
        isAdmin: boolean;
      }>("/api/v1/auth/me", true);

      return {
        isAuthenticated: true,
        userId: userInfo.userId,
        username: userInfo.username,
        email: userInfo.email,
        apps: userInfo.apps,
        isAdmin: userInfo.isAdmin,
        serverUrl: this.baseUrl,
      };
    } catch {
      // If server request fails, return cached data
      const userId = this.getStoredValue(STORAGE_KEYS.USER_ID);
      const appsStr = this.getStoredValue(STORAGE_KEYS.APPS);
      const isAdminStr = this.getStoredValue(STORAGE_KEYS.IS_ADMIN);

      return {
        isAuthenticated: !!userId,
        userId: userId || undefined,
        apps: appsStr ? JSON.parse(appsStr) : undefined,
        isAdmin: isAdminStr ? JSON.parse(isAdminStr) : undefined,
        serverUrl: this.baseUrl,
      };
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const status = await this.getStatus();
    return status.isAuthenticated;
  }

  async getAccessToken(): Promise<string | null> {
    const token = this.getStoredValue(STORAGE_KEYS.ACCESS_TOKEN);
    if (!token) return null;

    // Check if token is expired
    if (this.isTokenExpired(token)) {
      try {
        await this.refreshToken();
        return this.getStoredValue(STORAGE_KEYS.ACCESS_TOKEN);
      } catch {
        return null;
      }
    }

    return token;
  }

  private storeAuthData(response: AuthResponse): void {
    this.setStoredValue(STORAGE_KEYS.ACCESS_TOKEN, response.accessToken);
    this.setStoredValue(STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken);
    this.setStoredValue(STORAGE_KEYS.USER_ID, response.userId);
    if (response.apps) {
      this.setStoredValue(STORAGE_KEYS.APPS, JSON.stringify(response.apps));
    }
    if (response.isAdmin !== undefined) {
      this.setStoredValue(
        STORAGE_KEYS.IS_ADMIN,
        JSON.stringify(response.isAdmin),
      );
    }
  }

  private isTokenExpired(token: string): boolean {
    try {
      // JWT tokens are base64-encoded with 3 parts separated by dots
      const parts = token.split(".");
      if (parts.length !== 3) return true;

      // Decode the payload (second part)
      const payload = JSON.parse(atob(parts[1]));
      const exp = payload.exp;
      if (!exp) return false;

      // Check if expired (exp is in seconds)
      const now = Math.floor(Date.now() / 1000);
      return exp < now;
    } catch {
      // If we can't decode the token, assume it's expired
      return true;
    }
  }

  /**
   * Get all tokens for sync service integration.
   * This allows the sync adapter to get tokens from the auth service (single source of truth).
   */
  async getTokens(): Promise<{
    accessToken?: string;
    refreshToken?: string;
    userId?: string;
  }> {
    return {
      accessToken: this.getStoredValue(STORAGE_KEYS.ACCESS_TOKEN) ?? undefined,
      refreshToken:
        this.getStoredValue(STORAGE_KEYS.REFRESH_TOKEN) ?? undefined,
      userId: this.getStoredValue(STORAGE_KEYS.USER_ID) ?? undefined,
    };
  }

  /**
   * Save tokens from external source (e.g., when sync service refreshes tokens).
   * This keeps the auth service as the single source of truth for tokens.
   */
  async saveTokensExternal(
    accessToken: string,
    refreshToken: string,
    userId: string,
  ): Promise<void> {
    this.setStoredValue(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    this.setStoredValue(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    this.setStoredValue(STORAGE_KEYS.USER_ID, userId);
    console.log("[QmServerAuthAdapter] Tokens saved from external source");
  }
}
