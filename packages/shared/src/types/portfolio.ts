import { CurrencyCode } from "./api";

// Portfolio types
export interface Portfolio {
  id: string; // UUID
  name: string;
  description?: string;
  baseCurrency?: CurrencyCode; // Portfolio's base currency for valuation
  createdAt: number; // Unix timestamp in seconds
  syncVersion: number;
  syncedAt?: number;
}

export interface PortfolioEntry {
  id: string; // UUID
  portfolioId: string; // UUID reference
  assetType: "stock" | "gold" | "bond";
  symbol: string;
  quantity: number;
  purchasePrice: number;
  currency?: CurrencyCode; // Currency of the purchase price
  purchaseDate: number; // Unix timestamp in seconds
  notes?: string;
  tags?: string; // JSON array as string
  transactionFees?: number;
  source?: string;
  createdAt: number;
  // Gold-specific fields
  unit?: "gram" | "mace" | "tael" | "ounce" | "kg"; // Unit of quantity for gold
  goldType?: string; // Type of gold (e.g., "1" for SJC HCMC, "2" for SJC Hanoi, "49" for SJC rings)
  // Bond-specific fields
  faceValue?: number; // Par/nominal value
  couponRate?: number; // Annual rate as percentage (e.g., 5.0)
  maturityDate?: number; // Unix timestamp
  couponFrequency?: "annual" | "semiannual" | "quarterly" | "monthly";
  currentMarketPrice?: number; // User-entered current price
  lastPriceUpdate?: number; // Unix timestamp of last price update
  ytm?: number; // Yield to Maturity as percentage (used in calculated mode)
  // Stock alert fields (synced to server, monitoring handled by qm-sync)
  targetPrice?: number; // Take-profit price
  stopLoss?: number; // Stop-loss price
  alertEnabled?: boolean; // Alerts active (default true when prices set)
  // Alert tracking fields (updated by server when alerts trigger)
  lastAlertAt?: number; // Unix timestamp of last triggered alert
  alertCount?: number; // Number of times alert has been triggered (max 3, then auto-disable)
  lastAlertType?: "target" | "stop_loss"; // Type of last triggered alert
  syncVersion: number;
  syncedAt?: number;
}

// Price alert event data (received from qm-sync server)
export interface PriceAlertEvent {
  entryId: string;
  symbol: string;
  alertType: "target" | "stop_loss";
  currentPrice: number;
  thresholdPrice: number;
  triggeredAt: number;
}

// Portfolio with entries
export interface PortfolioWithEntries extends Portfolio {
  entries: PortfolioEntry[];
}

// Portfolio performance metrics
export interface PortfolioPerformance {
  totalValue: number;
  totalCost: number;
  totalGainLoss: number;
  totalGainLossPercentage: number;
  currency: CurrencyCode; // Currency of the calculated values
  entriesPerformance: EntryPerformance[];
}

export interface EntryPerformance {
  entry: PortfolioEntry;
  currentPrice: number;
  purchasePrice?: number; // Scaled purchase price in display currency
  currentValue: number;
  totalCost: number;
  gainLoss: number;
  gainLossPercentage: number;
  priceSource: string;
  currency: CurrencyCode; // Currency of the calculated values
  exchangeRate?: number; // Exchange rate used if conversion was needed
}

// Historical portfolio value for charting
export interface PortfolioHistoricalValue {
  timestamp: number;
  totalValue: number;
  totalCost: number;
  gainLoss: number;
  gainLossPercentage: number;
}

// Bond coupon payment tracking
export interface BondCouponPayment {
  id: string; // UUID
  entryId: string; // UUID reference to PortfolioEntry.id
  paymentDate: number; // Unix timestamp
  amount: number; // Coupon amount received
  currency: CurrencyCode; // Payment currency
  notes?: string;
  createdAt: number;
  syncVersion: number;
  syncedAt?: number;
}

// Form data for creating/editing entries
export interface PortfolioEntryFormData {
  assetType: "stock" | "gold" | "bond";
  symbol: string;
  quantity: string;
  purchasePrice: string;
  currency?: CurrencyCode;
  purchaseDate: Date;
  notes?: string;
  tags?: string[];
  transactionFees?: string;
  source?: string;
}

// Asset allocation data for pie chart
export interface AssetAllocation {
  symbol: string;
  assetType: "stock" | "gold" | "bond";
  value: number;
  percentage: number;
  color: string;
}
