import type {
  TradingPlatform,
  TradingPlatformId,
  TradingSession,
  TradingAccountInfo,
  TradingSubAccount,
  TradingAccountBalance,
  LoanPackage,
  PPSE,
  Order,
  PlaceOrderRequest,
  Deal,
  SyncConfig,
} from "@fin-catch/shared";
import { AUTH_STORAGE_KEYS, env } from "@fin-catch/shared";
import { serviceLogger } from "@fin-catch/ui/utils";
import { ITradingAuthService } from "@fin-catch/ui/adapters/factory/interfaces";

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
  return env.serverUrl;
}

/**
 * HTTP adapter for trading platform authentication
 *
 * Calls qm-hub-server trading endpoints.
 * Requires qm-hub JWT authentication (Bearer token).
 */
export class TradingAuthAdapter implements ITradingAuthService {
  private baseUrl: string;

  constructor(config?: TradingAuthConfig) {
    this.baseUrl =
      config?.baseUrl ||
      this.getStoredValue(AUTH_STORAGE_KEYS.SERVER_URL) ||
      getDefaultBaseUrl();

    serviceLogger.trading(`Initialized with baseUrl: ${this.baseUrl}`);
  }

  private getStoredValue(key: string): string | null {
    if (typeof localStorage === "undefined") return null;
    return localStorage.getItem(key);
  }

  private setStoredValue(key: string, value: string): void {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(key, value);
  }

  /**
   * Configure trading service settings (server URL)
   */
  async configureSync(config: SyncConfig): Promise<void> {
    if (config.serverUrl) {
      this.baseUrl = config.serverUrl;
      this.setStoredValue(AUTH_STORAGE_KEYS.SERVER_URL, config.serverUrl);
    }
    serviceLogger.trading(`Trading service configured: ${this.baseUrl}`);
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
    serviceLogger.trading(`POST ${endpoint}`);

    const response = await fetch(url, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `API error: ${response.status}`;
      serviceLogger.tradingError(errorMessage);
      throw new Error(errorMessage);
    }

    const result = await response.json();
    serviceLogger.tradingDebug("Response received");
    return result as TRes;
  }

  /**
   * GET request helper
   */
  private async get<TRes>(endpoint: string, auth = true): Promise<TRes> {
    const url = `${this.baseUrl}${endpoint}`;
    serviceLogger.trading(`GET ${endpoint}`);

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
      serviceLogger.tradingError(errorMessage);
      throw new Error(errorMessage);
    }

    const result = await response.json();
    serviceLogger.tradingDebug("Response received");
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
      throw new Error("Not authenticated. Please login to qm-hub first.");
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
      throw new Error("Not authenticated. Please login to qm-hub first.");
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
    otpType: "email" | "smart" = "email",
  ): Promise<TradingSession> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Not authenticated. Please login to qm-hub first.");
    }

    return this.post<{ otp: string; otp_type: string }, TradingSession>(
      `/api/v1/trading/${platform}/verify-otp`,
      { otp, otp_type: otpType },
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
      serviceLogger.tradingError(`Error getting status for ${platform}`);
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
      throw new Error("Not authenticated. Please login to qm-hub first.");
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
      throw new Error("Not authenticated. Please login to qm-hub first.");
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
      throw new Error("Not authenticated. Please login to qm-hub first.");
    }

    return this.get<TradingAccountBalance>(
      `/api/v1/trading/${platform}/accounts/${accountId}/balance`,
    );
  }

  // =========================================================================
  // Trading Operations (sections 4.1-4.6)
  // =========================================================================

  /**
   * Get loan packages for an account (4.1)
   *
   * @param platform - Platform identifier
   * @param accountNo - Account number
   * @returns List of available loan packages
   */
  async getLoanPackages(
    platform: TradingPlatformId,
    accountNo: string,
  ): Promise<LoanPackage[]> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Not authenticated. Please login to qm-hub first.");
    }

    const response = await this.get<{ loanPackages: LoanPackage[] }>(
      `/api/v1/trading/${platform}/accounts/${accountNo}/loan-packages`,
    );
    return response.loanPackages;
  }

  /**
   * Get buying/selling power (4.2)
   *
   * @param platform - Platform identifier
   * @param accountNo - Account number
   * @param symbol - Stock symbol
   * @param price - Price for calculation
   * @param loanPackageId - Loan package ID
   * @returns PPSE (purchasing/selling power estimate)
   */
  async getPPSE(
    platform: TradingPlatformId,
    accountNo: string,
    symbol: string,
    price: number,
    loanPackageId: number,
  ): Promise<PPSE> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Not authenticated. Please login to qm-hub first.");
    }

    const params = new URLSearchParams({
      symbol,
      price: String(price),
      loanPackageId: String(loanPackageId),
    });

    return this.get<PPSE>(
      `/api/v1/trading/${platform}/accounts/${accountNo}/ppse?${params}`,
    );
  }

  /**
   * Place an order (4.3)
   *
   * @param platform - Platform identifier
   * @param order - Order request details
   * @returns Created order
   */
  async placeOrder(
    platform: TradingPlatformId,
    order: PlaceOrderRequest,
  ): Promise<Order> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Not authenticated. Please login to qm-hub first.");
    }

    return this.post<PlaceOrderRequest, Order>(
      `/api/v1/trading/${platform}/accounts/${order.accountNo}/orders`,
      order,
    );
  }

  /**
   * Get list of orders (4.4)
   *
   * @param platform - Platform identifier
   * @param accountNo - Account number
   * @returns List of today's orders
   */
  async getOrders(
    platform: TradingPlatformId,
    accountNo: string,
  ): Promise<Order[]> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Not authenticated. Please login to qm-hub first.");
    }

    const response = await this.get<{ orders: Order[] }>(
      `/api/v1/trading/${platform}/accounts/${accountNo}/orders`,
    );
    return response.orders;
  }

  /**
   * Cancel an order (4.5)
   *
   * @param platform - Platform identifier
   * @param accountNo - Account number
   * @param orderId - Order ID to cancel
   * @returns Cancelled order
   */
  async cancelOrder(
    platform: TradingPlatformId,
    accountNo: string,
    orderId: number,
  ): Promise<Order> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Not authenticated. Please login to qm-hub first.");
    }

    return this.delete<Order>(
      `/api/v1/trading/${platform}/accounts/${accountNo}/orders/${orderId}`,
    );
  }

  /**
   * Get deals/holdings (4.6)
   *
   * @param platform - Platform identifier
   * @param accountNo - Account number
   * @returns List of current positions
   */
  async getDeals(
    platform: TradingPlatformId,
    accountNo: string,
  ): Promise<Deal[]> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Not authenticated. Please login to qm-hub first.");
    }

    const response = await this.get<{ deals: Deal[] }>(
      `/api/v1/trading/${platform}/accounts/${accountNo}/deals`,
    );
    return response.deals;
  }

  /**
   * DELETE request helper
   */
  private async delete<TRes>(endpoint: string): Promise<TRes> {
    const url = `${this.baseUrl}${endpoint}`;
    serviceLogger.trading(`DELETE ${endpoint}`);

    const response = await fetch(url, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `API error: ${response.status}`;
      serviceLogger.tradingError(errorMessage);
      throw new Error(errorMessage);
    }

    const result = await response.json();
    serviceLogger.tradingDebug("Response received");
    return result as TRes;
  }
}
