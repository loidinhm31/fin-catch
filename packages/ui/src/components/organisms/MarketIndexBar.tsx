import React, { useState, useEffect, useCallback } from "react";
import { TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { usePlatformServices } from "@fin-catch/ui/platform";
import type {
  MarketIndex,
  MarketDataMessage,
  TradingPlatformId,
  MarketDataConnectionStatus,
} from "@fin-catch/shared";

/**
 * Props for MarketIndexBar component
 */
export interface MarketIndexBarProps {
  /** Trading platform ID */
  platform: TradingPlatformId;
  /** Index codes to display (defaults to VN30, VNINDEX, HNX, UPCOM) */
  indexes?: string[];
}

/**
 * Default indexes to display
 */
const DEFAULT_INDEXES = ["VN30", "VNINDEX", "HNX", "UPCOM"];

/**
 * MarketIndexBar component
 *
 * Displays a horizontal bar with major market indexes.
 * Shows real-time updates with color-coded change indicators.
 */
export const MarketIndexBar: React.FC<MarketIndexBarProps> = ({
  platform,
  indexes = DEFAULT_INDEXES,
}) => {
  const { marketData } = usePlatformServices();
  const [indexData, setIndexData] = useState<Map<string, MarketIndex>>(
    new Map(),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<MarketDataConnectionStatus>("disconnected");

  // Handle incoming market data messages
  const handleMessage = useCallback(
    (msg: MarketDataMessage) => {
      if (msg.type === "MARKET_INDEX") {
        const index = msg.data as MarketIndex;
        const indexCode = index.indexCode.toUpperCase();
        if (indexes.map((i) => i.toUpperCase()).includes(indexCode)) {
          setIndexData((prev) => {
            const next = new Map(prev);
            next.set(indexCode, index);
            return next;
          });
          setLoading(false);
        }
      }
    },
    [indexes],
  );

  // Handle connection errors
  const handleError = useCallback((err: Error) => {
    console.error("[MarketIndexBar] Error:", err);
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

  // Use refs to store latest callbacks
  const handleMessageRef = React.useRef(handleMessage);
  const handleErrorRef = React.useRef(handleError);
  const handleStatusChangeRef = React.useRef(handleStatusChange);

  React.useEffect(() => {
    handleMessageRef.current = handleMessage;
    handleErrorRef.current = handleError;
    handleStatusChangeRef.current = handleStatusChange;
  });

  useEffect(() => {
    if (!marketData || indexes.length === 0) return;

    setLoading(true);
    setError(null);

    // Connect to market data stream
    const disconnect = marketData.connect(
      platform,
      (msg: MarketDataMessage) => handleMessageRef.current(msg),
      (err: Error) => handleErrorRef.current(err),
      (status: MarketDataConnectionStatus) =>
        handleStatusChangeRef.current(status),
    );

    // Subscribe to indexes after a short delay
    const subscribeTimeout = setTimeout(() => {
      marketData.subscribeIndexes(platform, indexes).catch((err: Error) => {
        console.error("[MarketIndexBar] Subscribe error:", err);
        setError(err.message);
        setLoading(false);
      });
    }, 500);

    return () => {
      clearTimeout(subscribeTimeout);
      // Unsubscribe from all indexes
      for (const idx of indexes) {
        marketData.unsubscribeIndex(platform, idx).catch(console.error);
      }
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platform, marketData, indexes.join(",")]);

  // Loading state - show skeleton
  if (loading && indexData.size === 0) {
    return (
      <div
        className="rounded-2xl border backdrop-blur-xl p-3"
        style={{
          background: "rgba(10, 14, 39, 0.5)",
          borderColor: "rgba(0, 212, 255, 0.2)",
        }}
      >
        <div className="flex items-center justify-center py-2">
          <Loader2
            className="w-5 h-5 animate-spin"
            style={{ color: "#00d4ff" }}
          />
          <span className="ml-2 text-sm" style={{ color: "#9ca3af" }}>
            Loading market indexes...
          </span>
        </div>
      </div>
    );
  }

  // Error state
  if (error && indexData.size === 0) {
    return (
      <div
        className="rounded-2xl border backdrop-blur-xl p-3"
        style={{
          background: "rgba(10, 14, 39, 0.5)",
          borderColor: "rgba(255, 51, 102, 0.3)",
        }}
      >
        <div className="text-center py-2">
          <p className="text-sm" style={{ color: "#ff3366" }}>
            {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl border backdrop-blur-xl p-3"
      style={{
        background: "rgba(10, 14, 39, 0.5)",
        borderColor: "rgba(0, 212, 255, 0.2)",
      }}
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {indexes.map((idx) => {
          const data = indexData.get(idx.toUpperCase());
          return (
            <IndexCard
              key={idx}
              indexCode={idx}
              data={data}
              isConnected={connectionStatus === "connected"}
            />
          );
        })}
      </div>
    </div>
  );
};

/**
 * Individual index card
 */
interface IndexCardProps {
  indexCode: string;
  data: MarketIndex | undefined;
  isConnected: boolean;
}

const IndexCard: React.FC<IndexCardProps> = ({
  indexCode,
  data,
  isConnected,
}) => {
  const change = data?.change || 0;
  const changePercent = data?.changePercent || 0;
  const isUp = change >= 0;
  const priceColor = isUp ? "#00ff88" : "#ff3366";
  const TrendIcon = isUp ? TrendingUp : TrendingDown;

  return (
    <div
      className="p-3 rounded-xl transition-all hover:scale-[1.02]"
      style={{
        background: `linear-gradient(135deg, ${priceColor}08 0%, transparent 100%)`,
        border: `1px solid ${priceColor}20`,
      }}
    >
      {/* Index Name */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium" style={{ color: "#9ca3af" }}>
          {indexCode}
        </span>
        {isConnected && (
          <div
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: "#00ff88" }}
          />
        )}
      </div>

      {/* Value */}
      <div
        className="text-lg font-bold tracking-tight"
        style={{ color: "white" }}
      >
        {data?.indexValue?.toLocaleString("vi-VN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }) ?? "-"}
      </div>

      {/* Change */}
      <div className="flex items-center gap-1 mt-0.5">
        <TrendIcon className="w-3 h-3" style={{ color: priceColor }} />
        <span className="text-xs font-medium" style={{ color: priceColor }}>
          {isUp ? "+" : ""}
          {change.toFixed(2)} ({changePercent.toFixed(2)}%)
        </span>
      </div>

      {/* High/Low */}
      <div className="flex justify-between mt-2 pt-2 border-t border-white/5 text-[10px]">
        <div className="flex flex-col">
          <span style={{ color: "#6b7280" }}>High</span>
          <span style={{ color: "white" }}>
            {data?.highestValue?.toLocaleString("vi-VN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }) ?? "-"}
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span style={{ color: "#6b7280" }}>Low</span>
          <span style={{ color: "white" }}>
            {data?.lowestValue?.toLocaleString("vi-VN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }) ?? "-"}
          </span>
        </div>
      </div>
    </div>
  );
};
