import {
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

/**
 * Trading platform authentication service interface
 *
 * Provides authentication operations for trading platforms.
 * Implemented by platform-specific adapters (e.g., HTTP adapter for web).
 *
 * Authentication flow:
 * 1. getSupportedPlatforms() - Get available platforms
 * 2. login(platform, username, password) - Login, returns session with status "pending_otp"
 * 3. requestOtp(platform) - Request OTP to be sent to email
 * 4. verifyOtp(platform, otp) - Verify OTP, returns session with status "connected"
 * 5. getStatus(platform) - Check current session status
 * 6. logout(platform) - Disconnect from platform
 *
 * Note: No sessionId needed - server identifies user from JWT token.
 * One session per platform per user.
 */
export interface ITradingAuthService {
  /**
   * Configure trading service settings (server URL)
   */
  configureSync(config: SyncConfig): Promise<void>;

  /**
   * Get list of supported trading platforms
   */
  getSupportedPlatforms(): Promise<TradingPlatform[]>;

  /**
   * Login to a trading platform
   *
   * @param platform - Platform identifier (e.g., "dnse")
   * @param username - Platform-specific username
   * @param password - Platform-specific password
   * @returns Session with status "pending_otp"
   */
  login(
    platform: TradingPlatformId,
    username: string,
    password: string,
  ): Promise<TradingSession>;

  /**
   * Request OTP to be sent to registered email
   *
   * @param platform - Platform identifier
   */
  requestOtp(platform: TradingPlatformId): Promise<void>;

  /**
   * Verify OTP and complete authentication
   *
   * @param platform - Platform identifier
   * @param otp - OTP code from email
   * @param otpType - OTP type (email or smart), defaults to email
   * @returns Session with status "connected"
   */
  verifyOtp(
    platform: TradingPlatformId,
    otp: string,
    otpType?: "email" | "smart",
  ): Promise<TradingSession>;

  /**
   * Get current session status for a platform
   *
   * @param platform - Platform identifier
   * @returns Current session or null if not connected
   */
  getStatus(platform: TradingPlatformId): Promise<TradingSession | null>;

  /**
   * Logout from a trading platform
   *
   * @param platform - Platform identifier
   */
  logout(platform: TradingPlatformId): Promise<void>;

  /**
   * Get account info for connected platform
   *
   * @param platform - Platform identifier
   * @returns Account info including investor ID, name, custody code
   */
  getAccountInfo(platform: TradingPlatformId): Promise<TradingAccountInfo>;

  /**
   * Get list of sub-accounts for connected platform
   *
   * @param platform - Platform identifier
   * @returns List of sub-accounts
   */
  getAccounts(platform: TradingPlatformId): Promise<TradingSubAccount[]>;

  /**
   * Get balance for a specific sub-account
   *
   * @param platform - Platform identifier
   * @param accountId - Sub-account ID
   * @returns Account balance details
   */
  getAccountBalance(
    platform: TradingPlatformId,
    accountId: string,
  ): Promise<TradingAccountBalance>;

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
  getLoanPackages(
    platform: TradingPlatformId,
    accountNo: string,
  ): Promise<LoanPackage[]>;

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
  getPPSE(
    platform: TradingPlatformId,
    accountNo: string,
    symbol: string,
    price: number,
    loanPackageId: number,
  ): Promise<PPSE>;

  /**
   * Place an order (4.3)
   *
   * @param platform - Platform identifier
   * @param order - Order request details
   * @returns Created order
   */
  placeOrder(
    platform: TradingPlatformId,
    order: PlaceOrderRequest,
  ): Promise<Order>;

  /**
   * Get list of orders (4.4)
   *
   * @param platform - Platform identifier
   * @param accountNo - Account number
   * @returns List of today's orders
   */
  getOrders(platform: TradingPlatformId, accountNo: string): Promise<Order[]>;

  /**
   * Cancel an order (4.5)
   *
   * @param platform - Platform identifier
   * @param accountNo - Account number
   * @param orderId - Order ID to cancel
   * @returns Cancelled order
   */
  cancelOrder(
    platform: TradingPlatformId,
    accountNo: string,
    orderId: number,
  ): Promise<Order>;

  /**
   * Get deals/holdings (4.6)
   *
   * @param platform - Platform identifier
   * @param accountNo - Account number
   * @returns List of current positions
   */
  getDeals(platform: TradingPlatformId, accountNo: string): Promise<Deal[]>;
}
