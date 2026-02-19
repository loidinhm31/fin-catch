import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { StockInfo, OHLC } from "@fin-catch/shared";
import { OhlcDisplay } from "@fin-catch/ui/components/organisms";

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

  const TrendIcon = change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus;

  // Determine change state for Tailwind classes
  const isPositive = change > 0;
  const isNegative = change < 0;
  const isNeutral = change === 0;

  return (
    <div
      className={`
        relative p-3 rounded-lg cursor-pointer transition-all duration-200
        hover:scale-[1.02] active:scale-[0.98]
        border backdrop-blur-md
        ${
          isSelected
            ? "bg-(--color-sync-pending-bg) border-(--color-sync-pending-border) ring-2 ring-(--color-market-live)"
            : "bg-(--glass-bg-card) border-(--color-border-light)"
        }
      `}
      onClick={onClick}
    >
      {/* Header: Symbol & Trend Icon */}
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-(--color-text-primary) text-sm">
          {symbol}
        </span>
        <TrendIcon
          className={`h-4 w-4 ${
            isPositive
              ? "text-(--color-trade-buy)"
              : isNegative
                ? "text-(--color-trade-sell)"
                : "text-(--color-amber-400)"
          }`}
        />
      </div>

      {/* Price */}
      <div className="flex items-baseline gap-2 mb-1">
        <span
          className={`text-lg font-bold ${
            isPositive
              ? "text-(--color-trade-buy)"
              : isNegative
                ? "text-(--color-trade-sell)"
                : "text-(--color-amber-400)"
          }`}
        >
          {formatPrice(lastPrice)}
        </span>
        {stockInfo?.volume && (
          <span className="text-[10px] text-(--color-text-muted)">
            Vol: {(stockInfo.volume / 1000).toFixed(0)}K
          </span>
        )}
      </div>

      {/* Change */}
      <div className="flex items-center gap-2">
        <span
          className={`text-xs ${
            isPositive
              ? "text-(--color-trade-buy)"
              : isNegative
                ? "text-(--color-trade-sell)"
                : "text-(--color-amber-400)"
          }`}
        >
          {change >= 0 ? "+" : ""}
          {formatPrice(Math.abs(change))}
        </span>
        <span
          className={`
            text-xs px-1.5 py-0.5 rounded
            ${
              isPositive
                ? "bg-(--color-alert-success-bg) text-(--color-trade-buy)"
                : isNegative
                  ? "bg-(--color-alert-error-bg) text-(--color-trade-sell)"
                  : "bg-(--color-alert-warning-bg) text-(--color-amber-400)"
            }
          `}
        >
          {formatPercent(changePercent)}
        </span>
      </div>

      {/* OHLC Bar (optional) */}
      {showOhlc && (
        <div className="mt-2 pt-2 border-t border-(--color-white-10)">
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
        <div className="mt-2 flex justify-between text-[9px] text-(--color-text-muted)">
          <span>
            F:{" "}
            <span className="text-(--chart-floor)">
              {formatPrice(stockInfo.floor)}
            </span>
          </span>
          <span>
            R:{" "}
            <span className="text-(--chart-reference)">
              {formatPrice(stockInfo.refPrice)}
            </span>
          </span>
          <span>
            C:{" "}
            <span className="text-(--chart-ceiling)">
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
    <div className="p-3 rounded-lg animate-pulse bg-(--glass-bg-card) border border-(--color-border-light)">
      <div className="flex items-center justify-between mb-2">
        <div className="h-4 w-12 bg-(--color-border-light) rounded" />
        <div className="h-4 w-4 bg-(--color-border-light) rounded" />
      </div>
      <div className="h-6 w-20 bg-(--color-border-light) rounded mb-1" />
      <div className="flex gap-2">
        <div className="h-4 w-12 bg-(--color-border-light) rounded" />
        <div className="h-4 w-14 bg-(--color-border-light) rounded" />
      </div>
    </div>
  );
};
