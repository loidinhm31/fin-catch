import React from "react";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import { Maximize2, ZoomIn, ZoomOut } from "lucide-react";
import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PortfolioHoldingsPerformance } from "../../types";
import { formatTimestampForChart } from "../../utils/dateUtils";

export interface HoldingsPerformanceChartProps {
  data: PortfolioHoldingsPerformance;
  resolution?: string;
}

export const HoldingsPerformanceChart: React.FC<HoldingsPerformanceChartProps> = ({
  data,
  resolution = "1D",
}) => {
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
    (a, b) => a.timestamp - b.timestamp
  );

  return (
    <div className="w-full">
      <div className="mb-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', color: 'var(--cube-gray-900)' }}>
              Holdings Performance
            </h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--cube-gray-900)', opacity: 0.7 }}>
              Normalized to 100 at each purchase date
            </p>
          </div>
        </div>

        {/* Performance Summary Cards */}
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
                  <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-bold)', color: 'var(--cube-gray-900)' }}>
                    {holding.entry.symbol}
                  </p>
                </div>
                <p style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--font-bold)',
                  color: isPositive ? '#10b981' : '#ef4444'
                }}>
                  {isPositive ? '+' : ''}{holding.current_return.toFixed(2)}%
                </p>
              </div>
            );
          })}
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
                    stroke="#111827"
                    style={{ fontSize: "12px", fontWeight: "600" }}
                    label={{
                      value: "Performance (Base 100)",
                      angle: -90,
                      position: "insideLeft",
                      style: { fill: '#111827', fontWeight: 'bold' }
                    }}
                    domain={['auto', 'auto']}
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
                      const change = ((Number(value) - 100) / 100) * 100;
                      return [
                        `${Number(value).toFixed(2)} (${change >= 0 ? '+' : ''}${change.toFixed(2)}%)`,
                        name
                      ];
                    }}
                  />
                  <Legend wrapperStyle={{ fontWeight: "bold" }} />

                  {/* Render a line for each holding */}
                  {data.holdings.map((holding) => (
                    <Line
                      key={holding.entry.id}
                      type="monotone"
                      dataKey={holding.entry.symbol}
                      stroke={holding.color}
                      strokeWidth={3}
                      dot={false}
                      name={holding.entry.symbol}
                      activeDot={{ r: 6 }}
                      connectNulls
                    />
                  ))}
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
