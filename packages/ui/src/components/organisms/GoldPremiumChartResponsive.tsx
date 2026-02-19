import React, { useState } from "react";
import {
  Bar,
  Brush,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatTimestampForChart, GoldPremiumPoint } from "@fin-catch/shared";
import {
  calculateXAxisInterval,
  formatCurrencyCompact,
  formatCurrencyValue,
  formatPercent,
} from "@fin-catch/ui/utils";
import { useResponsiveChart } from "@fin-catch/ui/hooks";
import { ResponsiveChartContainer } from "@fin-catch/ui/components/molecules";
import type { BrushChangeEvent } from "@fin-catch/ui/types";

export interface GoldPremiumChartResponsiveProps {
  data: GoldPremiumPoint[];
  showFullChart?: boolean;
}

export const GoldPremiumChartResponsive: React.FC<
  GoldPremiumChartResponsiveProps
> = ({ data, showFullChart = false }) => {
  const [brushIndex, setBrushIndex] = useState<{
    startIndex?: number;
    endIndex?: number;
  }>({});

  const { dimensions, fullscreenDimensions, isMobile, isTablet } =
    useResponsiveChart();

  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center h-64"
        style={{ color: "var(--color-text-secondary)" }}
      >
        No data available
      </div>
    );
  }

  // If not showing full chart, only display the most recent data point
  const displayData = showFullChart ? data : [data[data.length - 1]];

  // Format data for chart (API returns snake_case)
  const chartData = displayData.map((point) => ({
    time: formatTimestampForChart(point.timestamp, "1D"),
    timestamp: point.timestamp,
    targetPrice: point.target_price,
    marketPriceVnd: point.market_price_vnd,
    premiumRate: point.premium_rate,
    premiumValue: point.premium_value,
    marketPriceUsd: point.market_price_usd,
    stockPriceTimestamp: point.stock_price_timestamp,
    exchangeRate: point.exchange_rate,
    exchangeRateTimestamp: point.exchange_rate_timestamp,
    goldType: point.gold_type,
  }));

  const handleBrushChange = (newIndex: BrushChangeEvent) => {
    setBrushIndex({
      startIndex: newIndex.startIndex,
      endIndex: newIndex.endIndex,
    });
  };

  // If current date only mode, show compact badge view instead of chart
  if (!showFullChart && displayData.length > 0) {
    const point = displayData[0];
    const isPremiumPositive = point.premium_rate > 0;

    return (
      <div className="w-full">
        {/* Compact Premium Rate Badge */}
        <div
          className={`p-3 sm:p-4 rounded-xl mb-3 ${
            isPremiumPositive
              ? "bg-(--color-amber-400)/20"
              : "bg-(--color-cyan-500)/20"
          } border-2 ${isPremiumPositive ? "border-yellow-300" : "border-blue-300"}`}
        >
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-baseline gap-2">
              <span
                style={{
                  fontSize: "var(--text-xs)",
                  color: "#d97706",
                  opacity: 0.9,
                }}
              >
                Premium:
              </span>
              <span
                style={{
                  fontSize: isMobile ? "var(--text-xl)" : "var(--text-2xl)",
                  fontWeight: "var(--font-bold)",
                  color: isPremiumPositive ? "#d97706" : "#0284c7",
                }}
              >
                {isPremiumPositive ? "+" : ""}
                {formatPercent(point.premium_rate)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                style={{
                  fontSize: "var(--text-sm)",
                  color: "#d97706",
                  opacity: 0.9,
                }}
              >
                {formatCurrencyValue(point.premium_value)} VND
              </span>
            </div>
          </div>
        </div>

        {/* Compact Price Info Grid */}
        <div className="grid grid-cols-2 gap-2">
          {/* Target Price */}
          <div className="glass-card p-2 sm:p-3">
            <p
              style={{
                fontSize: "var(--text-xs)",
                opacity: 0.6,
                marginBottom: "4px",
              }}
            >
              Local Target
            </p>
            <p
              style={{
                fontSize: isMobile ? "var(--text-sm)" : "var(--text-base)",
                fontWeight: "var(--font-bold)",
                color: "#fb923c",
              }}
            >
              {formatCurrencyValue(point.target_price)}
            </p>
          </div>

          {/* Market Price VND */}
          <div className="glass-card p-2 sm:p-3">
            <p
              style={{
                fontSize: "var(--text-xs)",
                opacity: 0.6,
                marginBottom: "4px",
              }}
            >
              Market (VND)
            </p>
            <p
              style={{
                fontSize: isMobile ? "var(--text-sm)" : "var(--text-base)",
                fontWeight: "var(--font-bold)",
                color: "var(--color-green-500)",
              }}
            >
              {formatCurrencyValue(point.market_price_vnd)}
            </p>
          </div>

          {/* Market Price USD */}
          <div className="glass-card p-2 sm:p-3">
            <p
              style={{
                fontSize: "var(--text-xs)",
                opacity: 0.6,
                marginBottom: "4px",
              }}
            >
              Market (USD)
            </p>
            <p
              style={{
                fontSize: isMobile ? "var(--text-sm)" : "var(--text-base)",
                fontWeight: "var(--font-bold)",
              }}
            >
              ${point.market_price_usd.toFixed(2)}/oz
            </p>
          </div>

          {/* Exchange Rate */}
          <div className="glass-card p-2 sm:p-3">
            <p
              style={{
                fontSize: "var(--text-xs)",
                opacity: 0.6,
                marginBottom: "4px",
              }}
            >
              Exchange Rate
            </p>
            <p
              style={{
                fontSize: isMobile ? "var(--text-sm)" : "var(--text-base)",
                fontWeight: "var(--font-bold)",
              }}
            >
              {point.exchange_rate.toFixed(0)}
            </p>
          </div>
        </div>

        {/* Timestamp & Gold Type */}
        <div
          className="mt-2 flex justify-between items-center"
          style={{ fontSize: "var(--text-xs)", opacity: 0.6 }}
        >
          <span>{point.gold_type}</span>
          <span>{new Date(point.timestamp * 1000).toLocaleString()}</span>
        </div>
      </div>
    );
  }

  const renderChart = (isFullscreen = false) => {
    const activeDimensions = isFullscreen ? fullscreenDimensions : dimensions;
    const chartHeight = activeDimensions.height;
    const showBrush = activeDimensions.showBrush && showFullChart;

    // Calculate optimal X-axis interval for better display
    const xAxisInterval = calculateXAxisInterval(
      chartData.length,
      isFullscreen,
      isMobile,
      isTablet,
    );

    return (
      <ResponsiveContainer width="100%" height={chartHeight}>
        <ComposedChart
          data={chartData}
          margin={{
            top: 5,
            right: activeDimensions.marginRight,
            left: activeDimensions.marginLeft,
            bottom: activeDimensions.marginBottom,
          }}
        >
          <defs>
            <linearGradient id="premiumGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ffaa00" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#ffaa00" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--chart-grid)"
            vertical={false}
          />
          <XAxis
            dataKey="time"
            stroke="var(--chart-axis)"
            style={{
              fontSize: `${activeDimensions.tickFontSize}px`,
              fontWeight: "500",
            }}
            angle={activeDimensions.angleXAxis}
            textAnchor="end"
            height={activeDimensions.marginBottom}
            tick={{ fill: "var(--chart-axis)" }}
            interval={xAxisInterval as any}
          />
          <YAxis
            yAxisId="left"
            stroke="var(--chart-axis)"
            style={{
              fontSize: `${activeDimensions.tickFontSize}px`,
              fontWeight: "500",
            }}
            label={
              !isMobile
                ? {
                    value: "Price (VND)",
                    angle: -90,
                    position: "insideLeft",
                    style: {
                      fill: "var(--chart-label)",
                      fontWeight: "600",
                      fontSize: `${activeDimensions.labelFontSize}px`,
                    },
                  }
                : undefined
            }
            tickFormatter={formatCurrencyCompact}
            tick={{ fill: "var(--chart-axis)" }}
            width={isMobile ? 60 : 80}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="var(--chart-axis)"
            style={{
              fontSize: `${activeDimensions.tickFontSize}px`,
              fontWeight: "500",
            }}
            label={
              !isMobile
                ? {
                    value: "Premium (%)",
                    angle: 90,
                    position: "insideRight",
                    style: {
                      fill: "var(--chart-label)",
                      fontWeight: "600",
                      fontSize: `${activeDimensions.labelFontSize}px`,
                    },
                  }
                : undefined
            }
            tickFormatter={(value) => value.toFixed(1) + "%"}
            tick={{ fill: "var(--chart-axis)" }}
            width={isMobile ? 45 : 60}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--glass-bg-compact)",
              border: "1px solid var(--color-sync-pending-border)",
              borderRadius: "12px",
              color: "var(--chart-label)",
              fontWeight: "600",
              fontSize: `${activeDimensions.fontSize}px`,
              boxShadow: "var(--shadow-glass-sm)",
              backdropFilter: "blur(12px)",
            }}
            labelStyle={{
              color: "var(--chart-volume-start)",
              marginBottom: "8px",
              fontSize: `${activeDimensions.fontSize}px`,
            }}
            formatter={(value: any, name: string | number | undefined) => {
              if (name === "premiumRate") {
                return [formatPercent(Number(value)), "Premium Rate"];
              } else if (name === "targetPrice") {
                return [
                  formatCurrencyValue(Number(value)) + " VND",
                  "Target Price",
                ];
              } else if (name === "marketPriceVnd") {
                return [
                  formatCurrencyValue(Number(value)) + " VND",
                  "Market Price (VND)",
                ];
              }
              return [value, String(name ?? "")];
            }}
            labelFormatter={(label) => `Time: ${label}`}
          />
          {activeDimensions.showLegend && (
            <Legend
              wrapperStyle={{
                fontWeight: "600",
                paddingTop: "16px",
                color: "var(--chart-label)",
                fontSize: `${activeDimensions.legendFontSize}px`,
              }}
              iconType="line"
            />
          )}
          <Bar
            yAxisId="right"
            dataKey="premiumRate"
            fill="url(#premiumGradient)"
            name="Premium Rate (%)"
            radius={[4, 4, 0, 0]}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="targetPrice"
            stroke="#ffaa00"
            strokeWidth={isMobile ? 2 : 2.5}
            dot={false}
            name="Target Price"
            activeDot={{
              r: isMobile ? 4 : 6,
              fill: "#ffaa00",
              stroke: "var(--chart-label)",
              strokeWidth: 2,
            }}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="marketPriceVnd"
            stroke="var(--color-trade-buy)"
            strokeWidth={isMobile ? 2 : 2.5}
            dot={false}
            name="Market Price (VND)"
            activeDot={{
              r: isMobile ? 4 : 6,
              fill: "var(--color-trade-buy)",
              stroke: "var(--chart-label)",
              strokeWidth: 2,
            }}
          />
          {showBrush && (
            <Brush
              dataKey="time"
              height={activeDimensions.brushHeight}
              stroke="var(--color-market-purple-border)"
              fill="var(--glass-bg-card)"
              travellerWidth={isMobile ? 15 : 10}
              startIndex={brushIndex.startIndex}
              endIndex={brushIndex.endIndex}
              onChange={handleBrushChange}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    );
  };

  return (
    <ResponsiveChartContainer
      title="Gold Premium Chart"
      subtitle={`${data.length} data points`}
      fullscreenChildren={renderChart(true)}
    >
      {renderChart(false)}
    </ResponsiveChartContainer>
  );
};
