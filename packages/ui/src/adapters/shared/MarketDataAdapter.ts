/**
 * Market Data Adapter
 *
 * HTTP/SSE adapter for real-time market data streaming.
 * Uses Server-Sent Events for streaming and REST for subscription management.
 */

import type {
  IMarketDataService,
  StockInfo,
  TopPrice,
  MarketDataMessage,
  TradingPlatformId,
  MarketDataConnectionStatus,
} from "@fin-catch/shared";
import { AUTH_STORAGE_KEYS } from "@fin-catch/shared/constants";

/**
 * Configuration for MarketDataAdapter
 */
export interface MarketDataConfig {
  baseUrl?: string;
}

/**
 * Get the base URL from Vite env or default
 */
function getDefaultBaseUrl(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const env = (import.meta as any).env;
    if (env?.VITE_QM_SYNC_SERVER_URL) {
      return env.VITE_QM_SYNC_SERVER_URL;
    }
  } catch {
    // Not in a Vite environment
  }
  return "http://localhost:3000";
}

/**
 * Market Data Adapter
 *
 * Implements IMarketDataService using SSE for streaming and REST for subscriptions.
 * Uses fetch with ReadableStream to support Authorization header (EventSource doesn't support headers).
 */
export class MarketDataAdapter implements IMarketDataService {
  private baseUrl: string;
  private abortController: AbortController | null = null;
  private connectionStatus: MarketDataConnectionStatus = "disconnected";
  private snapshots: Map<string, StockInfo> = new Map();
  private orderBooks: Map<string, TopPrice> = new Map();
  private currentPlatform: TradingPlatformId | null = null;

  constructor(config?: MarketDataConfig) {
    this.baseUrl =
      config?.baseUrl ||
      this.getStoredValue(AUTH_STORAGE_KEYS.SERVER_URL) ||
      getDefaultBaseUrl();

    console.log(
      `[MarketDataAdapter] Initialized with baseUrl: ${this.baseUrl}`,
    );
  }

  private getStoredValue(key: string): string | null {
    if (typeof localStorage === "undefined") return null;
    return localStorage.getItem(key);
  }

  /**
   * Get access token from storage
   */
  private getAccessToken(): string | null {
    return this.getStoredValue(AUTH_STORAGE_KEYS.ACCESS_TOKEN);
  }

  // Message handlers for multiple subscribers
  private messageHandlers: Set<(msg: MarketDataMessage) => void> = new Set();
  private errorHandlers: Set<(error: Error) => void> = new Set();
  private statusHandlers: Set<(status: MarketDataConnectionStatus) => void> =
    new Set();

  /**
   * Start SSE connection for market data streaming
   * Uses fetch with ReadableStream to support Authorization header
   * Reuses existing connection if already connected to same platform
   */
  connect(
    platform: TradingPlatformId,
    onMessage: (msg: MarketDataMessage) => void,
    onError?: (error: Error) => void,
    onStatusChange?: (status: MarketDataConnectionStatus) => void,
  ): () => void {
    // Add handlers
    this.messageHandlers.add(onMessage);
    if (onError) this.errorHandlers.add(onError);
    if (onStatusChange) this.statusHandlers.add(onStatusChange);

    // If already connected to the same platform, just add the handlers
    if (
      this.currentPlatform === platform &&
      this.connectionStatus === "connected"
    ) {
      console.log(
        `[MarketDataAdapter] Reusing existing connection to ${platform}`,
      );
      onStatusChange?.("connected");
      return () => {
        this.messageHandlers.delete(onMessage);
        if (onError) this.errorHandlers.delete(onError);
        if (onStatusChange) this.statusHandlers.delete(onStatusChange);
      };
    }

    // If connecting or connected to a different platform, close existing
    if (this.abortController && this.currentPlatform !== platform) {
      this.disconnect();
    }

    // If already connecting, just wait
    if (
      this.connectionStatus === "connecting" &&
      this.currentPlatform === platform
    ) {
      console.log(`[MarketDataAdapter] Already connecting to ${platform}`);
      return () => {
        this.messageHandlers.delete(onMessage);
        if (onError) this.errorHandlers.delete(onError);
        if (onStatusChange) this.statusHandlers.delete(onStatusChange);
      };
    }

    const token = this.getAccessToken();
    if (!token) {
      const error = new Error("Not authenticated. Please login first.");
      this.notifyError(error);
      return () => {
        this.messageHandlers.delete(onMessage);
        if (onError) this.errorHandlers.delete(onError);
        if (onStatusChange) this.statusHandlers.delete(onStatusChange);
      };
    }

    this.currentPlatform = platform;
    this.notifyStatusChange("connecting");

    const url = `${this.baseUrl}/api/v1/trading/${platform}/market-data/stream`;

    console.log(`[MarketDataAdapter] Connecting to SSE: ${url}`);

    // Create abort controller for cancellation
    this.abortController = new AbortController();

    // Use fetch with ReadableStream to support Authorization header
    this.startFetchSSE(url, token);

    // Return cleanup function
    return () => {
      this.messageHandlers.delete(onMessage);
      if (onError) this.errorHandlers.delete(onError);
      if (onStatusChange) this.statusHandlers.delete(onStatusChange);
    };
  }

