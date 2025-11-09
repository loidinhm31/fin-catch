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
import { StockCandle } from "../../types";
import { formatTimestampForChart } from "../../utils/dateUtils";

export interface StockChartProps {
  data: StockCandle[];
  resolution: string;
  symbol: string;
}

export const StockChart: React.FC<StockChartProps> = ({ data, resolution, symbol }) => {
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

  // Format volume
  const formatVolume = (value: number) => {
    return new Intl.NumberFormat("en-EN", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="w-full">
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', color: 'var(--cube-gray-900)' }}>
            {symbol} - Price Chart
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
            <div className="absolute top-2 right-2 z-10 flex flex-col gap-2">
              <button
                onClick={() => zoomIn()}
                className="glass-button p-2 rounded-lg"
                title="Zoom In"
              >
                <ZoomIn className="w-5 h-5" style={{ color: 'var(--cube-cyan)' }} />
              </button>
              <button
                onClick={() => zoomOut()}
                className="glass-button p-2 rounded-lg"
                title="Zoom Out"
              >
                <ZoomOut className="w-5 h-5" style={{ color: 'var(--cube-cyan)' }} />
              </button>
              <button
                onClick={() => resetTransform()}
                className="glass-button p-2 rounded-lg"
                title="Reset Zoom"
              >
                <Maximize2 className="w-5 h-5" style={{ color: 'var(--cube-cyan)' }} />
              </button>
            </div>

            {/* Chart with Zoom/Pan */}
            <TransformComponent
              wrapperStyle={{
                width: "100%",
                height: "400px",
                cursor: "grab",
              }}
              contentStyle={{
                width: "100%",
                height: "100%",
              }}
            >
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#22d3ee" opacity={0.2} />
                  <XAxis
                    dataKey="time"
                    stroke="#111827"
                    style={{ fontSize: "12px", fontWeight: "600" }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    yAxisId="price"
                    stroke="#111827"
                    style={{ fontSize: "12px", fontWeight: "600" }}
                    label={{ value: "Price", angle: -90, position: "insideLeft", style: { fill: '#111827', fontWeight: 'bold' } }}
                  />
                  <YAxis
                    yAxisId="volume"
                    orientation="right"
                    stroke="#111827"
                    style={{ fontSize: "12px", fontWeight: "600" }}
                    label={{ value: "Volume", angle: 90, position: "insideRight", style: { fill: '#111827', fontWeight: 'bold' } }}
                    tickFormatter={formatVolume}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      border: "2px solid #22d3ee",
                      borderRadius: "12px",
                      color: "#111827",
                      fontWeight: "600",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
                    }}
                    formatter={(value: any, name: string) => {
                      if (name === "volume") {
                        return [new Intl.NumberFormat().format(value), "Volume"];
                      }
                      return [Number(value).toFixed(2), name.charAt(0).toUpperCase() + name.slice(1)];
                    }}
                  />
                  <Legend wrapperStyle={{ fontWeight: "bold" }} />
                  <Bar
                    yAxisId="volume"
                    dataKey="volume"
                    fill="#22d3ee"
                    opacity={0.3}
                    name="Volume"
                  />
                  <Line
                    yAxisId="price"
                    type="monotone"
                    dataKey="close"
                    stroke="#06B6D4"
                    strokeWidth={3}
                    dot={false}
                    name="Close"
                  />
                  <Line
                    yAxisId="price"
                    type="monotone"
                    dataKey="high"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={false}
                    name="High"
                    strokeDasharray="5 5"
                  />
                  <Line
                    yAxisId="price"
                    type="monotone"
                    dataKey="low"
                    stroke="#fb923c"
                    strokeWidth={2}
                    dot={false}
                    name="Low"
                    strokeDasharray="5 5"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </TransformComponent>

            {/* Instructions */}
            <p style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--cube-gray-900)',
              opacity: 0.6,
              marginTop: 'var(--space-2)',
              textAlign: 'center'
            }}>
              Drag to pan • Scroll to zoom • Double-click to zoom in • Pinch on mobile
            </p>
          </div>
        )}
      </TransformWrapper>
    </div>
  );
};
