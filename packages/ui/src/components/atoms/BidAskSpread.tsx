import React from "react";

/**
 * Props for BidAskSpread component
 */
export interface BidAskSpreadProps {
  /** Best bid price */
  bidPrice?: number;
  /** Best bid volume */
  bidVolume?: number;
  /** Best ask price */
  askPrice?: number;
  /** Best ask volume */
  askVolume?: number;
  /** Compact mode (single line) */
  compact?: boolean;
  /** Custom class name */
  className?: string;
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
 * Format volume (in thousands with K suffix)
 */
function formatVolume(volume: number | undefined): string {
  if (volume === undefined || volume === null) return "-";
  if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}K`;
  }
  return volume.toString();
}

/**
 * BidAskSpread component
 *
 * Displays bid and ask prices with their volumes in a compact format.
 * Green for bid (buying pressure), red for ask (selling pressure).
 *
 * @example
 * ```tsx
 * <BidAskSpread
 *   bidPrice={24450}
 *   bidVolume={200}
 *   askPrice={24550}
 *   askVolume={150}
 * />
 * // Displays: Bid: 24,450 (200) | Ask: 24,550 (150)
 * ```
 */
export const BidAskSpread: React.FC<BidAskSpreadProps> = ({
  bidPrice,
  bidVolume,
  askPrice,
  askVolume,
  compact = true,
  className,
}) => {
  const hasBid = bidPrice !== undefined;
  const hasAsk = askPrice !== undefined;

  if (!hasBid && !hasAsk) {
    return (
      <div
        className={`text-[10px] text-(--color-text-secondary) ${className ?? ""}`}
      >
        No bid/ask
      </div>
    );
  }

  if (compact) {
    return (
      <div
        className={`flex items-center gap-2 text-[10px] font-mono ${className ?? ""}`}
      >
        {/* Bid */}
        <span className="text-(--color-trade-buy)">
          B: {formatPrice(bidPrice)}
          {bidVolume !== undefined && (
            <span className="opacity-70"> ({formatVolume(bidVolume)})</span>
          )}
        </span>

        {/* Separator */}
        <span className="text-(--color-text-secondary)">|</span>

        {/* Ask */}
        <span className="text-(--color-trade-sell)">
          A: {formatPrice(askPrice)}
          {askVolume !== undefined && (
            <span className="opacity-70"> ({formatVolume(askVolume)})</span>
          )}
        </span>
      </div>
    );
  }

  // Stacked layout for non-compact mode
  return (
    <div
      className={`flex flex-col gap-0.5 text-[11px] font-mono ${className ?? ""}`}
    >
      {/* Bid row */}
      <div className="flex justify-between items-center">
        <span className="text-(--color-text-secondary)">Bid</span>
        <span className="text-(--color-trade-buy)">
          {formatPrice(bidPrice)}
          {bidVolume !== undefined && (
            <span className="opacity-70 ml-1">({formatVolume(bidVolume)})</span>
          )}
        </span>
      </div>

      {/* Ask row */}
      <div className="flex justify-between items-center">
        <span className="text-(--color-text-secondary)">Ask</span>
        <span className="text-(--color-trade-sell)">
          {formatPrice(askPrice)}
          {askVolume !== undefined && (
            <span className="opacity-70 ml-1">({formatVolume(askVolume)})</span>
          )}
        </span>
      </div>

      {/* Spread indicator */}
      {bidPrice !== undefined && askPrice !== undefined && (
        <div className="flex justify-between items-center mt-0.5 pt-0.5 border-t border-(--color-border-light)">
          <span className="text-(--color-text-secondary)">Spread</span>
          <span className="text-(--color-market-live)">
            {formatPrice(askPrice - bidPrice)} (
            {(((askPrice - bidPrice) / bidPrice) * 100).toFixed(2)}%)
          </span>
        </div>
      )}
    </div>
  );
};

/**
 * BidAskSpreadSkeleton - Loading placeholder
 */
export const BidAskSpreadSkeleton: React.FC<{
  compact?: boolean;
  className?: string;
}> = ({ compact = true, className }) => {
  if (compact) {
    return (
      <div className={`animate-pulse flex gap-2 ${className ?? ""}`}>
        <div className="w-[60px] h-3 bg-(--color-border-light) rounded-sm" />
        <div className="w-[60px] h-3 bg-(--color-border-light) rounded-sm" />
      </div>
    );
  }

  return (
    <div className={`animate-pulse flex flex-col gap-1 ${className ?? ""}`}>
      <div className="w-full h-3.5 bg-(--color-border-light) rounded-sm" />
      <div className="w-full h-3.5 bg-(--color-border-light) rounded-sm" />
    </div>
  );
};
