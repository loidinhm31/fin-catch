/**
 * Market data types for real-time streaming
 *
 * Types for DNSE MQTT-over-WebSocket market data feed.
 * These types mirror the Rust types in qm-sync.
 */

/**
 * Stock price information from market data feed
 */
export interface StockInfo {
  /** Stock symbol */
  symbol: string;
  /** Last traded price */
  lastPrice?: number;
  /** Price change from reference */
  change?: number;
  /** Price change percentage */
  changePercent?: number;
  /** Trading volume */
  volume?: number;
  /** Best bid price */
  bidPrice?: number;
  /** Best ask price */
  askPrice?: number;
  /** Best bid volume */
  bidVolume?: number;
  /** Best ask volume */
  askVolume?: number;
  /** Day high price */
  high?: number;
  /** Day low price */
  low?: number;
  /** Opening price */
  open?: number;
  /** Ceiling price */
  ceiling?: number;
  /** Floor price */
  floor?: number;
  /** Reference price */
  refPrice?: number;
  /** Timestamp (milliseconds since epoch) */
  timestamp?: number;
}

/**
 * Order book level (price + volume)
 */
export interface OrderBookLevel {
  /** Price level */
  price: number;
  /** Volume at this price level */
  volume: number;
}

/**
 * Level 2 order book data (top N bids/asks)
 */
export interface TopPrice {
  /** Stock symbol */
  symbol: string;
  /** Top bid levels (best bid first) */
  bids: OrderBookLevel[];
  /** Top ask levels (best ask first) */
  asks: OrderBookLevel[];
  /** Timestamp (milliseconds since epoch) */
  timestamp?: number;
}

/**
 * Market index data
 */
export interface MarketIndex {
  /** Index code (VN30, VNINDEX, HNX30, etc.) */
  indexCode: string;
  /** Current index value */
  indexValue?: number;
  /** Change from previous close */
  change?: number;
  /** Change percentage */
  changePercent?: number;
  /** Total trading volume (as string from DNSE) */
  totalVolume?: string;
  /** Total trading value */
  totalValue?: number;
  /** Prior/reference index value */
  priorValue?: number;
  /** Highest index value of the day */
  highestValue?: number;
  /** Lowest index value of the day */
  lowestValue?: number;
  /** Timestamp (ISO string) */
  timestamp?: string;
  /** Market ID */
  marketId?: string;
  /** Up issue count */
  upCount?: number;
  /** Down issue count */
  downCount?: number;
  /** No change issue count */
  unchangedCount?: number;
  /** Ceiling issue count */
  ceilingCount?: number;
  /** Floor issue count */
  floorCount?: number;
}

/**
 * Board event (trading session status changes)
 */
export interface BoardEvent {
  /** Stock symbol */
  symbol: string;
  /** Board status (ATO, ATC, Continuous, Break) */
  boardStatus: string;
  /** Timestamp (milliseconds since epoch) */
  timestamp?: number;
}

/**
 * OHLC candlestick data
 */
export interface OHLC {
  /** Stock symbol */
  symbol: string;
  /** Interval (1m, 5m, 15m, 1h, 1d) */
  interval: string;
  /** Open price */
  open?: number;
  /** High price */
  high?: number;
  /** Low price */
  low?: number;
  /** Close price */
  close?: number;
  /** Volume */
  volume?: number;
  /** Timestamp (milliseconds since epoch) */
  timestamp?: number;
}

/**
 * Trade tick (individual trade execution)
 */
export interface Tick {
  /** Stock symbol */
  symbol: string;
  /** Trade price */
  price: number;
  /** Trade volume (for this tick) */
  volume: number;
  /** Trade side (BUY, SELL, NEUTRAL) */
  side: string;
  /** Timestamp (milliseconds since epoch or ISO string) */
  timestamp?: number | string;
  /** Total volume traded for the day (cumulative) */
  totalVolumeTraded?: string;
}

/**
 * Market data message type
 */
export type MarketDataMessageType =
  | "STOCK_INFO"
  | "TOP_PRICE"
  | "MARKET_INDEX"
  | "BOARD_EVENT"
  | "OHLC"
  | "TICK";

/**
 * Stock info message
 */
export interface StockInfoMessage {
  type: "STOCK_INFO";
  data: StockInfo;
}

/**
 * Top price (order book) message
 */
export interface TopPriceMessage {
  type: "TOP_PRICE";
  data: TopPrice;
}

/**
 * Market index message
 */
export interface MarketIndexMessage {
  type: "MARKET_INDEX";
  data: MarketIndex;
}

/**
 * Board event message
 */
export interface BoardEventMessage {
  type: "BOARD_EVENT";
  data: BoardEvent;
}

/**
 * OHLC candlestick message
 */
export interface OHLCMessage {
  type: "OHLC";
  data: OHLC;
}

/**
 * Tick message
 */
export interface TickMessage {
  type: "TICK";
  data: Tick;
}

/**
 * Union type for all market data messages
 */
export type MarketDataMessage =
  | StockInfoMessage
  | TopPriceMessage
  | MarketIndexMessage
  | BoardEventMessage
  | OHLCMessage
  | TickMessage;

/**
 * Market data subscription request
 */
export interface MarketDataSubscribeRequest {
  /** Stock symbol to subscribe */
  symbol: string;
}

/**
 * Market data connection status
 */
export type MarketDataConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

// ============================================================================
// OHLC Subscription Types
// ============================================================================

/**
 * OHLC resolution for candlestick data
 */
export type OhlcResolution = "1" | "1H" | "1D" | "W";

/**
 * OHLC subscription request
 */
export interface OhlcSubscribeRequest {
  /** Stock symbol to subscribe */
  symbol: string;
  /** Resolution (1, 1H, 1D, W) */
  resolution: OhlcResolution;
}

/**
 * Index OHLC subscription request
 */
export interface IndexOhlcSubscribeRequest {
  /** Index code to subscribe */
  index: string;
  /** Resolution (1, 1H, 1D, W) */
  resolution: OhlcResolution;
}

/**
 * Batch subscribe options with OHLC
 */
export interface BatchSubscribeOptions {
  /** Stock symbols to subscribe */
  symbols: string[];
  /** Include OHLC candlestick data */
  includeOhlc?: boolean;
  /** OHLC resolution (default: "1") */
  ohlcResolution?: OhlcResolution;
}

/**
 * Index subscribe options with OHLC
 */
export interface IndexSubscribeOptions {
  /** Index codes to subscribe */
  indexes: string[];
  /** Include OHLC candlestick data */
  includeOhlc?: boolean;
  /** OHLC resolution (default: "1") */
  ohlcResolution?: OhlcResolution;
}

/**
 * OHLC subscribe response
 */
export interface OhlcSubscribeResponse {
  /** Key (symbol:resolution) */
  key: string;
  /** Resolution */
  resolution: string;
  /** Whether cached data is available */
  hasCachedData: boolean;
}

/**
 * Batch subscribe response with OHLC info
 */
export interface BatchSubscribeWithOhlcResponse {
  /** Number of symbols subscribed */
  subscribed: number;
  /** Symbols that were subscribed */
  symbols: string[];
  /** Number of cached items returned */
  cachedItems: number;
  /** Number of new MQTT subscriptions */
  newMqttSubscriptions: number;
  /** Number of OHLC subscriptions */
  ohlcSubscriptions: number;
}
