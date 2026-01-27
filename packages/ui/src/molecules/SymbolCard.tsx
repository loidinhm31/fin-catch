import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { StockInfo, OHLC } from "@fin-catch/shared";
import { OhlcDisplay } from "@fin-catch/ui/organisms";

/**
 * Props for SymbolCard component
 */
export interface SymbolCardProps {
  /** Stock symbol */
  symbol: string;
  /** Stock info data */
  stockInfo: StockInfo | null;
  /** OHLC data (optional) */
  ohlc?: OHLC | null;
  /** Whether this card is selected */
  isSelected?: boolean;
  /** Callback when card is clicked */
  onClick?: () => void;
  /** Whether to show OHLC visualization */
  showOhlc?: boolean;
}

/**
 * Format price with thousand separators
 */
function formatPrice(price: number | undefined): string {
  if (price === undefined || price === null) return "-";
  return price.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

/**
 * Format percentage change
 */
function formatPercent(percent: number | undefined): string {
  if (percent === undefined || percent === null) return "-";
  const sign = percent >= 0 ? "+" : "";
  return `${sign}${percent.toFixed(2)}%`;
}

/**
 * Get color based on change direction
 */
function getChangeColor(change: number | undefined): string {
  if (change === undefined || change === null || change === 0) {
    return "#fbbf24"; // amber/yellow for no change
  }
  return change > 0 ? "#22c55e" : "#ef4444"; // green / red
}

/**
 * SymbolCard component
 *
 * Compact card showing symbol, price, change indicator, and optional OHLC bar.
 * Click to select/expand for full details.
 */
export const SymbolCard: React.FC<SymbolCardProps> = ({
  symbol,
  stockInfo,
  ohlc,
  isSelected = false,
  onClick,
  showOhlc = false,
}) => {
  const change = stockInfo?.change ?? 0;
  const changePercent = stockInfo?.changePercent;
  const lastPrice = stockInfo?.lastPrice;
  const color = getChangeColor(change);

  const TrendIcon = change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus;

  return (
    <div
      className={`
        relative p-3 rounded-lg cursor-pointer transition-all duration-200
        hover:scale-[1.02] active:scale-[0.98]
        ${isSelected ? "ring-2" : ""}
      `}
      style={{
        background: isSelected
          ? "rgba(0, 212, 255, 0.1)"
          : "rgba(15, 23, 42, 0.6)",
        border: isSelected
          ? "1px solid rgba(0, 212, 255, 0.5)"
          : "1px solid rgba(100, 116, 139, 0.2)",
        ringColor: "#00d4ff",
      }}
      onClick={onClick}
    >
      {/* Header: Symbol & Trend Icon */}
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-white text-sm">{symbol}</span>
        <TrendIcon className="h-4 w-4" style={{ color }} />
      </div>

      {/* Price */}
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-lg font-bold" style={{ color }}>
          {formatPrice(lastPrice)}
        </span>
        {stockInfo?.volume && (
          <span className="text-[10px] text-gray-500">
            Vol: {(stockInfo.volume / 1000).toFixed(0)}K
          </span>
        )}
      </div>

      {/* Change */}
      <div className="flex items-center gap-2">
        <span className="text-xs" style={{ color }}>
          {change >= 0 ? "+" : ""}
          {formatPrice(Math.abs(change))}
        </span>
        <span
          className="text-xs px-1.5 py-0.5 rounded"
          style={{
            backgroundColor:
              change > 0
                ? "rgba(34, 197, 94, 0.2)"
                : change < 0
                  ? "rgba(239, 68, 68, 0.2)"
                  : "rgba(251, 191, 36, 0.2)",
            color,
          }}
        >
          {formatPercent(changePercent)}
        </span>
      </div>

      {/* OHLC Bar (optional) */}
      {showOhlc && (
        <div className="mt-2 pt-2 border-t border-gray-700/50">
          <OhlcDisplay
            ohlc={ohlc ?? null}
            height={32}
            width={20}
            showVolume={false}
            showTimestamp={false}
          />
        </div>
      )}

      {/* Reference/Ceiling/Floor indicator */}
      {stockInfo && (stockInfo.ceiling || stockInfo.floor) && (
        <div className="mt-2 flex justify-between text-[9px] text-gray-500">
          <span>
            F:{" "}
            <span className="text-cyan-400">
              {formatPrice(stockInfo.floor)}
            </span>
          </span>
          <span>
            R:{" "}
            <span className="text-yellow-400">
              {formatPrice(stockInfo.refPrice)}
            </span>
          </span>
          <span>
            C:{" "}
            <span className="text-purple-400">
              {formatPrice(stockInfo.ceiling)}
            </span>
          </span>
        </div>
      )}
    </div>
  );
};

/**
 * SymbolCardSkeleton - Loading placeholder for SymbolCard
 */
export const SymbolCardSkeleton: React.FC = () => {
  return (
    <div
      className="p-3 rounded-lg animate-pulse"
      style={{
        background: "rgba(15, 23, 42, 0.6)",
        border: "1px solid rgba(100, 116, 139, 0.2)",
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="h-4 w-12 bg-gray-700 rounded" />
        <div className="h-4 w-4 bg-gray-700 rounded" />
      </div>
      <div className="h-6 w-20 bg-gray-700 rounded mb-1" />
      <div className="flex gap-2">
        <div className="h-4 w-12 bg-gray-700 rounded" />
        <div className="h-4 w-14 bg-gray-700 rounded" />
      </div>
    </div>
  );
};
