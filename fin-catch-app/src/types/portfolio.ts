import { CurrencyCode } from "./api";

// Portfolio types
export interface Portfolio {
  id?: number;
  name: string;
  description?: string;
  base_currency?: CurrencyCode; // Portfolio's base currency for valuation
  created_at: number; // Unix timestamp in seconds
}

export interface PortfolioEntry {
  id?: number;
  portfolio_id: number;
  asset_type: "stock" | "gold";
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

// Form data for creating/editing entries
export interface PortfolioEntryFormData {
  asset_type: "stock" | "gold";
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
  asset_type: "stock" | "gold";
  value: number;
  percentage: number;
  color: string;
}
