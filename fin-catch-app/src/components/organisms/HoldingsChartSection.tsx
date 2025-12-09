import React from "react";
import { BarChart3 } from "lucide-react";
import { PortfolioHoldingsPerformance } from "@/types";
import { HoldingsPerformanceChartResponsive } from "@/components/organisms/HoldingsPerformanceChartResponsive";

export interface HoldingsChartSectionProps {
  showChart: boolean;
  isLoading: boolean;
  data: PortfolioHoldingsPerformance | null;
  timeframe: "1M" | "3M" | "6M" | "1Y" | "ALL";
  onShowChart: () => void;
  onHideChart: () => void;
  onTimeframeChange: (timeframe: "1M" | "3M" | "6M" | "1Y" | "ALL") => void;
}

export const HoldingsChartSection: React.FC<HoldingsChartSectionProps> = ({
  showChart,
  isLoading,
  data,
  timeframe,
  onShowChart,
  onHideChart,
  onTimeframeChange,
}) => {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2
          style={{
            fontSize: "var(--text-xl)",
            fontWeight: "var(--font-bold)",
            color: "var(--cube-gray-900)",
          }}
        >
          Holdings Performance
        </h2>
        {!showChart && (
          <button
            onClick={onShowChart}
            className="bg-gradient-to-r from-purple-300 to-pink-600 text-white px-4 py-2 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
            style={{ fontSize: "var(--text-sm)" }}
          >
            <BarChart3 className="w-4 h-4" />
            SHOW CHART
          </button>
        )}
      </div>

      {showChart && (
        <div className="glass-card p-6">
          {/* Timeframe Controls */}
          <div className="mb-4">
            <h3
              style={{
                fontSize: "var(--text-sm)",
                fontWeight: "var(--font-medium)",
                color: "var(--cube-gray-900)",
                opacity: 0.7,
                marginBottom: "var(--space-2)",
              }}
            >
              Timeframe
            </h3>
            <div className="flex flex-wrap gap-2">
              {(["1M", "3M", "6M", "1Y", "ALL"] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => onTimeframeChange(tf)}
                  className={`px-3 py-2 rounded-lg font-bold transition-all ${
                    timeframe === tf
                      ? "bg-gradient-to-r from-cyan-400 to-blue-600 text-white shadow-md"
                      : "glass-button"
                  }`}
                  style={{ fontSize: "var(--text-xs)" }}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          {/* Holdings Performance Chart */}
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  color: "var(--cube-gray-900)",
                  marginTop: "var(--space-4)",
                }}
              >
                Loading holdings performance...
              </p>
            </div>
          ) : data ? (
            <HoldingsPerformanceChartResponsive data={data} resolution="1D" />
          ) : (
            <div className="p-12 text-center">
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  color: "var(--cube-gray-900)",
                  opacity: 0.7,
                }}
              >
                No holdings performance data available
              </p>
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <button
              onClick={onHideChart}
              className="glass-button px-4 py-2 rounded-xl font-bold transition-all"
              style={{ fontSize: "var(--text-sm)" }}
            >
              HIDE CHART
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
