import React, { useState } from "react";
import {
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
import { PortfolioHoldingsPerformance } from "@/types";
import { formatTimestampForChart } from "@/utils/dateUtils";
import { calculateXAxisInterval } from "@/utils/chartUtils";
import { useResponsiveChart } from "@/hooks/useResponsiveChart";
import { ResponsiveChartContainer } from "@/components/molecules";

export interface HoldingsPerformanceChartResponsiveProps {
  data: PortfolioHoldingsPerformance;
  resolution?: string;
}

export const HoldingsPerformanceChartResponsive: React.FC<
  HoldingsPerformanceChartResponsiveProps
> = ({ data, resolution = "1D" }) => {
  const [brushIndex, setBrushIndex] = useState<{
    startIndex?: number;
    endIndex?: number;
  }>({});

  const { dimensions, fullscreenDimensions, isMobile, isTablet } =
    useResponsiveChart();

  if (!data || !data.holdings || data.holdings.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        No holdings data available
      </div>
    );
  }

  // Create a map of all timestamps to data points
  const timestampMap = new Map<number, any>();

  data.holdings.forEach((holding) => {
    holding.performance_data.forEach((point) => {
      if (!timestampMap.has(point.timestamp)) {
        timestampMap.set(point.timestamp, {
          timestamp: point.timestamp,
          time: formatTimestampForChart(point.timestamp, resolution),
        });
      }
      timestampMap.get(point.timestamp)![holding.entry.symbol] = point.value;
    });
  });

  // Convert to array and sort by timestamp
  const chartData = Array.from(timestampMap.values()).sort(
    (a, b) => a.timestamp - b.timestamp,
  );

  const handleBrushChange = (newIndex: any) => {
    setBrushIndex({
      startIndex: newIndex.startIndex,
      endIndex: newIndex.endIndex,
    });
  };

  const renderPerformanceCards = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-4">
      {data.holdings.map((holding) => {
        const isPositive = holding.current_return >= 0;
        return (
          <div key={holding.entry.id} className="glass-card p-2">
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: holding.color }}
              />
              <p
                style={{
                  fontSize: "var(--text-xs)",
                  fontWeight: "var(--font-bold)",
                  color: "var(--cube-gray-900)",
                }}
              >
                {holding.entry.symbol}
              </p>
            </div>
            <p
              style={{
                fontSize: "var(--text-sm)",
                fontWeight: "var(--font-bold)",
                color: isPositive ? "#10b981" : "#ef4444",
              }}
            >
              {isPositive ? "+" : ""}
              {holding.current_return.toFixed(2)}%
            </p>
          </div>
        );
      })}
    </div>
  );

  const renderChart = (isFullscreen = false) => {
    const activeDimensions = isFullscreen ? fullscreenDimensions : dimensions;
    const chartHeight = activeDimensions.height;
    const showBrush = activeDimensions.showBrush;

    // Calculate optimal X-axis interval for better display
    const xAxisInterval = calculateXAxisInterval(
      chartData.length,
      isFullscreen,
      isMobile,
      isTablet,
    );

    return (
      <div className="w-full">
        {renderPerformanceCards()}
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
              stroke="#a0aec0"
              style={{
                fontSize: `${activeDimensions.tickFontSize}px`,
                fontWeight: "500",
              }}
              label={
                !isMobile
                  ? {
                      value: "Performance (Base 100)",
                      angle: -90,
                      position: "insideBottomLeft",
                      style: {
                        fill: "#ffffff",
                        fontWeight: "600",
                        fontSize: `${activeDimensions.labelFontSize}px`,
                      },
                    }
                  : undefined
              }
              domain={["auto", "auto"]}
              tick={{ fill: "#a0aec0" }}
              width={isMobile ? 50 : 60}
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
                const change = ((Number(value) - 100) / 100) * 100;
                return [
                  `${Number(value).toFixed(2)} (${change >= 0 ? "+" : ""}${change.toFixed(
                    2,
                  )}%)`,
                  String(name ?? ""),
                ];
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

            {/* Render a line for each holding */}
            {data.holdings.map((holding) => (
              <Line
                key={holding.entry.id}
                type="monotone"
                dataKey={holding.entry.symbol}
                stroke={holding.color}
                strokeWidth={isMobile ? 2 : 2.5}
                dot={false}
                name={holding.entry.symbol}
                activeDot={{
                  r: isMobile ? 4 : 6,
                  fill: holding.color,
                  stroke: "#ffffff",
                  strokeWidth: 2,
                }}
                connectNulls
              />
            ))}
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
      </div>
    );
  };

  return (
    <ResponsiveChartContainer
      title="Holdings Performance"
      subtitle="Normalized to 100 at each purchase date"
      fullscreenChildren={renderChart(true)}
    >
      {renderChart(false)}
    </ResponsiveChartContainer>
  );
};
