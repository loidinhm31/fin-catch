import React, { useState, useMemo } from "react";
import type { OHLC } from "@fin-catch/shared";

/**
 * Props for OhlcDisplay component
 */
export interface OhlcDisplayProps {
  /** OHLC data to display */
  ohlc: OHLC | null;
  /** Height of the candlestick bar in pixels */
  height?: number;
  /** Width of the candlestick bar in pixels */
  width?: number;
  /** Whether to show volume bar */
  showVolume?: boolean;
  /** Whether to show timestamp */
  showTimestamp?: boolean;
  /** Custom class name */
  className?: string;
}

/**
 * Format number with thousand separators
 */
function formatNumber(num: number | undefined, decimals = 0): string {
  if (num === undefined || num === null) return "-";
  return num.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format timestamp to time string
 */
function formatTime(timestamp: number | undefined): string {
  if (!timestamp) return "-";
  // If timestamp is in seconds (smaller than 10^12), convert to milliseconds
  const ms = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
  const date = new Date(ms);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * OhlcDisplay component
 *
 * Displays OHLC candlestick data as a mini visualization with tooltip.
 * Shows a candlestick body with wicks and optional volume bar.
 */
export const OhlcDisplay: React.FC<OhlcDisplayProps> = ({
  ohlc,
  height = 40,
  width = 24,
  showVolume = true,
  showTimestamp = true,
  className = "",
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  // Calculate candlestick dimensions
  const candlestick = useMemo(() => {
    if (!ohlc || !ohlc.open || !ohlc.high || !ohlc.low || !ohlc.close) {
      return null;
    }

    const { open, high, low, close } = ohlc;
    const isBullish = close >= open;
    const range = high - low;

    if (range === 0) {
      return {
        isBullish,
        bodyTop: 50,
        bodyHeight: 2,
        wickTop: 50,
        wickHeight: 2,
      };
    }

    // Calculate percentages for positioning
    const wickTop = 0;
    const wickHeight = 100;
    const bodyTop = ((high - Math.max(open, close)) / range) * 100;
    const bodyBottom = ((high - Math.min(open, close)) / range) * 100;
    const bodyHeight = Math.max(bodyBottom - bodyTop, 2); // Minimum 2% height

    return {
      isBullish,
      bodyTop,
      bodyHeight,
      wickTop,
      wickHeight,
    };
  }, [ohlc]);

  // Calculate volume bar height (relative to candlestick)
  const volumeHeight = useMemo(() => {
    if (!ohlc?.volume) return 0;
    // Normalize to max 30% of total height
    return Math.min(30, Math.max(5, 30)); // Simplified - could be relative to max volume
  }, [ohlc?.volume]);

  if (!ohlc) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ height, width }}
      >
        <span className="text-xs text-gray-500">-</span>
      </div>
    );
  }

  const isBullish = candlestick?.isBullish ?? true;
  const color = isBullish ? "#22c55e" : "var(--color-red-500)"; // green / red
  const bgColor = isBullish
    ? "var(--color-alert-success-bg)"
    : "var(--color-alert-error-bg)";

  return (
    <div
      className={`relative inline-flex flex-col items-center gap-0.5 cursor-pointer ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Candlestick */}
      <div
        className="relative"
        style={{ height: height - (showVolume ? 10 : 0), width }}
      >
        {candlestick && (
          <>
            {/* Wick (high-low line) */}
            <div
              className="absolute left-1/2 -translate-x-1/2"
              style={{
                top: `${candlestick.wickTop}%`,
                height: `${candlestick.wickHeight}%`,
                width: 1,
                backgroundColor: color,
              }}
            />
            {/* Body (open-close box) */}
            <div
              className="absolute left-1/2 -translate-x-1/2 rounded-sm"
              style={{
                top: `${candlestick.bodyTop}%`,
                height: `${candlestick.bodyHeight}%`,
                width: width * 0.6,
                backgroundColor: isBullish ? bgColor : color,
                border: `1px solid ${color}`,
              }}
            />
          </>
        )}
      </div>

      {/* Volume Bar */}
      {showVolume && ohlc.volume && (
        <div
          className="rounded-sm"
          style={{
            height: 8,
            width: width * 0.8,
            backgroundColor: "var(--color-border-primary)",
          }}
        >
          <div
            className="h-full rounded-sm"
            style={{
              width: `${volumeHeight * 3}%`,
              backgroundColor: "var(--color-border-primary)",
            }}
          />
        </div>
      )}

      {/* Timestamp */}
      {showTimestamp && ohlc.timestamp && (
        <span className="text-[9px] text-gray-500">
          {formatTime(ohlc.timestamp)}
        </span>
      )}

      {/* Tooltip */}
      {showTooltip && (
        <div
          className="absolute z-50 p-2 rounded-lg shadow-lg text-xs whitespace-nowrap"
          style={{
            bottom: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            marginBottom: 8,
            background: "var(--glass-bg-compact)",
            border: "1px solid var(--color-border-primary)",
          }}
        >
          {/* Symbol & Interval */}
          <div className="font-medium text-white mb-1">
            {ohlc.symbol}{" "}
            <span className="text-gray-400">({ohlc.interval})</span>
          </div>
          {/* OHLC Values */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px]">
            <div className="text-gray-400">Open:</div>
            <div className="text-right text-white">
              {formatNumber(ohlc.open)}
            </div>
            <div className="text-gray-400">High:</div>
            <div className="text-right text-green-400">
              {formatNumber(ohlc.high)}
            </div>
            <div className="text-gray-400">Low:</div>
            <div className="text-right text-red-400">
              {formatNumber(ohlc.low)}
            </div>
            <div className="text-gray-400">Close:</div>
            <div className="text-right" style={{ color }}>
              {formatNumber(ohlc.close)}
            </div>
            {ohlc.volume && (
              <>
                <div className="text-gray-400">Vol:</div>
                <div className="text-right text-white">
                  {formatNumber(ohlc.volume)}
                </div>
              </>
            )}
          </div>
          {/* Arrow */}
          <div
            className="absolute left-1/2 -translate-x-1/2"
            style={{
              bottom: -6,
              width: 0,
              height: 0,
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderTop: "6px solid var(--glass-bg-compact)",
            }}
          />
        </div>
      )}
    </div>
  );
};

/**
 * Compact OHLC display for inline use
 */
export const OhlcInline: React.FC<{ ohlc: OHLC | null }> = ({ ohlc }) => {
  if (!ohlc) {
    return <span className="text-xs text-gray-500">-</span>;
  }

  const isBullish = (ohlc.close ?? 0) >= (ohlc.open ?? 0);
  const color = isBullish ? "text-green-400" : "text-red-400";

  return (
    <span className={`text-xs font-mono ${color}`}>
      O:{formatNumber(ohlc.open)} H:{formatNumber(ohlc.high)} L:
      {formatNumber(ohlc.low)} C:{formatNumber(ohlc.close)}
    </span>
  );
};