  /**
   * Notify all message handlers
   */
  private notifyMessage(msg: MarketDataMessage): void {
    this.updateCache(msg);
    this.messageHandlers.forEach((handler) => handler(msg));
  }

  /**
   * Notify all error handlers
   */
  private notifyError(error: Error): void {
    this.errorHandlers.forEach((handler) => handler(error));
  }

  /**
   * Notify all status handlers
   */
  private notifyStatusChange(status: MarketDataConnectionStatus): void {
    this.connectionStatus = status;
    this.statusHandlers.forEach((handler) => handler(status));
  }

  /**
   * Start SSE connection using fetch with ReadableStream
   */
  private async startFetchSSE(url: string, token: string): Promise<void> {
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "text/event-stream",
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache",
        },
        signal: this.abortController?.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP ${response.status}`;
        throw new Error(errorMessage);
      }

      if (!response.body) {
        throw new Error("Response body is null");
      }

      console.log("[MarketDataAdapter] SSE connection opened");
      this.notifyStatusChange("connected");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          console.log("[MarketDataAdapter] SSE stream ended");
          this.notifyStatusChange("disconnected");
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events from buffer
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith("data:")) {
            const data = line.slice(5).trim();
            if (data) {
              try {
                const msg: MarketDataMessage = JSON.parse(data);
                this.notifyMessage(msg);
              } catch (err) {
                console.error(
                  "[MarketDataAdapter] Failed to parse message:",
                  err,
                  data,
                );
              }
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        console.log("[MarketDataAdapter] SSE connection aborted");
        this.notifyStatusChange("disconnected");
      } else {
        console.error("[MarketDataAdapter] SSE error:", err);
        this.notifyStatusChange("error");
        this.notifyError(err instanceof Error ? err : new Error(String(err)));
      }
    }
  }

  /**
   * Update local cache with incoming message
   */
  private updateCache(msg: MarketDataMessage): void {
    switch (msg.type) {
      case "STOCK_INFO": {
        const stockInfo = msg.data as StockInfo;
        this.snapshots.set(stockInfo.symbol.toUpperCase(), stockInfo);
        break;
      }
      case "TOP_PRICE": {
        const topPrice = msg.data as TopPrice;
        this.orderBooks.set(topPrice.symbol.toUpperCase(), topPrice);
        break;
      }
      // Other message types don't need caching for now
    }
  }

  /**
   * Subscribe to a symbol's market data
   */
  async subscribe(platform: TradingPlatformId, symbol: string): Promise<void> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Not authenticated. Please login first.");
    }

    const url = `${this.baseUrl}/api/v1/trading/${platform}/market-data/subscribe`;

    console.log(`[MarketDataAdapter] Subscribing to ${symbol}`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ symbol: symbol.toUpperCase() }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `API error: ${response.status}`;
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log(`[MarketDataAdapter] Subscribed to ${symbol}:`, result);
  }

  /**
   * Unsubscribe from a symbol's market data
   */
  async unsubscribe(
    platform: TradingPlatformId,
    symbol: string,
  ): Promise<void> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Not authenticated. Please login first.");
    }

    const url = `${this.baseUrl}/api/v1/trading/${platform}/market-data/unsubscribe`;

    console.log(`[MarketDataAdapter] Unsubscribing from ${symbol}`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ symbol: symbol.toUpperCase() }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `API error: ${response.status}`;
      throw new Error(errorMessage);
    }

    // Remove from cache
    const upperSymbol = symbol.toUpperCase();
    this.snapshots.delete(upperSymbol);
    this.orderBooks.delete(upperSymbol);

    const result = await response.json();
    console.log(`[MarketDataAdapter] Unsubscribed from ${symbol}:`, result);
  }

  /**
   * Get cached snapshot for a symbol
   */
  getSnapshot(symbol: string): StockInfo | null {
    return this.snapshots.get(symbol.toUpperCase()) || null;
  }

  /**
   * Get cached order book for a symbol
   */
  getOrderBook(symbol: string): TopPrice | null {
    return this.orderBooks.get(symbol.toUpperCase()) || null;
  }

  /**
   * Check if connected to market data stream
   */
  isConnected(): boolean {
    return this.connectionStatus === "connected";
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): MarketDataConnectionStatus {
    return this.connectionStatus;
  }

  /**
   * Disconnect from market data stream
   */
  disconnect(): void {
    if (this.abortController) {
      console.log("[MarketDataAdapter] Disconnecting SSE");
      this.abortController.abort();
      this.abortController = null;
    }
    this.connectionStatus = "disconnected";
    this.currentPlatform = null;
    // Clear all handlers
    this.messageHandlers.clear();
    this.errorHandlers.clear();
    this.statusHandlers.clear();
    // Keep cache for potential reconnection
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.snapshots.clear();
    this.orderBooks.clear();
  }
}
