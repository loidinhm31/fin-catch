// Resolution types for stock data
export type Resolution = "1" | "5" | "15" | "30" | "60" | "1D" | "1W" | "1M";

// Stock data sources
export type StockSource = "vndirect" | "ssi" | "yahoo_finance" | "dnse";

// Gold data sources
export type GoldSource = "sjc";

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
  dnse: "DNSE",
};

// Gold source labels
export const GOLD_SOURCE_LABELS: Record<GoldSource, string> = {
  sjc: "SJC Gold",
};

// Gold type item within a category
export interface GoldTypeItem {
  id: string;
  location: string;
  location_en: string;
}

// Gold type category with metadata
export interface GoldTypeCategory {
  category_name: string;
  category_name_en: string;
  items: GoldTypeItem[];
}

// Complete gold type categories for SJC source
export const SJC_GOLD_TYPE_CATEGORIES: GoldTypeCategory[] = [
  {
    category_name: "Vàng miếng SJC (1L, 10L, 1KG)",
    category_name_en: "Gold Bars (1L, 10L, 1KG)",
    items: [
      { id: "1", location: "Hồ Chí Minh", location_en: "Ho Chi Minh City" },
      { id: "2", location: "Miền Bắc", location_en: "Northern Region" },
      { id: "4", location: "Nha Trang", location_en: "Nha Trang" },
      { id: "5", location: "Đà Nẵng", location_en: "Da Nang" },
      { id: "7", location: "Cần Thơ", location_en: "Can Tho" },
      { id: "8", location: "Nghệ An", location_en: "Nghe An" },
      { id: "9", location: "Huế", location_en: "Hue" },
      { id: "10", location: "Bình Dương", location_en: "Binh Duong" },
      { id: "13", location: "Đắk Lắk", location_en: "Dak Lak" },
      { id: "16", location: "Phú Yên", location_en: "Phu Yen" },
    ],
  },
  {
    category_name: "Vàng nhẫn SJC 99,99 5 chỉ",
    category_name_en: "5 Chi Gold",
    items: [
      { id: "17", location: "Hồ Chí Minh", location_en: "Ho Chi Minh City" },
      { id: "18", location: "Miền Bắc", location_en: "Northern Region" },
      { id: "20", location: "Nha Trang", location_en: "Nha Trang" },
      { id: "21", location: "Đà Nẵng", location_en: "Da Nang" },
      { id: "23", location: "Cần Thơ", location_en: "Can Tho" },
      { id: "24", location: "Nghệ An", location_en: "Nghe An" },
      { id: "25", location: "Huế", location_en: "Hue" },
      { id: "26", location: "Bình Dương", location_en: "Binh Duong" },
      { id: "29", location: "Đắk Lắk", location_en: "Dak Lak" },
      { id: "32", location: "Phú Yên", location_en: "Phu Yen" },
    ],
  },
  {
    category_name: "Vàng nhẫn SJC 99,99 (0.5, 1, 2 chỉ)",
    category_name_en: "Small Gold (0.5-2 Chi)",
    items: [
      { id: "33", location: "Hồ Chí Minh", location_en: "Ho Chi Minh City" },
      { id: "34", location: "Miền Bắc", location_en: "Northern Region" },
      { id: "36", location: "Nha Trang", location_en: "Nha Trang" },
      { id: "37", location: "Đà Nẵng", location_en: "Da Nang" },
      { id: "39", location: "Cần Thơ", location_en: "Can Tho" },
      { id: "40", location: "Nghệ An", location_en: "Nghe An" },
      { id: "41", location: "Huế", location_en: "Hue" },
      { id: "42", location: "Bình Dương", location_en: "Binh Duong" },
      { id: "45", location: "Đắk Lắk", location_en: "Dak Lak" },
      { id: "48", location: "Phú Yên", location_en: "Phu Yen" },
    ],
  },
  {
    category_name: "Nhẫn tròn trơn 99,99%",
    category_name_en: "Gold Rings (99.99%)",
    items: [
      { id: "49", location: "Hồ Chí Minh", location_en: "Ho Chi Minh City" },
      { id: "50", location: "Miền Bắc", location_en: "Northern Region" },
      { id: "52", location: "Nha Trang", location_en: "Nha Trang" },
      { id: "53", location: "Đà Nẵng", location_en: "Da Nang" },
      { id: "55", location: "Cần Thơ", location_en: "Can Tho" },
      { id: "56", location: "Nghệ An", location_en: "Nghe An" },
      { id: "57", location: "Huế", location_en: "Hue" },
      { id: "58", location: "Bình Dương", location_en: "Binh Duong" },
    ],
  },
];

// Gold price IDs for SJC source (derived from categories for backward compatibility)
export const SJC_GOLD_PRICE_IDS: Record<string, string> =
  SJC_GOLD_TYPE_CATEGORIES.reduce(
    (acc, category) => {
      category.items.forEach((item) => {
        acc[item.id] = item.location_en;
      });
      return acc;
    },
    {} as Record<string, string>,
  );

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
export type CurrencyCode =
  | "USD"
  | "VND"
  | "EUR"
  | "GBP"
  | "JPY"
  | "CNY"
  | "KRW"
  | "THB"
  | "SGD";

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
