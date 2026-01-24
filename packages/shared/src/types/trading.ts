/**
 * Trading platform types
 *
 * Types for multi-platform trading integration.
 * Currently supports DNSE (Vietnamese securities).
 */

/**
 * Supported trading platform identifiers
 */
export type TradingPlatformId = "dnse";

/**
 * Trading session status
 */
export type TradingStatus =
  | "disconnected"
  | "pending_otp"
  | "connected"
  | "expired";

/**
 * Trading platform metadata
 */
export interface TradingPlatform {
  /** Platform identifier */
  id: TradingPlatformId;
  /** Human-readable name */
  name: string;
  /** Description */
  description: string;
  /** Whether the platform requires OTP verification */
  requires_otp: boolean;
}

/**
 * Trading session information
 */
export interface TradingSession {
  /** Trading platform ID */
  platform: TradingPlatformId;
  /** Current session status */
  status: TradingStatus;
  /** Unix timestamp when session expires (if connected) */
  expiresAt?: number;
}

/**
 * Login request payload
 */
export interface TradingLoginRequest {
  /** Trading platform username */
  username: string;
  /** Trading platform password */
  password: string;
}

/**
 * OTP verification request payload
 */
export interface TradingVerifyOtpRequest {
  /** OTP code from email */
  otp: string;
}

/**
 * List of supported platforms response
 */
export interface TradingPlatformsResponse {
  platforms: TradingPlatform[];
}

/**
 * Message response
 */
export interface TradingMessageResponse {
  message: string;
}

/**
 * Account information for a trading platform
 */
export interface TradingAccountInfo {
  investorId: string;
  name: string;
  custodyCode: string;
  mobile?: string;
  email?: string;
}

/**
 * Sub-account information
 */
export interface TradingSubAccount {
  id: string;
  custodyCode: string;
  investorId: string;
  accountTypeName: string;
  derivativeAccount: boolean;
}

/**
 * Account balance information
 */
export interface TradingAccountBalance {
  custodyCode: string;
  investorAccountId: string;
  totalCash: number;
  availableCash: number;
  totalDebt: number;
  withdrawableCash: number;
  depositFeeAmount: number;
  depositInterest: number;
  marginDebt: number;
  stockValue: number;
  netAssetValue: number;
  receivingAmount: number;
  secureAmount: number;
  cashDividendReceiving: number;
}
