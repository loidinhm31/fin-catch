import React, { useMemo } from "react";
import type { OHLC } from "@fin-catch/shared";

/**
 * Props for MiniOhlcChart component
 */
export interface MiniOhlcChartProps {
  /** OHLC data to display (can be a single candle or array of candles) */
  ohlc: OHLC | OHLC[] | null;
  /** Chart height in pixels */
  height?: number;
  /** Chart width (CSS value, e.g., "100%" or "120px") */
  width?: string | number;
  /** Number of candles to show (when ohlc is array) */
  candleCount?: number;
  /** Custom class name */
  className?: string;
}

/**
 * Get candle color based on open/close relationship
 */
function getCandleColor(open: number, close: number): {
  fill: string;
  stroke: string;
} {
  if (close >= open) {
    return { fill: "rgba(0, 255, 136, 0.6)", stroke: "#00ff88" }; // Green for bullish
  }
  return { fill: "rgba(255, 51, 102, 0.6)", stroke: "#ff3366" }; // Red for bearish
}

/**
 * MiniOhlcChart component
 *
 * A compact SVG-based candlestick chart optimized for small card displays.
 * Shows OHLC data as mini candlesticks with green (bullish) / red (bearish) coloring.
 *
 * @example
 * ```tsx
 * // Single candle
 * <MiniOhlcChart ohlc={ohlcData} height={50} />
 *
 * // Multiple candles
 * <MiniOhlcChart ohlc={ohlcHistory} height={50} candleCount={10} />
 * ```
 */
export const MiniOhlcChart: React.FC<MiniOhlcChartProps> = ({
  ohlc,
  height = 50,
  width = "100%",
  candleCount = 10,
  className,
}) => {
  // Normalize ohlc to array
  const candles = useMemo(() => {
    if (!ohlc) return [];
    if (Array.isArray(ohlc)) {
      // Take last N candles
      return ohlc.slice(-candleCount);
    }
    return [ohlc];
  }, [ohlc, candleCount]);

  // Calculate price range for scaling
  const { minPrice, maxPrice, priceRange } = useMemo(() => {
    if (candles.length === 0) {
      return { minPrice: 0, maxPrice: 0, priceRange: 0 };
    }

    let min = Infinity;
    let max = -Infinity;

    for (const candle of candles) {
      const low = candle.low ?? candle.close ?? 0;
      const high = candle.high ?? candle.close ?? 0;
      if (low < min) min = low;
      if (high > max) max = high;
    }

    // Add small padding to prevent candles from touching edges
    const range = max - min || 1;
    const padding = range * 0.1;

    return {
      minPrice: min - padding,
      maxPrice: max + padding,
      priceRange: range + padding * 2,
    };
  }, [candles]);

  // Don't render if no data
  if (candles.length === 0) {
    return (
      <div
        className={className}
        style={{
          height,
          width: typeof width === "number" ? `${width}px` : width,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontSize: "10px",
            color: "var(--color-text-secondary, #94a3b8)",
          }}
        >
          No data
        </span>
      </div>
    );
  }

  // Calculate candle dimensions
  const svgWidth = 100; // Use viewBox for responsive scaling
  const svgHeight = height;
  const candleWidth = Math.max(4, (svgWidth - 10) / candles.length - 2);
  const wickWidth = 1;

  // Scale price to Y coordinate (inverted because SVG Y increases downward)
  const scaleY = (price: number): number => {
    return svgHeight - ((price - minPrice) / priceRange) * svgHeight;
  };

  return (
    <svg
      className={className}
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      preserveAspectRatio="none"
      style={{
        height,
        width: typeof width === "number" ? `${width}px` : width,
        display: "block",
      }}
    >
      {candles.map((candle, index) => {
        const open = candle.open ?? candle.close ?? 0;
        const close = candle.close ?? open;
        const high = candle.high ?? Math.max(open, close);
        const low = candle.low ?? Math.min(open, close);

        const { fill, stroke } = getCandleColor(open, close);

        // Calculate positions
        const x = 5 + index * (candleWidth + 2);
        const bodyTop = scaleY(Math.max(open, close));
        const bodyBottom = scaleY(Math.min(open, close));
        const bodyHeight = Math.max(1, bodyBottom - bodyTop);
        const wickTop = scaleY(high);
        const wickBottom = scaleY(low);
        const centerX = x + candleWidth / 2;

        return (
          <g key={`candle-${index}-${candle.timestamp ?? index}`}>
            {/* Upper wick */}
            <line
              x1={centerX}
              y1={wickTop}
              x2={centerX}
              y2={bodyTop}
              stroke={stroke}
              strokeWidth={wickWidth}
            />
            {/* Lower wick */}
            <line
              x1={centerX}
              y1={bodyBottom}
              x2={centerX}
              y2={wickBottom}
              stroke={stroke}
              strokeWidth={wickWidth}
            />
            {/* Candle body */}
            <rect
              x={x}
              y={bodyTop}
              width={candleWidth}
              height={bodyHeight}
              fill={fill}
              stroke={stroke}
              strokeWidth={0.5}
              rx={0.5}
            />
          </g>
        );
      })}
    </svg>
  );
};

/**
 * MiniOhlcChartSkeleton - Loading placeholder
 */
export const MiniOhlcChartSkeleton: React.FC<{
  height?: number;
  width?: string | number;
  className?: string;
}> = ({ height = 50, width = "100%", className }) => {
  return (
    <div
      className={`animate-pulse ${className ?? ""}`}
      style={{
        height,
        width: typeof width === "number" ? `${width}px` : width,
        background: "rgba(100, 116, 139, 0.2)",
        borderRadius: "4px",
      }}
    />
  );
};
