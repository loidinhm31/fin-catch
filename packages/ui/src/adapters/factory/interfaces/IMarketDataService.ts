/**
 * Market Data Service Interface
 *
 * Provides real-time market data streaming via SSE connection.
 */

import type {
  StockInfo,
  TopPrice,
  Tick,
  MarketIndex,
  MarketDataMessage,
  TradingPlatformId,
  MarketDataConnectionStatus,
  OHLC,
  OhlcResolution,
  BatchSubscribeOptions,
  IndexSubscribeOptions,
  BatchSubscribeWithOhlcResponse,
} from "@fin-catch/shared/types";

/**
 * Market data service interface
 *
 * Manages SSE connections for real-time market data streaming.
 */
export interface IMarketDataService {
  /**
   * Start SSE connection for market data streaming
   *
   * @param platform - Trading platform ID
   * @param onMessage - Callback for incoming market data messages
   * @param onError - Optional callback for errors
   * @param onStatusChange - Optional callback for connection status changes
   * @returns Cleanup function to close connection
   */
  connect(
    platform: TradingPlatformId,
    onMessage: (msg: MarketDataMessage) => void,
    onError?: (error: Error) => void,
    onStatusChange?: (status: MarketDataConnectionStatus) => void,
  ): () => void;

  /**
   * Subscribe to a symbol's market data
   *
   * @param platform - Trading platform ID
   * @param symbol - Stock symbol to subscribe
   */
  subscribe(platform: TradingPlatformId, symbol: string): Promise<void>;

  /**
   * Unsubscribe from a symbol's market data
   *
   * @param platform - Trading platform ID
   * @param symbol - Stock symbol to unsubscribe
   */
  unsubscribe(platform: TradingPlatformId, symbol: string): Promise<void>;

  /**
   * Get cached snapshot for a symbol
   *
   * @param symbol - Stock symbol
   * @returns Cached stock info or null if not available
   */
  getSnapshot(symbol: string): StockInfo | null;

  /**
   * Get cached order book for a symbol
   *
   * @param symbol - Stock symbol
   * @returns Cached order book or null if not available
   */
  getOrderBook(symbol: string): TopPrice | null;

  /**
   * Subscribe to a market index
   *
   * @param platform - Trading platform ID
   * @param indexCode - Index code (e.g., VN30, VNINDEX)
   */
  subscribeIndex(platform: TradingPlatformId, indexCode: string): Promise<void>;

  /**
   * Subscribe to multiple market indexes
   *
   * @param platform - Trading platform ID
   * @param indexes - Array of index codes
   */
  subscribeIndexes(
    platform: TradingPlatformId,
    indexes: string[],
  ): Promise<{ subscribed: number; indexes: string[] }>;

  /**
   * Unsubscribe from a market index
   *
   * @param platform - Trading platform ID
   * @param indexCode - Index code
   */
  unsubscribeIndex(
    platform: TradingPlatformId,
    indexCode: string,
  ): Promise<void>;

  /**
   * Get cached tick history for a symbol
   *
   * @param symbol - Stock symbol
   * @param limit - Maximum number of ticks to return
   * @returns Array of ticks (newest first)
   */
  getTickHistory(symbol: string, limit?: number): Tick[];

  /**
   * Get cached market index data
   *
   * @param indexCode - Index code
   * @returns Cached market index or null if not available
   */
  getMarketIndex(indexCode: string): MarketIndex | null;

  /**
   * Check if connected to market data stream
   */
  isConnected(): boolean;

  /**
   * Get current connection status
   */
  getConnectionStatus(): MarketDataConnectionStatus;

  /**
   * Disconnect from market data stream
   */
  disconnect(): void;

  // ============================================================================
  // OHLC Subscription Methods
  // ============================================================================

  /**
   * Subscribe to stock OHLC data
   *
   * @param platform - Trading platform ID
   * @param symbol - Stock symbol
   * @param resolution - OHLC resolution (1, 1H, 1D, W)
   */
  subscribeOhlc(
    platform: TradingPlatformId,
    symbol: string,
    resolution: OhlcResolution,
  ): Promise<void>;

  /**
   * Unsubscribe from stock OHLC data
   *
   * @param platform - Trading platform ID
   * @param symbol - Stock symbol
   * @param resolution - OHLC resolution
   */
  unsubscribeOhlc(
    platform: TradingPlatformId,
    symbol: string,
    resolution: OhlcResolution,
  ): Promise<void>;

  /**
   * Subscribe to index OHLC data
   *
   * @param platform - Trading platform ID
   * @param indexCode - Index code
   * @param resolution - OHLC resolution
   */
  subscribeIndexOhlc(
    platform: TradingPlatformId,
    indexCode: string,
    resolution: OhlcResolution,
  ): Promise<void>;

  /**
   * Unsubscribe from index OHLC data
   *
   * @param platform - Trading platform ID
   * @param indexCode - Index code
   * @param resolution - OHLC resolution
   */
  unsubscribeIndexOhlc(
    platform: TradingPlatformId,
    indexCode: string,
    resolution: OhlcResolution,
  ): Promise<void>;

  /**
   * Subscribe to multiple symbols with optional OHLC
   *
   * @param platform - Trading platform ID
   * @param options - Batch subscribe options
   */
  subscribeBatchWithOhlc(
    platform: TradingPlatformId,
    options: BatchSubscribeOptions,
  ): Promise<BatchSubscribeWithOhlcResponse>;

  /**
   * Subscribe to multiple indexes with optional OHLC
   *
   * @param platform - Trading platform ID
   * @param options - Index subscribe options
   */
  subscribeIndexesWithOhlc(
    platform: TradingPlatformId,
    options: IndexSubscribeOptions,
  ): Promise<BatchSubscribeWithOhlcResponse>;

  /**
   * Get cached OHLC data for a symbol
   *
   * @param symbol - Stock symbol
   * @param resolution - OHLC resolution
   * @returns Cached OHLC data or null
   */
  getOhlc(symbol: string, resolution: OhlcResolution): OHLC | null;
}
