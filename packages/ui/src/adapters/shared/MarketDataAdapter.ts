/**
 * Market Data Adapter
 *
 * HTTP/SSE adapter for real-time market data streaming.
 * Uses Server-Sent Events for streaming and REST for subscription management.
 *
 * Uses a shared MQTT pool with reference counting for efficient resource utilization.
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
  SyncConfig,
} from "@fin-catch/shared";
import { AUTH_STORAGE_KEYS } from "@fin-catch/shared";
import { IMarketDataService } from "@fin-catch/ui/adapters/factory/interfaces";

/**
 * Configuration for MarketDataAdapter
 */
export interface MarketDataConfig {
  baseUrl?: string;
  apiBasePath?: string;
}

/**
 * Batch subscribe response
 */
export interface BatchSubscribeResponse {
  subscribed: number;
  symbols: string[];
  cachedItems: number;
  newMqttSubscriptions: number;
}

/**
 * Batch index subscribe response
 */
export interface BatchIndexSubscribeResponse {
  subscribed: number;
  indexes: string[];
  cachedItems: number;
  newMqttSubscriptions: number;
}

/**
 * Pool statistics
 */
export interface PoolStats {
  status: string;
  totalSymbols: number;
  totalIndexes: number;
  totalConsumers: number;
  activeMqttSubscriptions: number;
  subscriptions: Array<{
    symbol: string;
    refCount: number;
    mqttSubscribed: boolean;
    hasCachedData: boolean;
    tickCount: number;
  }>;
  indexSubscriptions: Array<{
    indexCode: string;
    refCount: number;
    mqttSubscribed: boolean;
    hasCachedData: boolean;
  }>;
}

/**
 * Maximum number of ticks to store per symbol
 */
const MAX_TICK_HISTORY = 50;

/**
 * Get the base URL from Vite env or default
 */
