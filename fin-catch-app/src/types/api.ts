// Resolution types for stock data
export type Resolution = "1" | "5" | "15" | "30" | "60" | "1D" | "1W" | "1M";

// Stock data sources
export type StockSource = "vndirect" | "ssi" | "yahoo_finance";

// Gold data sources
export type GoldSource = "sjc" | "mihong";

// Data type enum
export type DataType = "stock" | "gold";

// Stock History Request
export interface StockHistoryRequest {
  symbol: string;
  resolution: Resolution;
  from: number; // Unix timestamp in seconds
  to: number; // Unix timestamp in seconds
  source?: StockSource;
}

// Stock Candle (OHLCV data point)
export interface StockCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Stock History Response
export interface StockHistoryResponse {
  symbol: string;
  resolution: Resolution;
  source: StockSource;
  status: "ok" | "error";
  data?: StockCandle[];
  error?: string;
  metadata?: Record<string, unknown>;
}

// Gold Price Request
export interface GoldPriceRequest {
  gold_price_id: string;
  from: number; // Unix timestamp in seconds
  to: number; // Unix timestamp in seconds
  source?: GoldSource;
}

// Gold Price Point
export interface GoldPricePoint {
  timestamp: number;
  type_name: string;
  branch_name?: string;
  buy: number;
  sell: number;
  buy_differ?: number;
  sell_differ?: number;
}

// Gold Price Response
export interface GoldPriceResponse {
  gold_price_id: string;
  source: GoldSource;
  status: "ok" | "error";
  data?: GoldPricePoint[];
  error?: string;
  metadata?: Record<string, unknown>;
}

// Unified Data Request (Tagged Union)
export type DataRequest =
  | ({ data_type: "stock" } & StockHistoryRequest)
  | ({ data_type: "gold" } & GoldPriceRequest);

// Unified Data Response (Tagged Union)
export type DataResponse =
  | ({ data_type: "stock" } & StockHistoryResponse)
  | ({ data_type: "gold" } & GoldPriceResponse);

// Source metadata
export interface SourceMetadata {
  name: string;
  type: "stock" | "gold";
  description?: string;
  metadata?: Record<string, unknown>;
}

// Health check response
export interface HealthCheckResponse {
  status: "healthy" | "unhealthy";
  sources?: Array<{
    name: string;
    status: boolean;
  }>;
}

// Resolution display labels
export const RESOLUTION_LABELS: Record<Resolution, string> = {
  "1": "1 Minute",
  "5": "5 Minutes",
  "15": "15 Minutes",
  "30": "30 Minutes",
  "60": "1 Hour",
  "1D": "1 Day",
  "1W": "1 Week",
  "1M": "1 Month",
};

// Stock source labels
export const STOCK_SOURCE_LABELS: Record<StockSource, string> = {
  vndirect: "VNDIRECT",
  ssi: "SSI",
  yahoo_finance: "Yahoo Finance",
};

// Gold source labels
export const GOLD_SOURCE_LABELS: Record<GoldSource, string> = {
  sjc: "SJC Gold",
  mihong: "MiHong",
};

// Gold price IDs for SJC source
export const SJC_GOLD_PRICE_IDS: Record<string, string> = {
  "1": "Ho Chi Minh Center",
  "2": "Ha Noi Center",
};

// Gold price IDs for MiHong source (purity codes)
export const MIHONG_GOLD_PRICE_IDS: Record<string, string> = {
  SJC: "SJC Branded Gold",
  "999": "24K Gold (99.9%)",
  "985": "23.64K Gold (98.5%)",
  "980": "23.52K Gold (98.0%)",
  "950": "22.8K Gold (95.0%)",
  "750": "18K Gold (75.0%)",
  "680": "16.32K Gold (68.0%)",
  "610": "14.64K Gold (61.0%)",
  "580": "13.92K Gold (58.0%)",
  "410": "9.84K Gold (41.0%)",
};
