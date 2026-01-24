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
import { ResponsiveChartContainer } from "@fin-catch/ui/molecules";

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
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
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

  const handleBrushChange = (newIndex: any) => {
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
              <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#00d4ff" stopOpacity={0.1} />
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
            yAxisId="price"
            stroke="#a0aec0"
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
                      fill: "#ffffff",
                      fontWeight: "600",
                      fontSize: `${activeDimensions.labelFontSize}px`,
                    },
                  }
                : undefined
            }
            tickFormatter={formatCurrencyCompact}
            tick={{ fill: "#a0aec0" }}
            domain={["auto", "auto"]}
            width={isMobile ? 50 : 60}
          />
          <YAxis
            yAxisId="volume"
            orientation="right"
            stroke="#a0aec0"
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
                      fill: "#ffffff",
                      fontWeight: "600",
                      fontSize: `${activeDimensions.labelFontSize}px`,
                    },
                  }
                : undefined
            }
            tickFormatter={formatVolume}
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
                color: "#ffffff",
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
            stroke="#00d4ff"
            strokeWidth={isMobile ? 2 : 2.5}
            dot={false}
            name="Close"
            activeDot={{
              r: isMobile ? 4 : 6,
              fill: "#00d4ff",
              stroke: "#ffffff",
              strokeWidth: 2,
            }}
          />
          <Line
            yAxisId="price"
            type="monotone"
            dataKey="high"
            stroke="#00ff88"
            strokeWidth={isMobile ? 1 : 1.5}
            dot={false}
            name="High"
            strokeDasharray="5 5"
            activeDot={{
              r: isMobile ? 3 : 5,
              fill: "#00ff88",
              stroke: "#ffffff",
              strokeWidth: 2,
            }}
          />
          <Line
            yAxisId="price"
            type="monotone"
            dataKey="low"
            stroke="#ff3366"
            strokeWidth={isMobile ? 1 : 1.5}
            dot={false}
            name="Low"
            strokeDasharray="5 5"
            activeDot={{
              r: isMobile ? 3 : 5,
              fill: "#ff3366",
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
      title={`${symbol} - Price Chart`}
      subtitle={`${data.length} data points`}
      fullscreenChildren={renderChart(true)}
    >
      {renderChart(false)}
    </ResponsiveChartContainer>
  );
};
