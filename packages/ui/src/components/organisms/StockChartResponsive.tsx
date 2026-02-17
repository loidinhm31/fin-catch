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
import { formatTimestampForChart, StockCandle } from "@fin-catch/shared";
import {
  calculateXAxisInterval,
  formatCurrencyCompact,
  formatVolume,
} from "@fin-catch/ui/utils";
import { useResponsiveChart } from "@fin-catch/ui/hooks";
import { ResponsiveChartContainer } from "@fin-catch/ui/components/molecules";
import type { BrushChangeEvent } from "@fin-catch/ui/types";

export interface StockChartResponsiveProps {
  data: StockCandle[];
  resolution: string;
  symbol: string;
}

export const StockChartResponsive: React.FC<StockChartResponsiveProps> = ({
  data,
  resolution,
  symbol,
}) => {
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

  // Format data for chart
  const chartData = data.map((candle) => ({
    time: formatTimestampForChart(candle.timestamp, resolution),
    timestamp: candle.timestamp,
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
    volume: candle.volume,
  }));

  const handleBrushChange = (newIndex: BrushChangeEvent) => {
    setBrushIndex({
      startIndex: newIndex.startIndex,
      endIndex: newIndex.endIndex,
    });
  };

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
            <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="var(--chart-volume-start)"
                stopOpacity={0.4}
              />
              <stop offset="95%" stopColor="var(--chart-volume-stop)" />
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
            yAxisId="price"
            stroke="var(--chart-axis)"
            style={{
              fontSize: `${activeDimensions.tickFontSize}px`,
              fontWeight: "500",
            }}
            label={
              !isMobile
                ? {
                    value: "Price",
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
            domain={["auto", "auto"]}
            width={isMobile ? 50 : 60}
          />
          <YAxis
            yAxisId="volume"
            orientation="right"
            stroke="var(--chart-axis)"
            style={{
              fontSize: `${activeDimensions.tickFontSize}px`,
              fontWeight: "500",
            }}
            label={
              !isMobile
                ? {
                    value: "Volume",
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
            tickFormatter={formatVolume}
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
              color: "var(--color-market-live)",
              marginBottom: "8px",
              fontSize: `${activeDimensions.fontSize}px`,
            }}
            formatter={(value: any, name: string | number | undefined) => {
              if (name === "volume") {
                return [new Intl.NumberFormat().format(value), "Volume"];
              }
              const nameStr = String(name ?? "");
              const label = nameStr
                ? nameStr.charAt(0).toUpperCase() + nameStr.slice(1)
                : "";
              return [Number(value).toFixed(2), label];
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
            yAxisId="volume"
            dataKey="volume"
            fill="url(#volumeGradient)"
            name="Volume"
            radius={[4, 4, 0, 0]}
          />
          <Line
            yAxisId="price"
            type="monotone"
            dataKey="close"
            stroke="var(--color-market-live)"
            strokeWidth={isMobile ? 2 : 2.5}
            dot={false}
            name="Close"
            activeDot={{
              r: isMobile ? 4 : 6,
              fill: "var(--color-market-live)",
              stroke: "var(--chart-label)",
              strokeWidth: 2,
            }}
          />
          <Line
            yAxisId="price"
            type="monotone"
            dataKey="high"
            stroke="var(--color-trade-buy)"
            strokeWidth={isMobile ? 1 : 1.5}
            dot={false}
            name="High"
            strokeDasharray="5 5"
            activeDot={{
              r: isMobile ? 3 : 5,
              fill: "var(--color-trade-buy)",
              stroke: "var(--chart-label)",
              strokeWidth: 2,
            }}
          />
          <Line
            yAxisId="price"
            type="monotone"
            dataKey="low"
            stroke="var(--color-trade-sell)"
            strokeWidth={isMobile ? 1 : 1.5}
            dot={false}
            name="Low"
            strokeDasharray="5 5"
            activeDot={{
              r: isMobile ? 3 : 5,
              fill: "var(--color-trade-sell)",
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
      title={`${symbol} - Price Chart`}
      subtitle={`${data.length} data points`}
      fullscreenChildren={renderChart(true)}
    >
      {renderChart(false)}
    </ResponsiveChartContainer>
  );
};
