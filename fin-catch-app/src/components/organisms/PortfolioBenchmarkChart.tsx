import React from "react";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import { Maximize2, ZoomIn, ZoomOut, TrendingUp, TrendingDown } from "lucide-react";
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
import { PortfolioBenchmarkComparison } from "../../types";
import { formatTimestampForChart } from "../../utils/dateUtils";

export interface PortfolioBenchmarkChartProps {
  data: PortfolioBenchmarkComparison;
  resolution?: string;
}

export const PortfolioBenchmarkChart: React.FC<PortfolioBenchmarkChartProps> = ({
  data,
  resolution = "1D",
}) => {
  if (!data || !data.portfolio_data || data.portfolio_data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        No data available
      </div>
    );
  }

  // Combine portfolio and benchmark data by timestamp
  const chartData = data.portfolio_data.map((point, index) => ({
    time: formatTimestampForChart(point.timestamp, resolution),
    timestamp: point.timestamp,
    portfolio: point.value,
    benchmark: data.benchmark_data[index]?.value || 0,
  }));

  const isOutperforming = data.outperformance >= 0;

  return (
    <div className="w-full">
      <div className="mb-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', color: 'var(--cube-gray-900)' }}>
              Portfolio vs {data.benchmark_name}
            </h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--cube-gray-900)', opacity: 0.7 }}>
              Performance comparison (normalized to 100 at start)
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isOutperforming ? (
              <TrendingUp className="w-6 h-6" style={{ color: '#10b981' }} />
            ) : (
              <TrendingDown className="w-6 h-6" style={{ color: '#ef4444' }} />
            )}
          </div>
        </div>

        {/* Performance Summary Cards */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="glass-card p-3">
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--cube-gray-500)', marginBottom: '4px' }}>
              Portfolio Return
            </p>
            <p style={{
              fontSize: 'var(--text-lg)',
              fontWeight: 'var(--font-bold)',
              color: data.portfolio_return >= 0 ? '#10b981' : '#ef4444'
            }}>
              {data.portfolio_return >= 0 ? '+' : ''}{data.portfolio_return.toFixed(2)}%
            </p>
          </div>
          <div className="glass-card p-3">
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--cube-gray-500)', marginBottom: '4px' }}>
              {data.benchmark_name} Return
            </p>
            <p style={{
              fontSize: 'var(--text-lg)',
              fontWeight: 'var(--font-bold)',
              color: data.benchmark_return >= 0 ? '#10b981' : '#ef4444'
            }}>
              {data.benchmark_return >= 0 ? '+' : ''}{data.benchmark_return.toFixed(2)}%
            </p>
          </div>
          <div className="glass-card p-3 bg-gradient-to-br from-pink-50 to-purple-50">
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--cube-gray-500)', marginBottom: '4px' }}>
              Outperformance
            </p>
            <p style={{
              fontSize: 'var(--text-lg)',
              fontWeight: 'var(--font-bold)',
              color: isOutperforming ? '#10b981' : '#ef4444'
            }}>
              {isOutperforming ? '+' : ''}{data.outperformance.toFixed(2)}%
            </p>
          </div>
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
                      const label = name === "portfolio" ? "Portfolio" : data.benchmark_name;
                      const change = ((Number(value) - 100) / 100) * 100;
                      return [
                        `${Number(value).toFixed(2)} (${change >= 0 ? '+' : ''}${change.toFixed(2)}%)`,
                        label
                      ];
                    }}
                  />
                  <Legend wrapperStyle={{ fontWeight: "bold" }} />
                  <Line
                    type="monotone"
                    dataKey="portfolio"
                    stroke="#ec4899"
                    strokeWidth={3}
                    dot={false}
                    name="Portfolio"
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="benchmark"
                    stroke="#06B6D4"
                    strokeWidth={3}
                    dot={false}
                    name={data.benchmark_name}
                    strokeDasharray="5 5"
                    activeDot={{ r: 6 }}
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
