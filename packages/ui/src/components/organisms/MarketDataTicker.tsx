import React, { useState, useEffect, useCallback } from "react";
import { TrendingUp, TrendingDown, Activity, Loader2 } from "lucide-react";
import type {
  StockInfo,
  MarketDataMessage,
  TradingPlatformId,
  MarketDataConnectionStatus,
} from "@fin-catch/shared";
import { usePlatformServices } from "@fin-catch/ui/platform";

/**
 * Props for MarketDataTicker component
 */
export interface MarketDataTickerProps {
  /** Stock symbol to display */
  symbol: string;
  /** Trading platform ID */
  platform: TradingPlatformId;
  /** Show detailed information (high, low, volume, etc.) */
  showDetails?: boolean;
  /** Callback when price updates */
  onPriceUpdate?: (price: number | undefined) => void;
}

/**
 * MarketDataTicker component
 *
 * Displays real-time stock price with change indicators.
 * Connects to market data stream and subscribes to the specified symbol.
 */
export const MarketDataTicker: React.FC<MarketDataTickerProps> = ({
  symbol,
  platform,
  showDetails = true,
  onPriceUpdate,
}) => {
  const { marketData } = usePlatformServices();
  const [stockInfo, setStockInfo] = useState<StockInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<MarketDataConnectionStatus>("disconnected");

  // Handle incoming market data messages
  const handleMessage = useCallback(
    (msg: MarketDataMessage) => {
      // Skip market index messages
      if (msg.type === "MARKET_INDEX") return;

      const data = msg.data as any;
      if (data.symbol?.toUpperCase() === symbol.toUpperCase()) {
        // Get the latest merged snapshot from the adapter's cache
        const snapshot = marketData?.getSnapshot(symbol);
        if (snapshot) {
          setStockInfo(snapshot);
          setLoading(false);
          if (snapshot.lastPrice !== undefined) {
            onPriceUpdate?.(snapshot.lastPrice);
          }
        }
      }
    },
    [symbol, marketData, onPriceUpdate],
  );

  // Handle connection errors
  const handleError = useCallback((err: Error) => {
    console.error("[MarketDataTicker] Error:", err);
    setError(err.message);
    setLoading(false);
  }, []);

  // Handle status changes
  const handleStatusChange = useCallback(
    (status: MarketDataConnectionStatus) => {
      setConnectionStatus(status);
      if (status === "connected") {
        setError(null);
      }
    },
    [],
  );

  // Use refs to store latest callbacks without triggering effect re-runs
  const handleMessageRef = React.useRef(handleMessage);
  const handleErrorRef = React.useRef(handleError);
  const handleStatusChangeRef = React.useRef(handleStatusChange);

  // Keep refs updated
  React.useEffect(() => {
    handleMessageRef.current = handleMessage;
    handleErrorRef.current = handleError;
    handleStatusChangeRef.current = handleStatusChange;
  });

  useEffect(() => {
    if (!marketData || !symbol) return;

    setLoading(true);
    setError(null);

    // Connect to market data stream using refs to avoid re-connection on callback changes
    const disconnect = marketData.connect(
      platform,
      (msg: MarketDataMessage) => handleMessageRef.current(msg),
      (err: Error) => handleErrorRef.current(err),
      (status: MarketDataConnectionStatus) =>
        handleStatusChangeRef.current(status),
    );

    // Subscribe to symbol after a short delay to ensure connection
    const subscribeTimeout = setTimeout(() => {
      marketData.subscribe(platform, symbol).catch((err: Error) => {
        console.error("[MarketDataTicker] Subscribe error:", err);
        setError(err.message);
        setLoading(false);
      });
    }, 500);

    return () => {
      clearTimeout(subscribeTimeout);
      marketData.unsubscribe(platform, symbol).catch(console.error);
      disconnect();
    };
    // Only re-connect when symbol, platform, or marketData changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, platform, marketData]);

  // Loading state
  if (loading) {
    return (
      <div
        className="p-4 rounded-2xl border backdrop-blur-xl"
        style={{
          background: "var(--glass-bg-ticker)",
          borderColor: "var(--color-sync-pending-border)",
        }}
      >
        <div className="flex items-center justify-center py-6">
          <Loader2
            className="w-6 h-6 animate-spin"
            style={{ color: "var(--color-market-live)" }}
          />
          <span
            className="ml-3 text-sm"
            style={{ color: "var(--color-text-gray-light)" }}
          >
            Loading {symbol}...
          </span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className="p-4 rounded-2xl border backdrop-blur-xl"
        style={{
          background: "var(--glass-bg-ticker)",
          borderColor: "var(--color-trade-sell-border)",
        }}
      >
        <div className="text-center py-4">
          <p className="text-sm" style={{ color: "var(--color-trade-sell)" }}>
            {error}
          </p>
        </div>
      </div>
    );
  }

  // No data yet
  if (!stockInfo) {
    return (
      <div
        className="p-4 rounded-2xl border backdrop-blur-xl"
        style={{
          background: "var(--glass-bg-ticker)",
          borderColor: "var(--color-sync-pending-border)",
        }}
      >
        <div className="text-center py-4">
          <p
            className="text-sm"
            style={{ color: "var(--color-text-gray-light)" }}
          >
            Waiting for data...
          </p>
        </div>
      </div>
    );
  }

  let change = stockInfo.change;
  let changePercent = stockInfo.changePercent;

  // Calculate change from refPrice if missing but prices are available
  if (
    (change === null || change === undefined) &&
    stockInfo.lastPrice !== undefined &&
    stockInfo.refPrice !== undefined
  ) {
    change = stockInfo.lastPrice - stockInfo.refPrice;
    if (stockInfo.refPrice !== 0) {
      changePercent = (change / stockInfo.refPrice) * 100;
    }
  }

  change = change || 0;
  changePercent = changePercent || 0;
  const isUp = change >= 0;
  const priceColor = isUp
    ? "var(--color-trade-buy)"
    : "var(--color-trade-sell)";
  const priceColorBg = isUp
    ? "var(--color-trade-buy-bg)"
    : "var(--color-trade-sell-bg)";
  const priceColorBorder = isUp
    ? "var(--color-trade-buy-border)"
    : "var(--color-trade-sell-border)";
  const TrendIcon = isUp ? TrendingUp : TrendingDown;

  return (
    <div
      className="p-4 rounded-2xl border backdrop-blur-xl"
      style={{
        background: "var(--glass-bg-ticker)",
        borderColor: priceColorBorder,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3
            className="text-xl font-bold"
            style={{ color: "var(--color-text-primary)" }}
          >
            {symbol}
          </h3>
          <span
            className="px-2 py-0.5 rounded text-xs font-medium"
            style={{
              background: priceColorBg,
              color: priceColor,
            }}
          >
            {isUp ? "+" : ""}
            {changePercent.toFixed(2)}%
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Activity
            className="w-3 h-3"
            style={{
              color:
                connectionStatus === "connected"
                  ? "var(--color-trade-buy)"
                  : "var(--color-trade-sell)",
            }}
          />
          <span
            className="text-xs"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            Live
          </span>
        </div>
      </div>

      {/* Price */}
      <div className="mb-3">
        <div
          className="text-3xl font-bold tracking-tight"
          style={{ color: priceColor }}
        >
          {stockInfo.lastPrice?.toLocaleString("vi-VN") ?? "-"}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <TrendIcon className="w-4 h-4" style={{ color: priceColor }} />
          <span className="text-sm font-medium" style={{ color: priceColor }}>
            {isUp ? "+" : ""}
            {change.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Best Bid/Ask */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
        <div>
          <div
            className="text-xs mb-1"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            Bid
          </div>
          <div className="flex items-baseline gap-1">
            <span
              className="text-sm font-medium"
              style={{ color: "var(--color-trade-buy)" }}
            >
              {stockInfo.bidPrice?.toLocaleString("vi-VN") ?? "-"}
            </span>
            {stockInfo.bidVolume && (
              <span
                className="text-xs"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                ({(stockInfo.bidVolume / 100).toFixed(0)})
              </span>
            )}
          </div>
        </div>
        <div>
          <div
            className="text-xs mb-1"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            Ask
          </div>
          <div className="flex items-baseline gap-1">
            <span
              className="text-sm font-medium"
              style={{ color: "var(--color-trade-sell)" }}
            >
              {stockInfo.askPrice?.toLocaleString("vi-VN") ?? "-"}
            </span>
            {stockInfo.askVolume && (
              <span
                className="text-xs"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                ({(stockInfo.askVolume / 100).toFixed(0)})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Details */}
      {showDetails && (
        <div className="grid grid-cols-3 gap-3 pt-3 mt-3 border-t border-white/10">
          <div>
            <div
              className="text-xs mb-1"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              High
            </div>
            <div
              className="text-sm font-medium"
              style={{ color: "var(--color-text-primary)" }}
            >
              {stockInfo.high?.toLocaleString("vi-VN") ?? "-"}
            </div>
          </div>
          <div>
            <div
              className="text-xs mb-1"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              Low
            </div>
            <div
              className="text-sm font-medium"
              style={{ color: "var(--color-text-primary)" }}
            >
              {stockInfo.low?.toLocaleString("vi-VN") ?? "-"}
            </div>
          </div>
          <div>
            <div
              className="text-xs mb-1"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              Volume
            </div>
            <div
              className="text-sm font-medium"
              style={{ color: "var(--color-text-primary)" }}
            >
              {stockInfo.volume
                ? (stockInfo.volume / 1000000).toFixed(2) + "M"
                : "-"}
            </div>
          </div>
          <div>
            <div
              className="text-xs mb-1"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              Ceiling
            </div>
            <div
              className="text-sm font-medium"
              style={{ color: "var(--chart-ceiling)" }}
            >
              {stockInfo.ceiling?.toLocaleString("vi-VN") ?? "-"}
            </div>
          </div>
          <div>
            <div
              className="text-xs mb-1"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              Ref
            </div>
            <div
              className="text-sm font-medium"
              style={{ color: "var(--chart-reference)" }}
            >
              {stockInfo.refPrice?.toLocaleString("vi-VN") ?? "-"}
            </div>
          </div>
          <div>
            <div
              className="text-xs mb-1"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              Floor
            </div>
            <div
              className="text-sm font-medium"
              style={{ color: "var(--chart-floor)" }}
            >
              {stockInfo.floor?.toLocaleString("vi-VN") ?? "-"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