function getDefaultBaseUrl(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const env = (import.meta as any).env;
    if (env?.VITE_QM_CENTER_SERVER_URL) {
      return env.VITE_QM_CENTER_SERVER_URL;
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
  private apiBasePath: string;
  private abortController: AbortController | null = null;
  private connectionStatus: MarketDataConnectionStatus = "disconnected";
  private snapshots: Map<string, StockInfo> = new Map();
  private orderBooks: Map<string, TopPrice> = new Map();
  private tickHistory: Map<string, Tick[]> = new Map();
  private marketIndexes: Map<string, MarketIndex> = new Map();
  private currentPlatform: TradingPlatformId | null = null;

  // Client-side subscription tracking with reference counting
  // Key: "platform:symbol", Value: reference count
  private activeSubscriptions: Map<string, number> = new Map();
  // Key: "platform:indexCode", Value: reference count
  private activeIndexSubscriptions: Map<string, number> = new Map();
  // Track pending subscribe calls to avoid duplicate in-flight requests
  private pendingSubscribes: Map<string, Promise<void>> = new Map();
  private pendingIndexSubscribes: Map<string, Promise<void>> = new Map();

  // OHLC data cache: key is "symbol:resolution"
  private ohlcCache: Map<string, OHLC> = new Map();
  // Key: "platform:symbol:resolution", Value: reference count
  private activeOhlcSubscriptions: Map<string, number> = new Map();
  // Track pending OHLC subscribe calls
  private pendingOhlcSubscribes: Map<string, Promise<void>> = new Map();

  constructor(config?: MarketDataConfig) {
    this.baseUrl =
      config?.baseUrl ||
      this.getStoredValue(AUTH_STORAGE_KEYS.SERVER_URL) ||
      getDefaultBaseUrl();
    this.apiBasePath = config?.apiBasePath ?? "/api/v1";

    console.log(
      `[MarketDataAdapter] Initialized with baseUrl: ${this.baseUrl}`,
    );
  }

  private getStoredValue(key: string): string | null {
    if (typeof localStorage === "undefined") return null;
    return localStorage.getItem(key);
  }

  private setStoredValue(key: string, value: string): void {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(key, value);
  }

  /**
   * Configure market data service settings (server URL)
   */
  async configureSync(config: SyncConfig): Promise<void> {
    if (config.serverUrl) {
      this.baseUrl = config.serverUrl;
      this.setStoredValue(AUTH_STORAGE_KEYS.SERVER_URL, config.serverUrl);
    }
    console.log(`[MarketDataAdapter] Configured: ${this.baseUrl}`);
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

    const streamPath = `${this.apiBasePath}/trading/${platform}/market-data/stream`;
    const url = `${this.baseUrl}${streamPath}`;

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
   *
   * Note: DNSE sends data via separate MQTT topics:
   * - stockinfo: reference/ceiling/floor prices (STOCK_INFO)
   * - tick: real-time trades (TICK) - merged into snapshot for lastPrice
   * - topprice: order book bids/asks (TOP_PRICE)
   */
  private updateCache(msg: MarketDataMessage): void {
    switch (msg.type) {
      case "STOCK_INFO": {
        const stockInfo = msg.data as StockInfo;
        const symbol = stockInfo.symbol.toUpperCase();
        // Merge with existing snapshot to preserve tick-derived data
        const existing = this.snapshots.get(symbol);
        if (existing) {
          // Keep lastPrice, change, changePercent, volume from ticks if stockInfo doesn't have them
          this.snapshots.set(symbol, {
            ...existing,
            ...stockInfo,
            // Preserve tick-derived fields if stockInfo has nulls
            lastPrice: stockInfo.lastPrice ?? existing.lastPrice,
            change: stockInfo.change ?? existing.change,
            changePercent: stockInfo.changePercent ?? existing.changePercent,
            volume: stockInfo.volume ?? existing.volume,
          });
        } else {
          this.snapshots.set(symbol, stockInfo);
        }
        break;
      }
      case "TOP_PRICE": {
        const topPrice = msg.data as TopPrice;
        const symbol = topPrice.symbol.toUpperCase();
        this.orderBooks.set(symbol, topPrice);

        // Update snapshot with best bid/ask from order book
        const existing = this.snapshots.get(symbol);
        if (existing && topPrice.bids && topPrice.asks) {
          const bestBid = topPrice.bids[0];
          const bestAsk = topPrice.asks[0];
          if (bestBid || bestAsk) {
            this.snapshots.set(symbol, {
              ...existing,
              bidPrice: bestBid?.price ?? existing.bidPrice,
              bidVolume: bestBid?.volume ?? existing.bidVolume,
              askPrice: bestAsk?.price ?? existing.askPrice,
              askVolume: bestAsk?.volume ?? existing.askVolume,
            });
          }
        }
        break;
      }
      case "TICK": {
        const tick = msg.data as Tick;
        const symbol = tick.symbol.toUpperCase();
        const ticks = this.tickHistory.get(symbol) || [];
        ticks.unshift(tick); // Add to front (newest first)
        if (ticks.length > MAX_TICK_HISTORY) {
          ticks.pop(); // Remove oldest
        }
        this.tickHistory.set(symbol, ticks);

        // Update snapshot with tick data - this is the real-time price!
        const existing = this.snapshots.get(symbol);
        const refPrice = existing?.refPrice;
        const lastPrice = tick.price;
        // Calculate change from reference price if available
        const change =
          lastPrice !== undefined && refPrice !== undefined
            ? lastPrice - refPrice
            : undefined;
        const changePercent =
          change !== undefined && refPrice !== undefined && refPrice !== 0
            ? (change / refPrice) * 100
            : undefined;
        // Parse volume from totalVolumeTraded string
        const volume = tick.totalVolumeTraded
          ? parseInt(tick.totalVolumeTraded, 10)
          : existing?.volume;

        if (existing) {
          this.snapshots.set(symbol, {
            ...existing,
            lastPrice: lastPrice ?? existing.lastPrice,
            change: change ?? existing.change,
            changePercent: changePercent ?? existing.changePercent,
            volume: volume ?? existing.volume,
          });
        } else {
          // Create a new snapshot from tick if we don't have stockinfo yet
          this.snapshots.set(symbol, {
            symbol,
            lastPrice,
            change,
            changePercent,
            volume,
          } as StockInfo);
        }
        break;
      }
      case "MARKET_INDEX": {
        const marketIndex = msg.data as MarketIndex;
        this.marketIndexes.set(
          marketIndex.indexCode.toUpperCase(),
          marketIndex,
        );
        break;
      }
      case "OHLC": {
        const ohlc = msg.data as OHLC;
        const symbol = ohlc.symbol.toUpperCase();
        // Normalize "STOCK" interval to "1" for consistency with UI resolution selector
        const normalizedInterval =
          ohlc.interval === "STOCK" ? "1" : ohlc.interval;
        const key = `${symbol}:${normalizedInterval}`;
        this.ohlcCache.set(key, ohlc);
        break;
      }
      // BOARD_EVENT don't need caching for now
    }
  }

  /**
   * Subscribe to a symbol's market data
   * Uses client-side reference counting to avoid duplicate API calls
   */
  async subscribe(platform: TradingPlatformId, symbol: string): Promise<void> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Not authenticated. Please login first.");
    }

    const upperSymbol = symbol.toUpperCase();
    const subscriptionKey = `${platform}:${upperSymbol}`;

    // Check if already subscribed - just increment ref count
    const currentRefCount = this.activeSubscriptions.get(subscriptionKey) || 0;
    if (currentRefCount > 0) {
      this.activeSubscriptions.set(subscriptionKey, currentRefCount + 1);
      console.log(
        `[MarketDataAdapter] Already subscribed to ${upperSymbol}, ref count: ${currentRefCount + 1}`,
      );
      return;
    }

    // Check if there's a pending subscribe call for this symbol
    const pendingSubscribe = this.pendingSubscribes.get(subscriptionKey);
    if (pendingSubscribe) {
      console.log(
        `[MarketDataAdapter] Subscribe to ${upperSymbol} already in progress, waiting...`,
      );
      // Wait for the pending request, then increment ref count if successful
      await pendingSubscribe;
      // After pending completes, increment ref count (it was set to 1 by first caller)
      const newRefCount = this.activeSubscriptions.get(subscriptionKey) || 0;
      this.activeSubscriptions.set(subscriptionKey, newRefCount + 1);
      console.log(
        `[MarketDataAdapter] Pending subscribe completed for ${upperSymbol}, ref count: ${newRefCount + 1}`,
      );
      return;
    }

    const url = `${this.baseUrl}${this.apiBasePath}/trading/${platform}/market-data/subscribe`;

    console.log(`[MarketDataAdapter] Subscribing to ${upperSymbol}`);

    // Create the subscribe promise and track it
    const subscribePromise = (async () => {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ symbol: upperSymbol }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `API error: ${response.status}`;
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log(`[MarketDataAdapter] Subscribed to ${upperSymbol}:`, result);

      // Mark as subscribed with ref count 1
      this.activeSubscriptions.set(subscriptionKey, 1);
    })();

    this.pendingSubscribes.set(subscriptionKey, subscribePromise);

    try {
      await subscribePromise;
    } finally {
      // Clean up pending promise
      this.pendingSubscribes.delete(subscriptionKey);
    }
  }

  /**
   * Subscribe to multiple symbols at once
   * More efficient than individual subscribes for portfolios
   */
  async subscribeBatch(
    platform: TradingPlatformId,
    symbols: string[],
  ): Promise<BatchSubscribeResponse> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Not authenticated. Please login first.");
    }

    if (symbols.length === 0) {
      return {
        subscribed: 0,
        symbols: [],
        cachedItems: 0,
        newMqttSubscriptions: 0,
      };
    }

    const url = `${this.baseUrl}${this.apiBasePath}/trading/${platform}/market-data/subscribe-batch`;

    console.log(
      `[MarketDataAdapter] Batch subscribing to ${symbols.length} symbols`,
    );

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        symbols: symbols.map((s) => s.toUpperCase()),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `API error: ${response.status}`;
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log(`[MarketDataAdapter] Batch subscribed:`, result);
    return result;
  }

  /**
   * Unsubscribe from a symbol's market data
   * Uses client-side reference counting - only calls API when ref count reaches 0
   */
  async unsubscribe(
    platform: TradingPlatformId,
    symbol: string,
  ): Promise<void> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Not authenticated. Please login first.");
    }

    const upperSymbol = symbol.toUpperCase();
    const subscriptionKey = `${platform}:${upperSymbol}`;

    // Check reference count
    const currentRefCount = this.activeSubscriptions.get(subscriptionKey) || 0;
    if (currentRefCount > 1) {
      // Still other subscribers, just decrement
      this.activeSubscriptions.set(subscriptionKey, currentRefCount - 1);
      console.log(
        `[MarketDataAdapter] Decremented ref count for ${upperSymbol}, remaining: ${currentRefCount - 1}`,
      );
      return;
    }

    // Last subscriber, actually unsubscribe
    this.activeSubscriptions.delete(subscriptionKey);

    const url = `${this.baseUrl}${this.apiBasePath}/trading/${platform}/market-data/unsubscribe`;

    console.log(`[MarketDataAdapter] Unsubscribing from ${upperSymbol}`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ symbol: upperSymbol }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `API error: ${response.status}`;
      throw new Error(errorMessage);
    }

    // Remove from cache
    this.snapshots.delete(upperSymbol);
    this.orderBooks.delete(upperSymbol);

    const result = await response.json();
    console.log(
      `[MarketDataAdapter] Unsubscribed from ${upperSymbol}:`,
      result,
    );
  }

  /**
   * Unsubscribe from multiple symbols at once
   */
  async unsubscribeBatch(
    platform: TradingPlatformId,
    symbols: string[],
  ): Promise<void> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Not authenticated. Please login first.");
    }

    if (symbols.length === 0) {
      return;
    }

    const url = `${this.baseUrl}${this.apiBasePath}/trading/${platform}/market-data/unsubscribe-batch`;

    console.log(
      `[MarketDataAdapter] Batch unsubscribing from ${symbols.length} symbols`,
    );

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        symbols: symbols.map((s) => s.toUpperCase()),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `API error: ${response.status}`;
      throw new Error(errorMessage);
    }

    // Remove from cache
    for (const symbol of symbols) {
      const upperSymbol = symbol.toUpperCase();
      this.snapshots.delete(upperSymbol);
      this.orderBooks.delete(upperSymbol);
    }

    console.log(
      `[MarketDataAdapter] Batch unsubscribed from ${symbols.length} symbols`,
    );
  }

  /**
   * Subscribe to a market index
   * Uses client-side reference counting to avoid duplicate API calls
   */
  async subscribeIndex(
    platform: TradingPlatformId,
    indexCode: string,
  ): Promise<void> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Not authenticated. Please login first.");
    }

    const upperIndex = indexCode.toUpperCase();
    const subscriptionKey = `${platform}:${upperIndex}`;

    // Check if already subscribed - just increment ref count
    const currentRefCount =
      this.activeIndexSubscriptions.get(subscriptionKey) || 0;
    if (currentRefCount > 0) {
      this.activeIndexSubscriptions.set(subscriptionKey, currentRefCount + 1);
      console.log(
        `[MarketDataAdapter] Already subscribed to index ${upperIndex}, ref count: ${currentRefCount + 1}`,
      );
      return;
    }

    // Check if there's a pending subscribe call for this index
    const pendingSubscribe = this.pendingIndexSubscribes.get(subscriptionKey);
    if (pendingSubscribe) {
      console.log(
        `[MarketDataAdapter] Subscribe to index ${upperIndex} already in progress, waiting...`,
      );
      await pendingSubscribe;
      const newRefCount =
        this.activeIndexSubscriptions.get(subscriptionKey) || 0;
      this.activeIndexSubscriptions.set(subscriptionKey, newRefCount + 1);
      return;
    }

    const url = `${this.baseUrl}${this.apiBasePath}/trading/${platform}/market-data/subscribe-index`;

    console.log(`[MarketDataAdapter] Subscribing to index ${upperIndex}`);

    const subscribePromise = (async () => {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ index: upperIndex }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `API error: ${response.status}`;
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log(
        `[MarketDataAdapter] Subscribed to index ${upperIndex}:`,
        result,
      );

      this.activeIndexSubscriptions.set(subscriptionKey, 1);
    })();

    this.pendingIndexSubscribes.set(subscriptionKey, subscribePromise);

    try {
      await subscribePromise;
    } finally {
      this.pendingIndexSubscribes.delete(subscriptionKey);
    }
  }

  /**
   * Subscribe to multiple indexes at once
   */
  async subscribeIndexes(
    platform: TradingPlatformId,
    indexes: string[],
  ): Promise<BatchIndexSubscribeResponse> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Not authenticated. Please login first.");
    }

    if (indexes.length === 0) {
      return {
        subscribed: 0,
        indexes: [],
        cachedItems: 0,
        newMqttSubscriptions: 0,
      };
    }

    const url = `${this.baseUrl}${this.apiBasePath}/trading/${platform}/market-data/subscribe-indexes`;

    console.log(
      `[MarketDataAdapter] Batch subscribing to ${indexes.length} indexes`,
    );

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        indexes: indexes.map((i) => i.toUpperCase()),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `API error: ${response.status}`;
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log(`[MarketDataAdapter] Batch index subscribed:`, result);

    // Update local tracking
    for (const idx of indexes) {
      const subscriptionKey = `${platform}:${idx.toUpperCase()}`;
      const currentRefCount =
        this.activeIndexSubscriptions.get(subscriptionKey) || 0;
      this.activeIndexSubscriptions.set(subscriptionKey, currentRefCount + 1);
    }

    return result;
  }

  /**
   * Unsubscribe from a market index
   */
  async unsubscribeIndex(
    platform: TradingPlatformId,
    indexCode: string,
  ): Promise<void> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Not authenticated. Please login first.");
    }

    const upperIndex = indexCode.toUpperCase();
    const subscriptionKey = `${platform}:${upperIndex}`;

    // Check reference count
    const currentRefCount =
      this.activeIndexSubscriptions.get(subscriptionKey) || 0;
    if (currentRefCount > 1) {
      this.activeIndexSubscriptions.set(subscriptionKey, currentRefCount - 1);
      console.log(
        `[MarketDataAdapter] Decremented ref count for index ${upperIndex}, remaining: ${currentRefCount - 1}`,
      );
      return;
    }

    // Last subscriber, actually unsubscribe
    this.activeIndexSubscriptions.delete(subscriptionKey);

    const url = `${this.baseUrl}${this.apiBasePath}/trading/${platform}/market-data/unsubscribe-index`;

    console.log(`[MarketDataAdapter] Unsubscribing from index ${upperIndex}`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ index: upperIndex }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `API error: ${response.status}`;
      throw new Error(errorMessage);
    }

    // Remove from cache
    this.marketIndexes.delete(upperIndex);

    const result = await response.json();
    console.log(
      `[MarketDataAdapter] Unsubscribed from index ${upperIndex}:`,
      result,
    );
  }

  /**
   * Get cached tick history for a symbol
   * Returns ticks newest first
   */
  getTickHistory(symbol: string, limit?: number): Tick[] {
    const ticks = this.tickHistory.get(symbol.toUpperCase()) || [];
    if (limit && limit > 0) {
      return ticks.slice(0, limit);
    }
    return ticks;
  }

  /**
   * Get cached market index data
   */
  getMarketIndex(indexCode: string): MarketIndex | null {
    return this.marketIndexes.get(indexCode.toUpperCase()) || null;
  }

  /**
   * Get pool statistics
   */
  async getPoolStats(platform: TradingPlatformId): Promise<PoolStats | null> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Not authenticated. Please login first.");
    }

    const url = `${this.baseUrl}${this.apiBasePath}/trading/${platform}/market-data/stats`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `API error: ${response.status}`;
      throw new Error(errorMessage);
    }

    return response.json();
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
    // Clear subscription tracking
    this.activeSubscriptions.clear();
    this.pendingSubscribes.clear();
    this.activeIndexSubscriptions.clear();
    this.pendingIndexSubscribes.clear();
    this.activeOhlcSubscriptions.clear();
    this.pendingOhlcSubscribes.clear();
    // Keep cache for potential reconnection
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.snapshots.clear();
    this.orderBooks.clear();
    this.tickHistory.clear();
    this.marketIndexes.clear();
    this.ohlcCache.clear();
  }

  // ============================================================================
  // OHLC Subscription Methods
  // ============================================================================

  /**
   * Subscribe to stock OHLC data
   */
  async subscribeOhlc(
    platform: TradingPlatformId,
    symbol: string,
    resolution: OhlcResolution,
  ): Promise<void> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Not authenticated. Please login first.");
    }

    const upperSymbol = symbol.toUpperCase();
    const subscriptionKey = `${platform}:${upperSymbol}:${resolution}`;

    // Check if already subscribed - just increment ref count
    const currentRefCount =
      this.activeOhlcSubscriptions.get(subscriptionKey) || 0;
    if (currentRefCount > 0) {
      this.activeOhlcSubscriptions.set(subscriptionKey, currentRefCount + 1);
      console.log(
        `[MarketDataAdapter] Already subscribed to OHLC ${upperSymbol}:${resolution}, ref count: ${currentRefCount + 1}`,
      );
      return;
    }

    // Check if there's a pending subscribe call
    const pendingSubscribe = this.pendingOhlcSubscribes.get(subscriptionKey);
    if (pendingSubscribe) {
      console.log(
        `[MarketDataAdapter] Subscribe to OHLC ${upperSymbol}:${resolution} already in progress, waiting...`,
      );
      await pendingSubscribe;
      const newRefCount =
        this.activeOhlcSubscriptions.get(subscriptionKey) || 0;
      this.activeOhlcSubscriptions.set(subscriptionKey, newRefCount + 1);
      return;
    }

    const url = `${this.baseUrl}${this.apiBasePath}/trading/${platform}/market-data/subscribe-ohlc`;

    console.log(
      `[MarketDataAdapter] Subscribing to OHLC ${upperSymbol}:${resolution}`,
    );

    const subscribePromise = (async () => {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ symbol: upperSymbol, resolution }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `API error: ${response.status}`;
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log(
        `[MarketDataAdapter] Subscribed to OHLC ${upperSymbol}:${resolution}:`,
        result,
      );

      this.activeOhlcSubscriptions.set(subscriptionKey, 1);
    })();

    this.pendingOhlcSubscribes.set(subscriptionKey, subscribePromise);

    try {
      await subscribePromise;
    } finally {
      this.pendingOhlcSubscribes.delete(subscriptionKey);
    }
  }

  /**
   * Unsubscribe from stock OHLC data
   */
  async unsubscribeOhlc(
    platform: TradingPlatformId,
    symbol: string,
    resolution: OhlcResolution,
  ): Promise<void> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Not authenticated. Please login first.");
    }

    const upperSymbol = symbol.toUpperCase();
    const subscriptionKey = `${platform}:${upperSymbol}:${resolution}`;

    // Check reference count
    const currentRefCount =
      this.activeOhlcSubscriptions.get(subscriptionKey) || 0;
    if (currentRefCount > 1) {
      this.activeOhlcSubscriptions.set(subscriptionKey, currentRefCount - 1);
      console.log(
        `[MarketDataAdapter] Decremented ref count for OHLC ${upperSymbol}:${resolution}, remaining: ${currentRefCount - 1}`,
      );
      return;
    }

    // Last subscriber, actually unsubscribe
    this.activeOhlcSubscriptions.delete(subscriptionKey);

    const url = `${this.baseUrl}${this.apiBasePath}/trading/${platform}/market-data/unsubscribe-ohlc`;

    console.log(
      `[MarketDataAdapter] Unsubscribing from OHLC ${upperSymbol}:${resolution}`,
    );

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ symbol: upperSymbol, resolution }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `API error: ${response.status}`;
      throw new Error(errorMessage);
    }

    // Remove from cache
    this.ohlcCache.delete(`${upperSymbol}:${resolution}`);

    const result = await response.json();
    console.log(
      `[MarketDataAdapter] Unsubscribed from OHLC ${upperSymbol}:${resolution}:`,
      result,
    );
  }

  /**
   * Subscribe to index OHLC data
   */
  async subscribeIndexOhlc(
    platform: TradingPlatformId,
    indexCode: string,
    resolution: OhlcResolution,
  ): Promise<void> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Not authenticated. Please login first.");
    }

    const upperIndex = indexCode.toUpperCase();
    const subscriptionKey = `${platform}:${upperIndex}:${resolution}`;

    const currentRefCount =
      this.activeOhlcSubscriptions.get(subscriptionKey) || 0;
    if (currentRefCount > 0) {
      this.activeOhlcSubscriptions.set(subscriptionKey, currentRefCount + 1);
      console.log(
        `[MarketDataAdapter] Already subscribed to index OHLC ${upperIndex}:${resolution}, ref count: ${currentRefCount + 1}`,
      );
      return;
    }

    const pendingSubscribe = this.pendingOhlcSubscribes.get(subscriptionKey);
    if (pendingSubscribe) {
      await pendingSubscribe;
      const newRefCount =
        this.activeOhlcSubscriptions.get(subscriptionKey) || 0;
      this.activeOhlcSubscriptions.set(subscriptionKey, newRefCount + 1);
      return;
    }

    const url = `${this.baseUrl}${this.apiBasePath}/trading/${platform}/market-data/subscribe-index-ohlc`;

    console.log(
      `[MarketDataAdapter] Subscribing to index OHLC ${upperIndex}:${resolution}`,
    );

    const subscribePromise = (async () => {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ index: upperIndex, resolution }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `API error: ${response.status}`;
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log(
        `[MarketDataAdapter] Subscribed to index OHLC ${upperIndex}:${resolution}:`,
        result,
      );

      this.activeOhlcSubscriptions.set(subscriptionKey, 1);
    })();

    this.pendingOhlcSubscribes.set(subscriptionKey, subscribePromise);

    try {
      await subscribePromise;
    } finally {
      this.pendingOhlcSubscribes.delete(subscriptionKey);
    }
  }

  /**
   * Unsubscribe from index OHLC data
   */
  async unsubscribeIndexOhlc(
    platform: TradingPlatformId,
    indexCode: string,
    resolution: OhlcResolution,
  ): Promise<void> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Not authenticated. Please login first.");
    }

    const upperIndex = indexCode.toUpperCase();
    const subscriptionKey = `${platform}:${upperIndex}:${resolution}`;

    const currentRefCount =
      this.activeOhlcSubscriptions.get(subscriptionKey) || 0;
    if (currentRefCount > 1) {
      this.activeOhlcSubscriptions.set(subscriptionKey, currentRefCount - 1);
      console.log(
        `[MarketDataAdapter] Decremented ref count for index OHLC ${upperIndex}:${resolution}, remaining: ${currentRefCount - 1}`,
      );
      return;
    }

    this.activeOhlcSubscriptions.delete(subscriptionKey);

    const url = `${this.baseUrl}${this.apiBasePath}/trading/${platform}/market-data/unsubscribe-index-ohlc`;

    console.log(
      `[MarketDataAdapter] Unsubscribing from index OHLC ${upperIndex}:${resolution}`,
    );

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ index: upperIndex, resolution }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `API error: ${response.status}`;
      throw new Error(errorMessage);
    }

    this.ohlcCache.delete(`${upperIndex}:${resolution}`);

    const result = await response.json();
    console.log(
      `[MarketDataAdapter] Unsubscribed from index OHLC ${upperIndex}:${resolution}:`,
      result,
    );
  }

  /**
   * Subscribe to multiple symbols with optional OHLC
   */
  async subscribeBatchWithOhlc(
    platform: TradingPlatformId,
    options: BatchSubscribeOptions,
  ): Promise<BatchSubscribeWithOhlcResponse> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Not authenticated. Please login first.");
    }

    if (options.symbols.length === 0) {
      return {
        subscribed: 0,
        symbols: [],
        cachedItems: 0,
        newMqttSubscriptions: 0,
        ohlcSubscriptions: 0,
      };
    }

    const url = `${this.baseUrl}${this.apiBasePath}/trading/${platform}/market-data/subscribe-batch-with-ohlc`;

    console.log(
      `[MarketDataAdapter] Batch subscribing to ${options.symbols.length} symbols with OHLC: ${options.includeOhlc || false}`,
    );

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        symbols: options.symbols.map((s) => s.toUpperCase()),
        includeOhlc: options.includeOhlc || false,
        ohlcResolution: options.ohlcResolution || "1",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `API error: ${response.status}`;
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log(`[MarketDataAdapter] Batch subscribed with OHLC:`, result);

    // Update local tracking
    for (const symbol of options.symbols) {
      const subscriptionKey = `${platform}:${symbol.toUpperCase()}`;
      const currentRefCount =
        this.activeSubscriptions.get(subscriptionKey) || 0;
      this.activeSubscriptions.set(subscriptionKey, currentRefCount + 1);

      // Track OHLC subscriptions if enabled
      if (options.includeOhlc) {
        const ohlcKey = `${platform}:${symbol.toUpperCase()}:${options.ohlcResolution || "1"}`;
        const ohlcRefCount = this.activeOhlcSubscriptions.get(ohlcKey) || 0;
        this.activeOhlcSubscriptions.set(ohlcKey, ohlcRefCount + 1);
      }
    }

    return result;
  }

  /**
   * Subscribe to multiple indexes with optional OHLC
   */
  async subscribeIndexesWithOhlc(
    platform: TradingPlatformId,
    options: IndexSubscribeOptions,
  ): Promise<BatchSubscribeWithOhlcResponse> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Not authenticated. Please login first.");
    }

    if (options.indexes.length === 0) {
      return {
        subscribed: 0,
        symbols: [],
        cachedItems: 0,
        newMqttSubscriptions: 0,
        ohlcSubscriptions: 0,
      };
    }

    const url = `${this.baseUrl}${this.apiBasePath}/trading/${platform}/market-data/subscribe-indexes-with-ohlc`;

    console.log(
      `[MarketDataAdapter] Batch subscribing to ${options.indexes.length} indexes with OHLC: ${options.includeOhlc || false}`,
    );

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        indexes: options.indexes.map((i) => i.toUpperCase()),
        includeOhlc: options.includeOhlc || false,
        ohlcResolution: options.ohlcResolution || "1",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `API error: ${response.status}`;
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log(
      `[MarketDataAdapter] Batch index subscribed with OHLC:`,
      result,
    );

    // Update local tracking
    for (const idx of options.indexes) {
      const subscriptionKey = `${platform}:${idx.toUpperCase()}`;
      const currentRefCount =
        this.activeIndexSubscriptions.get(subscriptionKey) || 0;
      this.activeIndexSubscriptions.set(subscriptionKey, currentRefCount + 1);

      // Track OHLC subscriptions if enabled
      if (options.includeOhlc) {
        const ohlcKey = `${platform}:${idx.toUpperCase()}:${options.ohlcResolution || "1"}`;
        const ohlcRefCount = this.activeOhlcSubscriptions.get(ohlcKey) || 0;
        this.activeOhlcSubscriptions.set(ohlcKey, ohlcRefCount + 1);
      }
    }

    return result;
  }

  /**
   * Get cached OHLC data for a symbol
   */
  getOhlc(symbol: string, resolution: OhlcResolution): OHLC | null {
    const key = `${symbol.toUpperCase()}:${resolution}`;
    return this.ohlcCache.get(key) || null;
  }
}
