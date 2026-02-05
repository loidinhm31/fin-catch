import React, { useState, useEffect, useCallback } from "react";
import { Activity, Loader2 } from "lucide-react";
import { usePlatformServices } from "@fin-catch/ui/platform";
import type {
  Tick,
  MarketDataMessage,
  TradingPlatformId,
  MarketDataConnectionStatus,
} from "@fin-catch/shared";

/**
 * Props for TickTape component
 */
export interface TickTapeProps {
  /** Stock symbol to display trades for */
  symbol: string;
  /** Trading platform ID */
  platform: TradingPlatformId;
  /** Maximum number of ticks to display (default: 30) */
  maxTicks?: number;
}

/**
 * TickTape component
 *
 * Displays recent trades for a symbol with time, price, volume, and side.
 * Auto-scrolls with newest trades on top.
 */
export const TickTape: React.FC<TickTapeProps> = ({
  symbol,
  platform,
  maxTicks = 30,
}) => {
  const { marketData } = usePlatformServices();
  const [ticks, setTicks] = useState<Tick[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<MarketDataConnectionStatus>("disconnected");

  // Handle incoming market data messages
  const handleMessage = useCallback(
    (msg: MarketDataMessage) => {
      if (msg.type === "TICK") {
        const tick = msg.data as Tick;
        if (tick.symbol.toUpperCase() === symbol.toUpperCase()) {
          setTicks((prev) => {
            const next = [tick, ...prev];
            if (next.length > maxTicks) {
              next.pop();
            }
            return next;
          });
          setLoading(false);
        }
      }
    },
    [symbol, maxTicks],
  );

  // Handle connection errors
  const handleError = useCallback((err: Error) => {
    console.error("[TickTape] Error:", err);
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
    if (!marketData || !symbol) return;

    setLoading(true);
    setError(null);
    setTicks([]); // Clear ticks when symbol changes

    // Connect to market data stream
    const disconnect = marketData.connect(
      platform,
      (msg: MarketDataMessage) => handleMessageRef.current(msg),
      (err: Error) => handleErrorRef.current(err),
      (status: MarketDataConnectionStatus) =>
        handleStatusChangeRef.current(status),
    );

    // Symbol subscription is handled by the parent (MarketDataTicker subscribes to symbol topics)
    // TICK messages come on the same subscription as STOCK_INFO and TOP_PRICE

    // Load initial tick history from cache
    const subscribeTimeout = setTimeout(() => {
      const cachedTicks = marketData.getTickHistory(symbol, maxTicks);
      if (cachedTicks.length > 0) {
        setTicks(cachedTicks);
        setLoading(false);
      }
    }, 600);

    return () => {
      clearTimeout(subscribeTimeout);
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, platform, marketData, maxTicks]);

  // Format timestamp (handles both number and ISO string)
  const formatTime = (timestamp?: number | string): string => {
    if (!timestamp) return "-";
    let date: Date;
    if (typeof timestamp === "number") {
      // If timestamp is in seconds (smaller than 10^12), convert to milliseconds
      const ms = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
      date = new Date(ms);
    } else {
      date = new Date(timestamp);
    }

    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Get side color
  const getSideColor = (side: string): string => {
    const upperSide = side.toUpperCase();
    if (upperSide === "BUY" || upperSide === "B" || upperSide === "SIDE_BUY")
      return "#00ff88";
    if (upperSide === "SELL" || upperSide === "S" || upperSide === "SIDE_SELL")
      return "#ff3366";
    return "#9ca3af"; // Neutral
  };

  // Get side label
  const getSideLabel = (side: string): string => {
    const upperSide = side.toUpperCase();
    if (upperSide === "BUY" || upperSide === "B" || upperSide === "SIDE_BUY")
      return "BUY";
    if (upperSide === "SELL" || upperSide === "S" || upperSide === "SIDE_SELL")
      return "SELL";
    return "ATC";
  };

  return (
    <div
      className="rounded-2xl border backdrop-blur-xl overflow-hidden"
      style={{
        background: "rgba(10, 14, 39, 0.5)",
        borderColor: "rgba(0, 212, 255, 0.2)",
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 border-b flex items-center justify-between"
        style={{ borderColor: "rgba(255, 255, 255, 0.1)" }}
      >
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4" style={{ color: "#00d4ff" }} />
          <span className="text-sm font-semibold" style={{ color: "white" }}>
            Trade History
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="px-2 py-0.5 rounded text-xs font-medium"
            style={{
              background: "rgba(0, 212, 255, 0.1)",
              color: "#00d4ff",
            }}
          >
            {symbol}
          </span>
          {connectionStatus === "connected" && (
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: "#00ff88" }}
            />
          )}
        </div>
      </div>

      {/* Table Header */}
      <div
        className="grid grid-cols-4 gap-2 px-4 py-2 text-xs font-medium border-b"
        style={{
          color: "#6b7280",
          borderColor: "rgba(255, 255, 255, 0.05)",
          background: "rgba(0, 0, 0, 0.2)",
        }}
      >
        <div>Time</div>
        <div className="text-right">Price</div>
        <div className="text-right">Volume</div>
        <div className="text-center">Side</div>
      </div>

      {/* Content */}
      <div className="max-h-64 overflow-y-auto">
        {loading && ticks.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <Loader2
              className="w-5 h-5 animate-spin"
              style={{ color: "#00d4ff" }}
            />
            <span className="ml-2 text-sm" style={{ color: "#9ca3af" }}>
              Waiting for trades...
            </span>
          </div>
        )}

        {error && ticks.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm" style={{ color: "#ff3366" }}>
              {error}
            </p>
          </div>
        )}

        {ticks.length === 0 && !loading && !error && (
          <div className="text-center py-8">
            <p className="text-sm" style={{ color: "#9ca3af" }}>
              No trades yet
            </p>
          </div>
        )}

        {ticks.map((tick, index) => {
          const sideColor = getSideColor(tick.side);
          const isEven = index % 2 === 0;

          return (
            <div
              key={`${tick.timestamp}-${index}`}
              className="grid grid-cols-4 gap-2 px-4 py-2 text-sm transition-colors hover:bg-white/5"
              style={{
                background: isEven ? "transparent" : "rgba(0, 0, 0, 0.1)",
              }}
            >
              <div style={{ color: "#9ca3af" }}>
                {formatTime(tick.timestamp)}
              </div>
              <div
                className="text-right font-medium"
                style={{ color: sideColor }}
              >
                {tick.price.toLocaleString("vi-VN")}
              </div>
              <div className="text-right" style={{ color: "white" }}>
                {tick.volume.toLocaleString("vi-VN")}
              </div>
              <div className="text-center">
                <span
                  className="px-2 py-0.5 rounded text-xs font-medium"
                  style={{
                    background: `${sideColor}20`,
                    color: sideColor,
                  }}
                >
                  {getSideLabel(tick.side)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer - Trade count & Total Volume */}
      {ticks.length > 0 && (
        <div
          className="px-4 py-2 border-t text-xs flex justify-between items-center"
          style={{
            color: "#6b7280",
            borderColor: "rgba(255, 255, 255, 0.05)",
            background: "rgba(0, 0, 0, 0.2)",
          }}
        >
          <span>Showing {ticks.length} recent trades</span>
          {ticks[0].totalVolumeTraded && (
            <span>
              Total Vol:{" "}
              {parseInt(ticks[0].totalVolumeTraded, 10).toLocaleString("vi-VN")}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
