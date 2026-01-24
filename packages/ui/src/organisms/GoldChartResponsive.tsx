import React, { useState } from "react";
import {
  Brush,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatTimestampForChart, GoldPricePoint } from "@fin-catch/shared";
import {
  calculateXAxisInterval,
  formatCurrencyCompact,
  formatCurrencyValue,
} from "@fin-catch/ui/utils";
import { useResponsiveChart } from "@fin-catch/ui/hooks";
import { ResponsiveChartContainer } from "@fin-catch/ui/molecules";

export interface GoldChartResponsiveProps {
  data: GoldPricePoint[];
  goldPriceId: string;
}

export const GoldChartResponsive: React.FC<GoldChartResponsiveProps> = ({
  data,
  goldPriceId,
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
  const chartData = data.map((point) => ({
    time: formatTimestampForChart(point.timestamp, "1D"),
    timestamp: point.timestamp,
    buy: point.buy,
    sell: point.sell,
    type: point.type_name,
    branch: point.branch_name || "N/A",
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
        <LineChart
          data={chartData}
          margin={{
            top: 5,
            right: activeDimensions.marginRight,
            left: activeDimensions.marginLeft,
            bottom: activeDimensions.marginBottom,
          }}
        >
          <defs>
            <linearGradient id="goldBuyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ffaa00" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#ffaa00" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="goldSellGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00ff88" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#00ff88" stopOpacity={0.1} />
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
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(26, 31, 58, 0.95)",
              border: "1px solid rgba(255, 170, 0, 0.3)",
              borderRadius: "12px",
              color: "#ffffff",
              fontWeight: "600",
              fontSize: `${activeDimensions.fontSize}px`,
              boxShadow:
                "0 8px 24px rgba(0, 0, 0, 0.3), 0 0 24px rgba(255, 170, 0, 0.2)",
              backdropFilter: "blur(12px)",
            }}
            labelStyle={{
              color: "#ffaa00",
              marginBottom: "8px",
              fontSize: `${activeDimensions.fontSize}px`,
            }}
            formatter={(value: any, name: string | number | undefined) => {
              const label = name === "buy" ? "Buy Price" : "Sell Price";
              return [formatCurrencyValue(Number(value)) + " VND", label];
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
          <Line
            type="monotone"
            dataKey="buy"
            stroke="#ffaa00"
            strokeWidth={isMobile ? 2 : 2.5}
            dot={false}
            name="Buy Price"
            activeDot={{
              r: isMobile ? 4 : 6,
              fill: "#ffaa00",
              stroke: "#ffffff",
              strokeWidth: 2,
            }}
          />
          <Line
            type="monotone"
            dataKey="sell"
            stroke="#00ff88"
            strokeWidth={isMobile ? 2 : 2.5}
            dot={false}
            name="Sell Price"
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
        </LineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <ResponsiveChartContainer
      title={`Gold Price - ${goldPriceId}`}
      subtitle={`${data.length} data points`}
      fullscreenChildren={renderChart(true)}
    >
      {renderChart(false)}
    </ResponsiveChartContainer>
  );
};
