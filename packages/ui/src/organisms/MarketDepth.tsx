import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { usePlatformServices } from "../platform/PlatformContext";
import type {
  TopPrice,
  OrderBookLevel,
  MarketDataMessage,
  TradingPlatformId,
} from "@fin-catch/shared";

/**
 * Props for MarketDepth component
 */
export interface MarketDepthProps {
  /** Stock symbol to display */
  symbol: string;
  /** Trading platform ID */
  platform: TradingPlatformId;
  /** Maximum number of levels to display */
  maxLevels?: number;
  /** Callback when price level is clicked */
  onPriceClick?: (price: number, side: "bid" | "ask") => void;
}

/**
 * MarketDepth component
 *
 * Displays Level 2 order book with top N bid/ask levels.
 * Shows depth visualization with volume bars.
 */
export const MarketDepth: React.FC<MarketDepthProps> = ({
  symbol,
  platform,
  maxLevels = 10,
  onPriceClick,
}) => {
  const { marketData } = usePlatformServices();
  const [orderBook, setOrderBook] = useState<TopPrice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Handle incoming market data messages
  const handleMessage = useCallback(
    (msg: MarketDataMessage) => {
      if (msg.type === "TOP_PRICE") {
        const topPrice = msg.data as TopPrice;
        if (topPrice.symbol.toUpperCase() === symbol.toUpperCase()) {
          setOrderBook(topPrice);
          setLoading(false);
        }
      }
    },
    [symbol],
  );

  // Handle connection errors
  const handleError = useCallback((err: Error) => {
    console.error("[MarketDepth] Error:", err);
    setError(err.message);
    setLoading(false);
  }, []);

  // Use refs to store latest callbacks without triggering effect re-runs
  const handleMessageRef = React.useRef(handleMessage);
  const handleErrorRef = React.useRef(handleError);

  // Keep refs updated
  React.useEffect(() => {
    handleMessageRef.current = handleMessage;
    handleErrorRef.current = handleError;
  });

  useEffect(() => {
    if (!marketData || !symbol) return;

    setLoading(true);
    setError(null);

    // Connect to market data stream using refs to avoid re-connection on callback changes
    const disconnect = marketData.connect(
      platform,
      (msg) => handleMessageRef.current(msg),
      (err) => handleErrorRef.current(err),
    );

    // Subscribe to symbol
    const subscribeTimeout = setTimeout(() => {
      marketData.subscribe(platform, symbol).catch((err) => {
        console.error("[MarketDepth] Subscribe error:", err);
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

  // Calculate max volume for bar width scaling
  const maxVolume = useMemo(() => {
    if (!orderBook) return 0;
    const bidMax = Math.max(...orderBook.bids.map((b) => b.volume), 0);
    const askMax = Math.max(...orderBook.asks.map((a) => a.volume), 0);
    return Math.max(bidMax, askMax);
  }, [orderBook]);

  // Calculate spread
  const spread = useMemo(() => {
    if (!orderBook || !orderBook.asks[0] || !orderBook.bids[0]) return 0;
    return orderBook.asks[0].price - orderBook.bids[0].price;
  }, [orderBook]);

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
        <div className="flex items-center justify-center py-8">
          <Loader2
            className="w-5 h-5 animate-spin"
            style={{ color: "#00d4ff" }}
          />
          <span className="ml-2 text-sm" style={{ color: "#9ca3af" }}>
            Loading order book...
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
  if (!orderBook) {
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
            Waiting for order book data...
          </p>
        </div>
      </div>
    );
  }

  const displayedAsks = orderBook.asks.slice(0, maxLevels).reverse();
  const displayedBids = orderBook.bids.slice(0, maxLevels);

  return (
    <div
      className="p-4 rounded-2xl border backdrop-blur-xl"
      style={{
        background: "rgba(10, 14, 39, 0.5)",
        borderColor: "rgba(0, 212, 255, 0.3)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold" style={{ color: "#9ca3af" }}>
          Order Book
        </h3>
        <span className="text-xs" style={{ color: "#6b7280" }}>
          {symbol}
        </span>
      </div>

      {/* Column Headers */}
      <div
        className="grid grid-cols-2 gap-1 mb-2 text-xs font-medium"
        style={{ color: "#6b7280" }}
      >
        <div className="flex justify-between px-2">
          <span>Price</span>
          <span>Volume</span>
        </div>
        <div className="flex justify-between px-2">
          <span>Price</span>
          <span>Volume</span>
        </div>
      </div>

      {/* Order Book Grid */}
      <div className="grid grid-cols-2 gap-1">
        {/* Asks (sell orders) - reversed to show highest first */}
        <div className="space-y-0.5">
          {displayedAsks.map((level, i) => (
            <OrderBookRow
              key={`ask-${i}`}
              level={level}
              side="ask"
              maxVolume={maxVolume}
              onClick={() => onPriceClick?.(level.price, "ask")}
            />
          ))}
        </div>

        {/* Bids (buy orders) */}
        <div className="space-y-0.5">
          {displayedBids.map((level, i) => (
            <OrderBookRow
              key={`bid-${i}`}
              level={level}
              side="bid"
              maxVolume={maxVolume}
              onClick={() => onPriceClick?.(level.price, "bid")}
            />
          ))}
        </div>
      </div>

      {/* Spread */}
      <div
        className="mt-3 pt-3 border-t flex items-center justify-center gap-2"
        style={{ borderColor: "rgba(255, 255, 255, 0.1)" }}
      >
        <span className="text-xs" style={{ color: "#6b7280" }}>
          Spread:
        </span>
        <span className="text-xs font-medium" style={{ color: "#00d4ff" }}>
          {spread.toFixed(2)}
        </span>
        <span className="text-xs" style={{ color: "#6b7280" }}>
          (
          {orderBook.bids[0]
            ? ((spread / orderBook.bids[0].price) * 100).toFixed(2)
            : 0}
          %)
        </span>
      </div>
    </div>
  );
};

/**
 * Props for OrderBookRow component
 */
interface OrderBookRowProps {
  /** Order book level data */
  level: OrderBookLevel;
  /** Side (bid or ask) */
  side: "bid" | "ask";
  /** Maximum volume for bar scaling */
  maxVolume: number;
  /** Click handler */
  onClick?: () => void;
}

/**
 * OrderBookRow component
 *
 * Single row in the order book with depth bar visualization.
 */
const OrderBookRow: React.FC<OrderBookRowProps> = ({
  level,
  side,
  maxVolume,
  onClick,
}) => {
  const widthPercent = maxVolume > 0 ? (level.volume / maxVolume) * 100 : 0;
  const color = side === "bid" ? "#00ff88" : "#ff3366";
  const bgColor =
    side === "bid" ? "rgba(0, 255, 136, 0.1)" : "rgba(255, 51, 102, 0.1)";

  return (
    <div
      className="relative h-7 flex items-center px-2 rounded cursor-pointer transition-all duration-150
               hover:brightness-125"
      style={{ background: "rgba(255, 255, 255, 0.02)" }}
      onClick={onClick}
    >
      {/* Depth bar */}
      <div
        className="absolute inset-y-0 rounded"
        style={{
          width: `${widthPercent}%`,
          backgroundColor: bgColor,
          right: side === "ask" ? 0 : "auto",
          left: side === "bid" ? 0 : "auto",
        }}
      />

      {/* Content */}
      <div className="relative flex justify-between w-full text-xs">
        <span className="font-medium" style={{ color }}>
          {level.price.toLocaleString("vi-VN")}
        </span>
        <span style={{ color: "#9ca3af" }}>
          {(level.volume / 100).toLocaleString("vi-VN")}
        </span>
      </div>
    </div>
  );
};
