import React from "react";
import { GripVertical, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { StockInfo, TopPrice, TradingPlatformId } from "@fin-catch/shared";
import { MiniStockChart } from "@fin-catch/ui/atoms";
import { BidAskSpread } from "@fin-catch/ui/atoms";
import { TickTape, MarketDepth } from "@fin-catch/ui/organisms";

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
 * Get color based on change direction
 */
function getChangeColor(change: number | undefined): string {
  if (change === undefined || change === null || change === 0) {
    return "#fbbf24"; // amber/yellow for no change
  }
  return change > 0 ? "#22c55e" : "#ef4444"; // green / red
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
  const color = getChangeColor(change);

  const TrendIcon =
    change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus;

  // Get best bid/ask from stockInfo or topPrice
  const bidPrice = topPrice?.bids?.[0]?.price ?? stockInfo?.bidPrice;
  const bidVolume = topPrice?.bids?.[0]?.volume ?? stockInfo?.bidVolume;
  const askPrice = topPrice?.asks?.[0]?.price ?? stockInfo?.askPrice;
  const askVolume = topPrice?.asks?.[0]?.volume ?? stockInfo?.askVolume;

  return (
    <div
      className={`
        relative rounded-xl cursor-pointer transition-all duration-200
        ${isDragging ? "scale-105 shadow-2xl z-50" : "hover:scale-[1.02]"}
        ${isSelected ? "ring-2 ring-cyan-400" : ""}
        ${className ?? ""}
      `}
      style={{
        width: "280px",
        minHeight: "180px",
        background: isDragging
          ? "rgba(0, 212, 255, 0.15)"
          : isSelected
            ? "rgba(0, 212, 255, 0.1)"
            : "rgba(15, 23, 42, 0.7)",
        border: isDragging
          ? "1px solid rgba(0, 212, 255, 0.6)"
          : isSelected
            ? "1px solid rgba(0, 212, 255, 0.5)"
            : "1px solid rgba(100, 116, 139, 0.2)",
        backdropFilter: "blur(8px)",
        boxShadow: isDragging
          ? "0 20px 40px rgba(0, 0, 0, 0.4)"
          : "0 4px 12px rgba(0, 0, 0, 0.2)",
        transform: isDragging ? "rotate(2deg)" : undefined,
        padding: "12px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
      onClick={onClick}
    >
      {/* Header: Drag Handle, Symbol, Trend Icon */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {showDragHandle && (
            <GripVertical
              className="w-4 h-4 cursor-grab active:cursor-grabbing"
              style={{
                color: "var(--color-text-secondary, #64748b)",
                opacity: isDragging ? 1 : 0.5,
              }}
            />
          )}
          <span
            style={{
              fontWeight: 700,
              fontSize: "14px",
              color: "var(--color-text-primary, #f8fafc)",
            }}
          >
            {symbol}
          </span>
        </div>
        <TrendIcon className="w-4 h-4" style={{ color }} />
      </div>

      {/* Price Row */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: "8px",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontSize: "18px",
            fontWeight: 700,
            color,
          }}
        >
          {formatPrice(lastPrice)}
        </span>
        <span
          style={{
            fontSize: "11px",
            padding: "2px 6px",
            borderRadius: "4px",
            background:
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
        <span
          style={{
            fontSize: "10px",
            color: "var(--color-text-secondary, #94a3b8)",
          }}
        >
          Vol: {formatVolume(volume)}
        </span>
      </div>

      {/* Mini Stock Chart - 1 Year from DNSE */}
      <div
        style={{
          flex: 1,
          minHeight: "60px",
          borderRadius: "6px",
          background: "rgba(0, 0, 0, 0.2)",
          padding: "4px",
        }}
      >
        <MiniStockChart symbol={symbol} height={60} width="100%" />
      </div>

      {/* Bid/Ask Spread */}
      <div
        style={{
          paddingTop: "8px",
          borderTop: "1px solid rgba(100, 116, 139, 0.2)",
        }}
      >
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
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "9px",
            color: "var(--color-text-secondary, #64748b)",
          }}
        >
          <span>
            F:{" "}
            <span style={{ color: "#06b6d4" }}>
              {formatPrice(stockInfo.floor)}
            </span>
          </span>
          <span>
            R:{" "}
            <span style={{ color: "#fbbf24" }}>
              {formatPrice(stockInfo.refPrice)}
            </span>
          </span>
          <span>
            C:{" "}
            <span style={{ color: "#a855f7" }}>
              {formatPrice(stockInfo.ceiling)}
            </span>
          </span>
        </div>
      )}

      {/* MarketDepth - Order Book (compact) */}
      {showMarketDepth && platform && (
        <div
          style={{
            marginTop: "5px",
            borderTop: "1px solid rgba(100, 116, 139, 0.2)",
            paddingTop: "2px",
            fontSize: "10px",
          }}
        >
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
        <div
          style={{
            marginTop: "5px",
            borderTop: "1px solid rgba(100, 116, 139, 0.2)",
            paddingTop: "2px",
            fontSize: "10px",
          }}
        >
          <TickTape symbol={symbol} platform={platform} maxTicks={5} />
        </div>
      )}
    </div>
  );
};

