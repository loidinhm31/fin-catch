import React from "react";
import { GripVertical, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { StockInfo, TopPrice, TradingPlatformId } from "@fin-catch/shared";
import { MiniStockChart } from "@fin-catch/ui/components/atoms";
import { BidAskSpread } from "@fin-catch/ui/components/atoms";
import { TickTape, MarketDepth } from "@fin-catch/ui/components/organisms";

/**
 * Props for TradingCard component
 */
export interface TradingCardProps {
  /** Stock symbol */
  symbol: string;
  /** Stock info data (real-time price) */
  stockInfo: StockInfo | null;
  /** Top price data (Level 2 bid/ask) */
  topPrice?: TopPrice | null;
  /** Trading platform ID (required for TickTape and MarketDepth) */
  platform?: TradingPlatformId;
  /** Whether this card is being dragged */
  isDragging?: boolean;
  /** Whether this card is selected */
  isSelected?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Custom class name */
  className?: string;
  /** Show drag handle */
  showDragHandle?: boolean;
  /** Show TickTape component (requires platform prop) */
  showTickTape?: boolean;
  /** Show MarketDepth component (requires platform prop) */
  showMarketDepth?: boolean;
  /** Maximum ticks to show in TickTape */
  maxTicks?: number;
  /** Maximum levels to show in MarketDepth */
  maxLevels?: number;
  /** Callback when price level is clicked in MarketDepth */
  onPriceClick?: (price: number, side: "bid" | "ask") => void;
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
 * Format volume (in thousands/millions)
 */
function formatVolume(volume: number | undefined): string {
  if (volume === undefined || volume === null) return "-";
  if (volume >= 1_000_000) {
    return `${(volume / 1_000_000).toFixed(1)}M`;
  }
  if (volume >= 1_000) {
    return `${(volume / 1_000).toFixed(1)}K`;
  }
  return volume.toString();
}

/**
 * TradingCard component
 *
 * Enhanced trading card with detailed info and mini OHLC chart.
 * Designed for drag-and-drop grid layout with click-to-order functionality.
 *
 * Structure:
 * ```
 * [GripVertical] SYMBOL  [TrendIcon]
 * Price: 24,500  +2.5%  Vol: 1.2M
 * [MiniOhlcChart - 50px tall]
 * [BidAskSpread]
 * ```
 *
 * @example
 * ```tsx
 * <TradingCard
 *   symbol="VNM"
 *   stockInfo={stockInfo}
 *   topPrice={topPriceData}
 *   onClick={() => openOrderForm(stockInfo)}
 * />
 * ```
 */
export const TradingCard: React.FC<TradingCardProps> = ({
  symbol,
  stockInfo,
  topPrice,
  platform,
  isDragging = false,
  isSelected = false,
  onClick,
  className,
  showDragHandle = true,
  showTickTape = false,
  showMarketDepth = false,
  maxTicks = 10,
  maxLevels = 5,
  onPriceClick,
}) => {
  const change = stockInfo?.change ?? 0;
  const changePercent = stockInfo?.changePercent;
  const lastPrice = stockInfo?.lastPrice;
  const volume = stockInfo?.volume;

  const isPositive = change > 0;
  const isNegative = change < 0;
  const isNeutral = change === 0;

  const TrendIcon = change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus;

  // Get best bid/ask from stockInfo or topPrice
  const bidPrice = topPrice?.bids?.[0]?.price ?? stockInfo?.bidPrice;
  const bidVolume = topPrice?.bids?.[0]?.volume ?? stockInfo?.bidVolume;
  const askPrice = topPrice?.asks?.[0]?.price ?? stockInfo?.askPrice;
  const askVolume = topPrice?.asks?.[0]?.volume ?? stockInfo?.askVolume;

  return (
    <div
      className={`
        relative rounded-xl cursor-pointer transition-all duration-200 p-3 flex flex-col gap-2
        w-[280px] min-h-[180px] backdrop-blur-md border
        ${
          isDragging
            ? "scale-105 shadow-(--shadow-xl) z-50 rotate-[2deg] bg-(--color-sync-pending-bg) border-(--color-sync-pending-border)"
            : isSelected
              ? "bg-(--color-sync-pending-bg) border-(--color-sync-pending-border) ring-2 ring-(--color-market-live)"
              : "bg-(--glass-bg-card) border-(--color-border-light) shadow-[0_4px_12px_var(--color-black-20)] hover:scale-[1.02]"
        }
        ${className ?? ""}
      `}
      onClick={onClick}
    >
      {/* Header: Drag Handle, Symbol, Trend Icon */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {showDragHandle && (
            <GripVertical
              className={`w-4 h-4 cursor-grab active:cursor-grabbing text-(--color-text-secondary) ${
                isDragging ? "opacity-100" : "opacity-50"
              }`}
            />
          )}
          <span className="font-bold text-sm text-(--color-text-primary)">
            {symbol}
          </span>
        </div>
        <TrendIcon
          className={`w-4 h-4 ${
            isPositive
              ? "text-(--color-trade-buy)"
              : isNegative
                ? "text-(--color-trade-sell)"
                : "text-(--color-amber-400)"
          }`}
        />
      </div>

      {/* Price Row */}
      <div className="flex items-baseline gap-2 flex-wrap">
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
        <span
          className={`text-[11px] px-1.5 py-0.5 rounded ${
            isPositive
              ? "bg-(--color-alert-success-bg) text-(--color-trade-buy)"
              : isNegative
                ? "bg-(--color-alert-error-bg) text-(--color-trade-sell)"
                : "bg-(--color-alert-warning-bg) text-(--color-amber-400)"
          }`}
        >
          {formatPercent(changePercent)}
        </span>
        <span className="text-[10px] text-(--color-text-secondary)">
          Vol: {formatVolume(volume)}
        </span>
      </div>

      {/* Mini Stock Chart - 1 Year from DNSE */}
      <div className="flex-1 min-h-[60px] rounded-md bg-(--color-black-20) p-1">
        <MiniStockChart symbol={symbol} height={60} width="100%" />
      </div>

      {/* Bid/Ask Spread */}
      <div className="pt-2 border-t border-(--color-border-light)">
        <BidAskSpread
          bidPrice={bidPrice}
          bidVolume={bidVolume}
          askPrice={askPrice}
          askVolume={askVolume}
          compact
        />
      </div>

      {/* Reference/Ceiling/Floor indicator */}
      {stockInfo && (stockInfo.ceiling || stockInfo.floor) && (
        <div className="flex justify-between text-[9px] text-(--color-text-secondary)">
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

      {/* MarketDepth - Order Book (compact) */}
      {showMarketDepth && platform && (
        <div className="mt-1.5 border-t border-(--color-border-light) pt-0.5 text-[10px]">
          <MarketDepth
            symbol={symbol}
            platform={platform}
            maxLevels={3}
            onPriceClick={onPriceClick}
          />
        </div>
      )}

      {/* TickTape - Trade History (compact) */}
      {showTickTape && platform && (
        <div className="mt-1.5 border-t border-(--color-border-light) pt-0.5 text-[10px]">
          <TickTape symbol={symbol} platform={platform} maxTicks={5} />
        </div>
      )}
    </div>
  );
};
