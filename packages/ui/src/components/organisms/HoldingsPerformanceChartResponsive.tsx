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
import {
  formatTimestampForChart,
  PortfolioHoldingsPerformance,
} from "@fin-catch/shared";
import { calculateXAxisInterval } from "@fin-catch/ui/utils";
import { useResponsiveChart } from "@fin-catch/ui/hooks";
import { ResponsiveChartContainer } from "@fin-catch/ui/components/molecules";
import type { BrushChangeEvent } from "@fin-catch/ui/types";

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
      <div
        className="flex items-center justify-center h-64"
        style={{ color: "var(--color-text-secondary)" }}
      >
        No holdings data available
      </div>
    );
  }

  // Create a map of all timestamps to data points
  const timestampMap = new Map<number, any>();

  data.holdings.forEach((holding) => {
    holding.performanceData.forEach((point) => {
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

  const handleBrushChange = (newIndex: BrushChangeEvent) => {
    setBrushIndex({
      startIndex: newIndex.startIndex,
      endIndex: newIndex.endIndex,
    });
  };

  const renderPerformanceCards = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-4">
      {data.holdings.map((holding) => {
        const isPositive = holding.currentReturn >= 0;
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
                  color: "var(--color-text-primary)",
                }}
              >
                {holding.entry.symbol}
              </p>
            </div>
            <p
              style={{
                fontSize: "var(--text-sm)",
                fontWeight: "var(--font-bold)",
                color: isPositive
                  ? "var(--color-green-500)"
                  : "var(--color-red-500)",
              }}
            >
              {isPositive ? "+" : ""}
              {holding.currentReturn.toFixed(2)}%
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
              stroke="var(--chart-axis)"
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
                        fill: "var(--chart-label)",
                        fontWeight: "600",
                        fontSize: `${activeDimensions.labelFontSize}px`,
                      },
                    }
                  : undefined
              }
              domain={["auto", "auto"]}
              tick={{ fill: "var(--chart-axis)" }}
              width={isMobile ? 50 : 60}
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
                  color: "var(--chart-label)",
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
                  stroke: "var(--chart-label)",
                  strokeWidth: 2,
                }}
                connectNulls
              />
            ))}
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
