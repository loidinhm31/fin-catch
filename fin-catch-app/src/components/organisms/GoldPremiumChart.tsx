import React from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { GoldPremiumPoint } from "../../types";
import { formatTimestampForChart } from "../../utils/dateUtils";

export interface GoldPremiumChartProps {
  data: GoldPremiumPoint[];
  showFullChart?: boolean;
}

export const GoldPremiumChart: React.FC<GoldPremiumChartProps> = ({ data, showFullChart = false }) => {
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
    exchange_rate: point.exchange_rate,
    gold_type: point.gold_type,
  }));

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-EN", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format percentage
  const formatPercent = (value: number) => {
    return value.toFixed(2) + "%";
  };

  // If current date only mode, show compact badge view instead of chart
  if (!showFullChart && displayData.length > 0) {
    const point = displayData[0];
    const isPremiumPositive = point.premium_rate > 0;

    return (
      <div className="w-full">
        {/* Compact Premium Rate Badge */}
        <div className={`p-4 rounded-xl mb-3 ${isPremiumPositive ? 'bg-gradient-to-r from-yellow-100 to-orange-100' : 'bg-gradient-to-r from-blue-100 to-cyan-100'} border-2 ${isPremiumPositive ? 'border-yellow-300' : 'border-blue-300'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span style={{ fontSize: 'var(--text-xs)', opacity: 0.7 }}>Premium:</span>
              <span style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', color: isPremiumPositive ? '#f59e0b' : '#0ea5e9' }}>
                {isPremiumPositive ? '+' : ''}{formatPercent(point.premium_rate)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 'var(--text-sm)', opacity: 0.7 }}>{formatCurrency(point.premium_value)} VND</span>
              <span style={{ fontSize: 'var(--text-xl)' }}>{isPremiumPositive ? '📈' : '📉'}</span>
            </div>
          </div>
        </div>

        {/* Compact Price Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {/* Target Price */}
          <div className="glass-card p-3">
            <p style={{ fontSize: 'var(--text-xs)', opacity: 0.6, marginBottom: '4px' }}>Local Target</p>
            <p style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-bold)', color: '#fb923c' }}>
              {formatCurrency(point.target_price)}
            </p>
          </div>

          {/* Market Price VND */}
          <div className="glass-card p-3">
            <p style={{ fontSize: 'var(--text-xs)', opacity: 0.6, marginBottom: '4px' }}>Market (VND)</p>
            <p style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-bold)', color: '#10B981' }}>
              {formatCurrency(point.market_price_vnd)}
            </p>
          </div>

          {/* Market Price USD */}
          <div className="glass-card p-3">
            <p style={{ fontSize: 'var(--text-xs)', opacity: 0.6, marginBottom: '4px' }}>Market (USD)</p>
            <p style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-bold)' }}>
              ${point.market_price_usd.toFixed(2)}/oz
            </p>
          </div>

          {/* Exchange Rate */}
          <div className="glass-card p-3">
            <p style={{ fontSize: 'var(--text-xs)', opacity: 0.6, marginBottom: '4px' }}>Exch Rate</p>
            <p style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-bold)' }}>
              {point.exchange_rate.toFixed(0)}
            </p>
          </div>
        </div>

        {/* Timestamp & Gold Type */}
        <div className="mt-2 flex justify-between items-center" style={{ fontSize: 'var(--text-xs)', opacity: 0.6 }}>
          <span>{point.gold_type}</span>
          <span>{new Date(point.timestamp * 1000).toLocaleString()}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', color: 'var(--cube-gray-900)' }}>
            Gold Premium Chart
          </h3>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--cube-gray-900)', opacity: 0.7 }}>
            {data.length} data points
          </p>
        </div>
      </div>

      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={4}
        centerOnInit
        wheel={{ step: 0.1 }}
        doubleClick={{ mode: "zoomIn" }}
        panning={{ velocityDisabled: true }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <div className="relative">
            {/* Zoom Controls */}
            {showFullChart && (
              <div className="absolute top-2 right-2 z-10 flex flex-col gap-2">
                <button
                  onClick={() => zoomIn()}
                  className="glass-button p-2 rounded-lg"
                  title="Zoom In"
                >
                  <ZoomIn className="w-5 h-5" style={{ color: 'var(--cube-yellow)' }} />
                </button>
                <button
                  onClick={() => zoomOut()}
                  className="glass-button p-2 rounded-lg"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-5 h-5" style={{ color: 'var(--cube-yellow)' }} />
                </button>
                <button
                  onClick={() => resetTransform()}
                  className="glass-button p-2 rounded-lg"
                  title="Reset Zoom"
                >
                  <Maximize2 className="w-5 h-5" style={{ color: 'var(--cube-yellow)' }} />
                </button>
              </div>
            )}

            {/* Chart with Zoom/Pan */}
            <TransformComponent
              wrapperStyle={{
                width: "100%",
                height: showFullChart ? "400px" : "300px",
                cursor: showFullChart ? "grab" : "default",
              }}
              contentStyle={{
                width: "100%",
                height: "100%",
              }}
            >
              <ResponsiveContainer width="100%" height={showFullChart ? 400 : 300}>
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#facc15" opacity={0.2} />
                  <XAxis
                    dataKey="time"
                    stroke="#111827"
                    style={{ fontSize: "12px", fontWeight: "600" }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke="#111827"
                    style={{ fontSize: "12px", fontWeight: "600" }}
                    label={{ value: "Price (VND)", angle: -90, position: "insideLeft", style: { fill: '#111827', fontWeight: 'bold' } }}
                    tickFormatter={formatCurrency}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#111827"
                    style={{ fontSize: "12px", fontWeight: "600" }}
                    label={{ value: "Premium (%)", angle: 90, position: "insideRight", style: { fill: '#111827', fontWeight: 'bold' } }}
                    tickFormatter={(value) => value.toFixed(1) + "%"}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      border: "2px solid #facc15",
                      borderRadius: "12px",
                      color: "#111827",
                      fontWeight: "600",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
                    }}
                    formatter={(value: any, name: string) => {
                      if (name === "premium_rate") {
                        return [formatPercent(Number(value)), "Premium Rate"];
                      } else if (name === "target_price") {
                        return [formatCurrency(Number(value)) + " VND", "Target Price"];
                      } else if (name === "market_price_vnd") {
                        return [formatCurrency(Number(value)) + " VND", "Market Price (VND)"];
                      }
                      return [value, name];
                    }}
                    labelFormatter={(label) => `Time: ${label}`}
                  />
                  <Legend wrapperStyle={{ fontWeight: "bold" }} />
                  <Bar
                    yAxisId="right"
                    dataKey="premium_rate"
                    fill="#facc15"
                    opacity={0.8}
                    name="Premium Rate (%)"
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="target_price"
                    stroke="#fb923c"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#fb923c" }}
                    name="Target Price"
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="market_price_vnd"
                    stroke="#10B981"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#10B981" }}
                    name="Market Price (VND)"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </TransformComponent>

            {/* Instructions */}
            {showFullChart && (
              <p style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--cube-gray-900)',
                opacity: 0.6,
                marginTop: 'var(--space-2)',
                textAlign: 'center'
              }}>
                Drag to pan • Scroll to zoom • Double-click to zoom in • Pinch on mobile
              </p>
            )}
          </div>
        )}
      </TransformWrapper>
    </div>
  );
};
