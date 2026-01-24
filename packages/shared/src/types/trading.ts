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

// ============================================================================
// Trading Types (sections 4.1-4.6)
// ============================================================================

/**
 * Order side - Buy or Sell
 */
export type OrderSide = "NB" | "NS";

/**
 * Order type
 */
export type OrderType = "LO" | "MP" | "MTL" | "ATO" | "ATC" | "MOK" | "MAK";

/**
 * Order status
 */
export type OrderStatus =
  | "pending"
  | "new"
  | "partiallyFilled"
  | "filled"
  | "rejected"
  | "expired"
  | "doneForDay"
  | "cancelled";

/**
 * Deal/Position status
 */
export type DealStatus = "OPEN" | "CLOSED" | "ODD_LOT";

/**
 * Loan package type
 */
export type LoanPackageType = "M" | "N";

/**
 * Loan product within a loan package
 */
export interface LoanProduct {
  /** Stock symbol */
  symbol: string;
  /** Initial rate */
  initialRate?: number;
  /** Maintenance rate */
  maintenanceRate?: number;
  /** Interest rate */
  interestRate?: number;
}

/**
 * Loan package information (4.1)
 */
export interface LoanPackage {
  /** Package ID */
  id: number;
  /** Package name */
  name: string;
  /** Package type (M = Margin, N = Normal) */
  type: LoanPackageType;
  /** Broker firm buying fee rate */
  brokerFirmBuyingFeeRate?: number;
  /** Broker firm selling fee rate */
  brokerFirmSellingFeeRate?: number;
  /** Loan products available in this package */
  loanProducts: LoanProduct[];
}

/**
 * Buying/Selling power response (4.2)
 */
export interface PPSE {
  /** Investor account ID */
  investorAccountId: string;
  /** Purchasing/Selling power estimate */
  ppse: number;
  /** Price used for calculation */
  price?: number;
  /** Maximum quantity */
  qmax: number;
  /** Trade quantity */
  tradeQuantity: number;
}

/**
 * Place order request (4.3)
 */
export interface PlaceOrderRequest {
  /** Stock symbol */
  symbol: string;
  /** Order side (NB = Buy, NS = Sell) */
  side: OrderSide;
  /** Order type */
  orderType: OrderType;
  /** Price (required for LO orders) */
  price?: number;
  /** Quantity */
  quantity: number;
  /** Loan package ID */
  loanPackageId: number;
  /** Account number */
  accountNo: string;
}

/**
 * Order information (4.3, 4.4, 4.5)
 */
export interface Order {
  /** Order ID */
  id: number;
  /** Stock symbol */
  symbol: string;
  /** Order side */
  side: OrderSide;
  /** Order type */
  orderType: OrderType;
  /** Price */
  price?: number;
  /** Average price (for filled orders) */
  avgPrice?: number;
  /** Quantity */
  quantity: number;
  /** Filled quantity */
  fillQuantity: number;
  /** Order status */
  orderStatus: OrderStatus;
  /** Reject reason (if rejected) */
  rejectReason?: string;
  /** Account number */
  accountNo?: string;
  /** Created time */
  createdTime?: string;
  /** Modified time */
  modifiedTime?: string;
}

/**
 * Deal/Holding information (4.6)
 */
export interface Deal {
  /** Deal ID */
  id: number;
  /** Stock symbol */
  symbol: string;
  /** Deal status */
  status: DealStatus;
  /** Side */
  side: OrderSide;
  /** Accumulated quantity */
  accumulateQuantity: number;
  /** Available quantity to sell */
  availableQuantity: number;
  /** Cost price (average purchase price) */
  costPrice: number;
  /** Current market price */
  marketPrice?: number;
  /** Unrealized profit/loss */
  unrealizedPnl?: number;
  /** Unrealized profit/loss percentage */
  unrealizedPnlPercent?: number;
  /** Account number */
  accountNo?: string;
}
