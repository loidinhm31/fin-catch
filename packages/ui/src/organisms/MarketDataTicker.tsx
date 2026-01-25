import React, { useState, useEffect, useCallback } from "react";
import { TrendingUp, TrendingDown, Activity, Loader2 } from "lucide-react";
import { usePlatformServices } from "../platform/PlatformContext";
import type {
  StockInfo,
  MarketDataMessage,
  TradingPlatformId,
  MarketDataConnectionStatus,
} from "@fin-catch/shared";

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
      if (msg.type === "STOCK_INFO") {
        const info = msg.data as StockInfo;
        if (info.symbol.toUpperCase() === symbol.toUpperCase()) {
          setStockInfo(info);
          setLoading(false);
          onPriceUpdate?.(info.lastPrice);
        }
      }
    },
    [symbol, onPriceUpdate],
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

  useEffect(() => {
    if (!marketData || !symbol) return;

    setLoading(true);
    setError(null);

    // Connect to market data stream
    const disconnect = marketData.connect(
      platform,
      handleMessage,
      handleError,
      handleStatusChange,
    );

    // Subscribe to symbol after a short delay to ensure connection
    const subscribeTimeout = setTimeout(() => {
      marketData.subscribe(platform, symbol).catch((err) => {
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
  }, [
    symbol,
    platform,
    marketData,
    handleMessage,
    handleError,
    handleStatusChange,
  ]);

  // Loading state
  if (loading) {
    return (
      <div
        className="p-4 rounded-2xl border backdrop-blur-xl"
        style={{
          background: "rgba(10, 14, 39, 0.5)",
          borderColor: "rgba(0, 212, 255, 0.3)",
        }}
      >
        <div className="flex items-center justify-center py-6">
          <Loader2
            className="w-6 h-6 animate-spin"
            style={{ color: "#00d4ff" }}
          />
          <span className="ml-3 text-sm" style={{ color: "#9ca3af" }}>
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
          background: "rgba(10, 14, 39, 0.5)",
          borderColor: "rgba(255, 51, 102, 0.3)",
        }}
      >
        <div className="text-center py-4">
          <p className="text-sm" style={{ color: "#ff3366" }}>
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
          background: "rgba(10, 14, 39, 0.5)",
          borderColor: "rgba(0, 212, 255, 0.3)",
        }}
      >
        <div className="text-center py-4">
          <p className="text-sm" style={{ color: "#9ca3af" }}>
            Waiting for data...
          </p>
        </div>
      </div>
    );
  }

  const change = stockInfo.change || 0;
  const changePercent = stockInfo.changePercent || 0;
  const isUp = change >= 0;
  const priceColor = isUp ? "#00ff88" : "#ff3366";
  const TrendIcon = isUp ? TrendingUp : TrendingDown;

  return (
    <div
      className="p-4 rounded-2xl border backdrop-blur-xl"
      style={{
        background: "rgba(10, 14, 39, 0.5)",
        borderColor: `${priceColor}30`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-bold" style={{ color: "white" }}>
            {symbol}
          </h3>
          <span
            className="px-2 py-0.5 rounded text-xs font-medium"
            style={{
              background: `${priceColor}20`,
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
              color: connectionStatus === "connected" ? "#00ff88" : "#ff3366",
            }}
          />
          <span className="text-xs" style={{ color: "#6b7280" }}>
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
          <div className="text-xs mb-1" style={{ color: "#6b7280" }}>
            Bid
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-medium" style={{ color: "#00ff88" }}>
              {stockInfo.bidPrice?.toLocaleString("vi-VN") ?? "-"}
            </span>
            {stockInfo.bidVolume && (
              <span className="text-xs" style={{ color: "#6b7280" }}>
                ({(stockInfo.bidVolume / 100).toFixed(0)})
              </span>
            )}
          </div>
        </div>
        <div>
          <div className="text-xs mb-1" style={{ color: "#6b7280" }}>
            Ask
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-medium" style={{ color: "#ff3366" }}>
              {stockInfo.askPrice?.toLocaleString("vi-VN") ?? "-"}
            </span>
            {stockInfo.askVolume && (
              <span className="text-xs" style={{ color: "#6b7280" }}>
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
            <div className="text-xs mb-1" style={{ color: "#6b7280" }}>
              High
            </div>
            <div className="text-sm font-medium" style={{ color: "white" }}>
              {stockInfo.high?.toLocaleString("vi-VN") ?? "-"}
            </div>
          </div>
          <div>
            <div className="text-xs mb-1" style={{ color: "#6b7280" }}>
              Low
            </div>
            <div className="text-sm font-medium" style={{ color: "white" }}>
              {stockInfo.low?.toLocaleString("vi-VN") ?? "-"}
            </div>
          </div>
          <div>
            <div className="text-xs mb-1" style={{ color: "#6b7280" }}>
              Volume
            </div>
            <div className="text-sm font-medium" style={{ color: "white" }}>
              {stockInfo.volume
                ? (stockInfo.volume / 1000000).toFixed(2) + "M"
                : "-"}
            </div>
          </div>
          <div>
            <div className="text-xs mb-1" style={{ color: "#6b7280" }}>
              Ceiling
            </div>
            <div className="text-sm font-medium" style={{ color: "#a855f7" }}>
              {stockInfo.ceiling?.toLocaleString("vi-VN") ?? "-"}
            </div>
          </div>
          <div>
            <div className="text-xs mb-1" style={{ color: "#6b7280" }}>
              Ref
            </div>
            <div className="text-sm font-medium" style={{ color: "#eab308" }}>
              {stockInfo.refPrice?.toLocaleString("vi-VN") ?? "-"}
            </div>
          </div>
          <div>
            <div className="text-xs mb-1" style={{ color: "#6b7280" }}>
              Floor
            </div>
            <div className="text-sm font-medium" style={{ color: "#06b6d4" }}>
              {stockInfo.floor?.toLocaleString("vi-VN") ?? "-"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
