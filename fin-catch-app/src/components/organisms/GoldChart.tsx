import React from "react";
import {TransformComponent, TransformWrapper} from "react-zoom-pan-pinch";
import {Maximize2, ZoomIn, ZoomOut} from "lucide-react";
import {CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,} from "recharts";
import {GoldPricePoint} from "../../types";
import {formatTimestampForChart} from "../../utils/dateUtils";

export interface GoldChartProps {
  data: GoldPricePoint[];
  goldPriceId: string;
}

export const GoldChart: React.FC<GoldChartProps> = ({ data, goldPriceId }) => {
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

  console.log('ch', chartData)
  // Format currency
  const formatCurrency = (value: number) => {
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
            Gold Price Chart - {goldPriceId}
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
                <LineChart data={chartData}>
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
                    stroke="#111827"
                    style={{ fontSize: "12px", fontWeight: "600" }}
                    label={{ value: "Price (VND)", angle: -90, position: "insideLeft", style: { fill: '#111827', fontWeight: 'bold' } }}
                    tickFormatter={formatCurrency}
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
                      return [formatCurrency(Number(value)) + " VND", name];
                    }}
                    labelFormatter={(label) => `Time: ${label}`}
                  />
                  <Legend wrapperStyle={{ fontWeight: "bold" }} />
                  <Line
                    type="monotone"
                    dataKey="buy"
                    stroke="#10B981"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#10B981" }}
                    name="Buy Price"
                  />
                  <Line
                    type="monotone"
                    dataKey="sell"
                    stroke="#fb923c"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#fb923c" }}
                    name="Sell Price"
                  />
                </LineChart>
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
