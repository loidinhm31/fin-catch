import { CurrencyCode } from "@/types/api";

// Portfolio types
export interface Portfolio {
  id: string; // UUID
  name: string;
  description?: string;
  base_currency?: CurrencyCode; // Portfolio's base currency for valuation
  created_at: number; // Unix timestamp in seconds
  sync_version: number;
  synced_at?: number;
}

export interface PortfolioEntry {
  id: string; // UUID
  portfolio_id: string; // UUID reference
  asset_type: "stock" | "gold" | "bond";
  symbol: string;
  quantity: number;
  purchase_price: number;
  currency?: CurrencyCode; // Currency of the purchase price
  purchase_date: number; // Unix timestamp in seconds
  notes?: string;
  tags?: string; // JSON array as string
  transaction_fees?: number;
  source?: string;
  created_at: number;
  // Gold-specific fields
  unit?: "gram" | "mace" | "tael" | "ounce" | "kg"; // Unit of quantity for gold
  gold_type?: string; // Type of gold (e.g., "1" for SJC HCMC, "2" for SJC Hanoi, "49" for SJC rings)
  // Bond-specific fields
  face_value?: number; // Par/nominal value
  coupon_rate?: number; // Annual rate as percentage (e.g., 5.0)
  maturity_date?: number; // Unix timestamp
  coupon_frequency?: "annual" | "semiannual" | "quarterly" | "monthly";
  current_market_price?: number; // User-entered current price
  last_price_update?: number; // Unix timestamp of last price update
  ytm?: number; // Yield to Maturity as percentage (used in calculated mode)
  // Stock alert fields (synced to server, monitoring handled by qm-sync)
  target_price?: number; // Take-profit price
  stop_loss?: number; // Stop-loss price
  alert_enabled?: boolean; // Alerts active (default true when prices set)
  sync_version: number;
  synced_at?: number;
}

// Price alert event data (received from qm-sync server)
export interface PriceAlertEvent {
  entry_id: string;
  symbol: string;
  alert_type: "target" | "stop_loss";
  current_price: number;
  threshold_price: number;
  triggered_at: number;
}

// Portfolio with entries
export interface PortfolioWithEntries extends Portfolio {
  entries: PortfolioEntry[];
}

// Portfolio performance metrics
export interface PortfolioPerformance {
  total_value: number;
  total_cost: number;
  total_gain_loss: number;
  total_gain_loss_percentage: number;
  currency: CurrencyCode; // Currency of the calculated values
  entries_performance: EntryPerformance[];
}

export interface EntryPerformance {
  entry: PortfolioEntry;
  current_price: number;
  purchase_price?: number; // Scaled purchase price in display currency
  current_value: number;
  total_cost: number;
  gain_loss: number;
  gain_loss_percentage: number;
  price_source: string;
  currency: CurrencyCode; // Currency of the calculated values
  exchange_rate?: number; // Exchange rate used if conversion was needed
}

// Historical portfolio value for charting
export interface PortfolioHistoricalValue {
  timestamp: number;
  total_value: number;
  total_cost: number;
  gain_loss: number;
  gain_loss_percentage: number;
}

// Bond coupon payment tracking
export interface BondCouponPayment {
  id: string; // UUID
  entry_id: string; // UUID reference to PortfolioEntry.id
  payment_date: number; // Unix timestamp
  amount: number; // Coupon amount received
  currency: CurrencyCode; // Payment currency
  notes?: string;
  created_at: number;
  sync_version: number;
  synced_at?: number;
}

// Form data for creating/editing entries
export interface PortfolioEntryFormData {
  asset_type: "stock" | "gold" | "bond";
  symbol: string;
  quantity: string;
  purchase_price: string;
  currency?: CurrencyCode;
  purchase_date: Date;
  notes?: string;
  tags?: string[];
  transaction_fees?: string;
  source?: string;
}

// Asset allocation data for pie chart
export interface AssetAllocation {
  symbol: string;
  asset_type: "stock" | "gold" | "bond";
  value: number;
  percentage: number;
  color: string;
}
