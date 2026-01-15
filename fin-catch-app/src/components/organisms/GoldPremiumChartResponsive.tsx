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
import { GoldPremiumPoint } from "@/types";
import { formatTimestampForChart } from "@/utils/dateUtils";
import {
  formatCurrencyCompact,
  formatCurrencyValue,
  formatPercent,
} from "@/utils/chartFormatters";
import { calculateXAxisInterval } from "@/utils/chartUtils";
import { useResponsiveChart } from "@/hooks/useResponsiveChart";
import { ResponsiveChartContainer } from "@/components/molecules";

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
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        No data available
      </div>
    );
  }

  // If not showing full chart, only display the most recent data point
  const displayData = showFullChart ? data : [data[data.length - 1]];

  // Format data for chart
  const chartData = displayData.map((point) => ({
    time: formatTimestampForChart(point.timestamp, "1D"),
    timestamp: point.timestamp,
    target_price: point.target_price,
    market_price_vnd: point.market_price_vnd,
    premium_rate: point.premium_rate,
    premium_value: point.premium_value,
    market_price_usd: point.market_price_usd,
    stock_price_timestamp: point.stock_price_timestamp,
    exchange_rate: point.exchange_rate,
    exchange_rate_timestamp: point.exchange_rate_timestamp,
    gold_type: point.gold_type,
  }));

  const handleBrushChange = (newIndex: any) => {
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
          className={`p-3 sm:p-4 rounded-xl mb-3 ${isPremiumPositive
            ? "bg-gradient-to-r from-yellow-100 to-orange-100"
            : "bg-gradient-to-r from-blue-100 to-cyan-100"
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
                color: "#10B981",
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
            stroke="rgba(123, 97, 255, 0.2)"
            vertical={false}
          />
          <XAxis
            dataKey="time"
            stroke="#a0aec0"
            style={{
              fontSize: `${activeDimensions.tickFontSize}px`,
              fontWeight: "500",
            }}
            angle={activeDimensions.angleXAxis}
            textAnchor="end"
            height={activeDimensions.marginBottom}
            tick={{ fill: "#a0aec0" }}
            interval={xAxisInterval as any}
          />
          <YAxis
            yAxisId="left"
            stroke="#a0aec0"
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
                    fill: "#ffffff",
                    fontWeight: "600",
                    fontSize: `${activeDimensions.labelFontSize}px`,
                  },
                }
                : undefined
            }
            tickFormatter={formatCurrencyCompact}
            tick={{ fill: "#a0aec0" }}
            width={isMobile ? 60 : 80}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#a0aec0"
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
                    fill: "#ffffff",
                    fontWeight: "600",
                    fontSize: `${activeDimensions.labelFontSize}px`,
                  },
                }
                : undefined
            }
            tickFormatter={(value) => value.toFixed(1) + "%"}
            tick={{ fill: "#a0aec0" }}
            width={isMobile ? 45 : 60}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(26, 31, 58, 0.95)",
              border: "1px solid rgba(0, 212, 255, 0.3)",
              borderRadius: "12px",
              color: "#ffffff",
              fontWeight: "600",
              fontSize: `${activeDimensions.fontSize}px`,
              boxShadow:
                "0 8px 24px rgba(0, 0, 0, 0.3), 0 0 24px rgba(0, 212, 255, 0.2)",
              backdropFilter: "blur(12px)",
            }}
            labelStyle={{
              color: "#00d4ff",
              marginBottom: "8px",
              fontSize: `${activeDimensions.fontSize}px`,
            }}
            formatter={(value: any, name: string | number | undefined) => {
              if (name === "premium_rate") {
                return [formatPercent(Number(value)), "Premium Rate"];
              } else if (name === "target_price") {
                return [
                  formatCurrencyValue(Number(value)) + " VND",
                  "Target Price",
                ];
              } else if (name === "market_price_vnd") {
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
                color: "#ffffff",
                fontSize: `${activeDimensions.legendFontSize}px`,
              }}
              iconType="line"
            />
          )}
          <Bar
            yAxisId="right"
            dataKey="premium_rate"
            fill="url(#premiumGradient)"
            name="Premium Rate (%)"
            radius={[4, 4, 0, 0]}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="target_price"
            stroke="#ffaa00"
            strokeWidth={isMobile ? 2 : 2.5}
            dot={false}
            name="Target Price"
            activeDot={{
              r: isMobile ? 4 : 6,
              fill: "#ffaa00",
              stroke: "#ffffff",
              strokeWidth: 2,
            }}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="market_price_vnd"
            stroke="#00ff88"
            strokeWidth={isMobile ? 2 : 2.5}
            dot={false}
            name="Market Price (VND)"
            activeDot={{
              r: isMobile ? 4 : 6,
              fill: "#00ff88",
              stroke: "#ffffff",
              strokeWidth: 2,
            }}
          />
          {showBrush && (
            <Brush
              dataKey="time"
              height={activeDimensions.brushHeight}
              stroke="rgba(123, 97, 255, 0.6)"
              fill="rgba(26, 31, 58, 0.6)"
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
