import type {
  ITradingAuthService,
  TradingPlatform,
  TradingPlatformId,
  TradingSession,
  TradingAccountInfo,
  TradingSubAccount,
  TradingAccountBalance,
} from "@fin-catch/shared";
import { AUTH_STORAGE_KEYS } from "@fin-catch/shared/constants";

/**
 * Configuration for TradingAuthAdapter
 */
export interface TradingAuthConfig {
  baseUrl?: string;
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
 * HTTP adapter for trading platform authentication
 *
 * Calls qm-sync-server trading endpoints.
 * Requires qm-center JWT authentication (Bearer token).
 */
export class TradingAuthAdapter implements ITradingAuthService {
  private baseUrl: string;

  constructor(config?: TradingAuthConfig) {
    this.baseUrl =
      config?.baseUrl ||
      this.getStoredValue(AUTH_STORAGE_KEYS.SERVER_URL) ||
      getDefaultBaseUrl();

    console.log(
      `[TradingAuthAdapter] Initialized with baseUrl: ${this.baseUrl}`,
    );
  }

  private getStoredValue(key: string): string | null {
    if (typeof localStorage === "undefined") return null;
    return localStorage.getItem(key);
  }

  /**
   * Get access token from storage
   */
  private getAccessToken(): string | null {
    return this.getStoredValue(AUTH_STORAGE_KEYS.ACCESS_TOKEN);
  }

  /**
   * Make authenticated request headers
   */
  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    const token = this.getAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * POST request helper
   */
  private async post<TReq, TRes>(
    endpoint: string,
    request: TReq,
  ): Promise<TRes> {
    const url = `${this.baseUrl}${endpoint}`;
    console.log(`[TradingAuthAdapter] POST ${endpoint}`, request);

    const response = await fetch(url, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `API error: ${response.status}`;
      console.error(`[TradingAuthAdapter] Error:`, errorMessage);
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log(`[TradingAuthAdapter] Response`, result);
    return result as TRes;
  }

  /**
   * GET request helper
   */
  private async get<TRes>(endpoint: string, auth = true): Promise<TRes> {
    const url = `${this.baseUrl}${endpoint}`;
    console.log(`[TradingAuthAdapter] GET ${endpoint}`);

    const headers: Record<string, string> = {
      Accept: "application/json",
    };

    if (auth) {
      const token = this.getAccessToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `API error: ${response.status}`;
      console.error(`[TradingAuthAdapter] Error:`, errorMessage);
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log(`[TradingAuthAdapter] Response`, result);
    return result as TRes;
  }

  /**
   * Get list of supported trading platforms
   *
   * This endpoint is public - no authentication required.
   */
  async getSupportedPlatforms(): Promise<TradingPlatform[]> {
    const response = await this.get<{ platforms: TradingPlatform[] }>(
      "/api/v1/trading/platforms",
      false,
    );
    return response.platforms;
  }

  /**
   * Login to a trading platform
   *
   * @param platform - Platform identifier (e.g., "dnse")
   * @param username - Platform-specific username
   * @param password - Platform-specific password
   * @returns Session with status "pending_otp"
   */
  async login(
    platform: TradingPlatformId,
    username: string,
    password: string,
  ): Promise<TradingSession> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Not authenticated. Please login to qm-center first.");
    }

    return this.post<{ username: string; password: string }, TradingSession>(
      `/api/v1/trading/${platform}/login`,
      { username, password },
    );
  }

  /**
   * Request OTP to be sent to registered email
   *
   * @param platform - Platform identifier
   */
  async requestOtp(platform: TradingPlatformId): Promise<void> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Not authenticated. Please login to qm-center first.");
    }

    await this.post<Record<string, never>, { message: string }>(
      `/api/v1/trading/${platform}/request-otp`,
      {},
    );
  }

  /**
   * Verify OTP and complete authentication
   *
   * @param platform - Platform identifier
   * @param otp - OTP code from email
   * @returns Session with status "connected"
   */
  async verifyOtp(
    platform: TradingPlatformId,
    otp: string,
  ): Promise<TradingSession> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Not authenticated. Please login to qm-center first.");
    }

    return this.post<{ otp: string }, TradingSession>(
      `/api/v1/trading/${platform}/verify-otp`,
      { otp },
    );
  }

  /**
   * Get current session status for a platform
   *
   * @param platform - Platform identifier
   * @returns Current session or null if not connected
   */
  async getStatus(platform: TradingPlatformId): Promise<TradingSession | null> {
    const token = this.getAccessToken();
    if (!token) {
      return null;
    }

    try {
      const session = await this.get<TradingSession>(
        `/api/v1/trading/${platform}/status`,
      );

      // Return null if disconnected
      if (session.status === "disconnected") {
        return null;
      }

      return session;
    } catch (error) {
      console.error(
        `[TradingAuthAdapter] Error getting status for ${platform}:`,
        error,
      );
      return null;
    }
  }

  /**
   * Logout from a trading platform
   *
   * @param platform - Platform identifier
   */
  async logout(platform: TradingPlatformId): Promise<void> {
    const token = this.getAccessToken();
    if (!token) {
      return;
    }

    await this.post<Record<string, never>, TradingSession>(
      `/api/v1/trading/${platform}/logout`,
      {},
    );
  }

  /**
   * Get account info for connected platform
   *
   * @param platform - Platform identifier
   * @returns Account info including investor ID, name, custody code
   */
  async getAccountInfo(
    platform: TradingPlatformId,
  ): Promise<TradingAccountInfo> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Not authenticated. Please login to qm-center first.");
    }

    return this.get<TradingAccountInfo>(`/api/v1/trading/${platform}/account`);
  }

  /**
   * Get list of sub-accounts for connected platform
   *
   * @param platform - Platform identifier
   * @returns List of sub-accounts
   */
  async getAccounts(platform: TradingPlatformId): Promise<TradingSubAccount[]> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Not authenticated. Please login to qm-center first.");
    }

    const response = await this.get<{ accounts: TradingSubAccount[] }>(
      `/api/v1/trading/${platform}/accounts`,
    );
    return response.accounts;
  }

  /**
   * Get balance for a specific sub-account
   *
   * @param platform - Platform identifier
   * @param accountId - Sub-account ID
   * @returns Account balance details
   */
  async getAccountBalance(
    platform: TradingPlatformId,
    accountId: string,
  ): Promise<TradingAccountBalance> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Not authenticated. Please login to qm-center first.");
    }

    return this.get<TradingAccountBalance>(
      `/api/v1/trading/${platform}/accounts/${accountId}/balance`,
    );
  }
}
