/**
 * Market Data Service Interface
 *
 * Provides real-time market data streaming via SSE connection.
 */

import type {
  StockInfo,
  TopPrice,
  MarketDataMessage,
  TradingPlatformId,
  MarketDataConnectionStatus,
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
}
