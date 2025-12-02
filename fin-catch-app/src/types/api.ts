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

// Gold Premium Request
export interface GoldPremiumRequest {
  from: number; // Unix timestamp in seconds
  to: number; // Unix timestamp in seconds
  gold_price_id?: string;
  currency_code?: string;
  gold_source?: string;
  exchange_rate_source?: string;
  stock_source?: string;
}

// Gold Premium Point
export interface GoldPremiumPoint {
  timestamp: number;
  target_price: number;
  market_price_usd: number;
  exchange_rate: number;
  exchange_rate_timestamp: number;
  market_price_vnd: number;
  stock_price_timestamp: number;
  premium_rate: number;
  premium_value: number;
  gold_type: string;
}

// Gold Premium Response
export interface GoldPremiumResponse {
  status: "ok" | "error";
  data?: GoldPremiumPoint[];
  error?: string;
  metadata?: Record<string, unknown>;
}

// Currency codes
export type CurrencyCode = "USD" | "VND" | "EUR" | "GBP" | "JPY" | "CNY" | "KRW" | "THB" | "SGD";

// Exchange Rate Sources
export type ExchangeRateSource = "vietcombank" | "openexchangerates";

// Exchange Rate Request
// Note: Backend fetches rates for a currency TO VND (not arbitrary pairs)
export interface ExchangeRateRequest {
  currency_code: string; // Currency code to get rate for (e.g., "USD" gets USD->VND rate)
  from: number; // Unix timestamp in seconds
  to: number; // Unix timestamp in seconds
  source?: string; // Optional: "vietcombank" or other source
}

// Exchange Rate Point
export interface ExchangeRatePoint {
  timestamp: number;
  currency_code: string; // The foreign currency (e.g., "USD")
  currency_name: string; // Currency name (e.g., "US Dollar")
  buy_cash?: number; // Buy rate for cash
  buy_transfer?: number; // Buy rate for transfer
  sell: number; // Sell rate (this is what we'll use for conversions)
}

// Exchange Rate Response
export interface ExchangeRateResponse {
  currency_code: string; // The foreign currency
  source: string;
  status: "ok" | "error";
  data?: ExchangeRatePoint[];
  error?: string;
  metadata?: Record<string, unknown>;
}

// Currency labels
export const CURRENCY_LABELS: Record<CurrencyCode, string> = {
  USD: "US Dollar",
  VND: "Vietnamese Dong",
  EUR: "Euro",
  GBP: "British Pound",
  JPY: "Japanese Yen",
  CNY: "Chinese Yuan",
  KRW: "South Korean Won",
  THB: "Thai Baht",
  SGD: "Singapore Dollar",
};

// Currency symbols
export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USD: "$",
  VND: "₫",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CNY: "¥",
  KRW: "₩",
  THB: "฿",
  SGD: "S$",
};
