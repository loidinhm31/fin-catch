import React, { useEffect, useState, useMemo } from "react";
import { Loader2 } from "lucide-react";
import type { StockCandle } from "@fin-catch/shared";
import { fetchStockHistory } from "@fin-catch/ui/services";

/**
 * Props for MiniStockChart component
 */
export interface MiniStockChartProps {
  /** Stock symbol to fetch data for */
  symbol: string;
  /** Chart height in pixels */
  height?: number;
  /** Chart width (CSS value) */
  width?: string | number;
  /** Number of days to show (default: 365 for 1 year) */
  days?: number;
  /** Custom class name */
  className?: string;
}

/**
 * MiniStockChart component
 *
 * A self-contained mini chart that fetches 1-year daily stock data from DNSE
 * and renders a compact SVG area chart. Designed for embedding in TradingCard.
 *
 * @example
 * ```tsx
 * <MiniStockChart symbol="FPT" height={60} />
 * ```
 */
export const MiniStockChart: React.FC<MiniStockChartProps> = ({
  symbol,
  height = 60,
  width = "100%",
  days = 365,
  className,
}) => {
  const [data, setData] = useState<StockCandle[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data on mount and when symbol changes
  useEffect(() => {
    if (!symbol) return;

    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const to = Math.floor(Date.now() / 1000);
        const from = to - days * 24 * 60 * 60;

        const response = await fetchStockHistory({
          symbol: symbol.toUpperCase(),
          resolution: "1D",
          from,
          to,
          source: "dnse",
        });

        if (cancelled) return;

        if (response.status === "error") {
          setError(response.error || "Failed to fetch data");
          setData(null);
        } else if (response.data && response.data.length > 0) {
          setData(response.data);
        } else {
          setError("No data available");
          setData(null);
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to fetch data");
        setData(null);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [symbol, days]);

  // Calculate chart data
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const prices = data.map((d) => d.close);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const range = maxPrice - minPrice || 1;
    const padding = range * 0.1;

    return {
      prices,
      minPrice: minPrice - padding,
      maxPrice: maxPrice + padding,
      range: range + padding * 2,
      startPrice: data[0].close,
      endPrice: data[data.length - 1].close,
      isPositive: data[data.length - 1].close >= data[0].close,
    };
  }, [data]);

  // Loading state
  if (loading) {
    return (
      <div
        className={className}
        style={{
          height,
          width: typeof width === "number" ? `${width}px` : width,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(0, 0, 0, 0.1)",
          borderRadius: "6px",
        }}
      >
        <Loader2
          className="animate-spin"
          style={{ width: 16, height: 16, color: "#00d4ff" }}
        />
      </div>
    );
  }

  // Error or no data state
  if (error || !chartData) {
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
          {error || "No data"}
        </span>
      </div>
    );
  }

  // Build SVG path for area chart
  const svgWidth = 200;
  const svgHeight = height;
  const { prices, minPrice, range, isPositive } = chartData;

  const points = prices.map((price, i) => {
    const x = (i / (prices.length - 1)) * svgWidth;
    const y = svgHeight - ((price - minPrice) / range) * svgHeight;
    return { x, y };
  });

  // Create path for line
  const linePath = points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(" ");

  // Create path for filled area (line + bottom edge)
  const areaPath = `${linePath} L ${svgWidth} ${svgHeight} L 0 ${svgHeight} Z`;

  const color = isPositive ? "#00ff88" : "#ff3366";
  const fillColor = isPositive
    ? "rgba(0, 255, 136, 0.2)"
    : "rgba(255, 51, 102, 0.2)";

  // Calculate change percentage
  const changePercent =
    ((chartData.endPrice - chartData.startPrice) / chartData.startPrice) * 100;

  return (
    <div
      className={className}
      style={{
        height,
        width: typeof width === "number" ? `${width}px` : width,
        position: "relative",
      }}
    >
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        preserveAspectRatio="none"
        style={{
          width: "100%",
          height: "100%",
          display: "block",
        }}
      >
        {/* Gradient definition */}
        <defs>
          <linearGradient id={`gradient-${symbol}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0.05} />
          </linearGradient>
        </defs>

        {/* Area fill */}
        <path d={areaPath} fill={`url(#gradient-${symbol})`} />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />

        {/* End point dot */}
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r={3}
          fill={color}
        />
      </svg>

      {/* Change percentage overlay */}
      <div
        style={{
          position: "absolute",
          top: "4px",
          right: "4px",
          fontSize: "9px",
          fontWeight: 600,
          padding: "2px 4px",
          borderRadius: "3px",
          background: isPositive
            ? "rgba(0, 255, 136, 0.2)"
            : "rgba(255, 51, 102, 0.2)",
          color,
        }}
      >
        {isPositive ? "+" : ""}
        {changePercent.toFixed(1)}%
      </div>

      {/* Time label */}
      <div
        style={{
          position: "absolute",
          bottom: "2px",
          left: "4px",
          fontSize: "8px",
          color: "var(--color-text-secondary, #64748b)",
        }}
      >
        1Y
      </div>
    </div>
  );
};
