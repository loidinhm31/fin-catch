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
        className={className}
        style={{
          fontSize: "10px",
          color: "var(--color-text-secondary, #94a3b8)",
        }}
      >
        No bid/ask
      </div>
    );
  }

  if (compact) {
    return (
      <div
        className={className}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "10px",
          fontFamily: "monospace",
        }}
      >
        {/* Bid */}
        <span style={{ color: "#00ff88" }}>
          B: {formatPrice(bidPrice)}
          {bidVolume !== undefined && (
            <span style={{ opacity: 0.7 }}> ({formatVolume(bidVolume)})</span>
          )}
        </span>

        {/* Separator */}
        <span style={{ color: "var(--color-text-secondary, #64748b)" }}>|</span>

        {/* Ask */}
        <span style={{ color: "#ff3366" }}>
          A: {formatPrice(askPrice)}
          {askVolume !== undefined && (
            <span style={{ opacity: 0.7 }}> ({formatVolume(askVolume)})</span>
          )}
        </span>
      </div>
    );
  }

  // Stacked layout for non-compact mode
  return (
    <div
      className={className}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "2px",
        fontSize: "11px",
        fontFamily: "monospace",
      }}
    >
      {/* Bid row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ color: "var(--color-text-secondary, #94a3b8)" }}>
          Bid
        </span>
        <span style={{ color: "#00ff88" }}>
          {formatPrice(bidPrice)}
          {bidVolume !== undefined && (
            <span style={{ opacity: 0.7, marginLeft: "4px" }}>
              ({formatVolume(bidVolume)})
            </span>
          )}
        </span>
      </div>

      {/* Ask row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ color: "var(--color-text-secondary, #94a3b8)" }}>
          Ask
        </span>
        <span style={{ color: "#ff3366" }}>
          {formatPrice(askPrice)}
          {askVolume !== undefined && (
            <span style={{ opacity: 0.7, marginLeft: "4px" }}>
              ({formatVolume(askVolume)})
            </span>
          )}
        </span>
      </div>

      {/* Spread indicator */}
      {bidPrice !== undefined && askPrice !== undefined && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "2px",
            paddingTop: "2px",
            borderTop: "1px solid rgba(100, 116, 139, 0.2)",
          }}
        >
          <span style={{ color: "var(--color-text-secondary, #94a3b8)" }}>
            Spread
          </span>
          <span style={{ color: "#00d4ff" }}>
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
      <div
        className={`animate-pulse ${className ?? ""}`}
        style={{
          display: "flex",
          gap: "8px",
        }}
      >
        <div
          style={{
            width: "60px",
            height: "12px",
            background: "rgba(100, 116, 139, 0.2)",
            borderRadius: "2px",
          }}
        />
        <div
          style={{
            width: "60px",
            height: "12px",
            background: "rgba(100, 116, 139, 0.2)",
            borderRadius: "2px",
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`animate-pulse ${className ?? ""}`}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "4px",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "14px",
          background: "rgba(100, 116, 139, 0.2)",
          borderRadius: "2px",
        }}
      />
      <div
        style={{
          width: "100%",
          height: "14px",
          background: "rgba(100, 116, 139, 0.2)",
          borderRadius: "2px",
        }}
      />
    </div>
  );
};
