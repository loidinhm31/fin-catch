import React from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { PortfolioPerformance } from "@fin-catch/shared";

export interface PerformanceSummaryCardProps {
  performance: PortfolioPerformance;
  formatCurrency: (value: number) => string;
  formatPercentage: (value: number) => string;
}

export const PerformanceSummaryCard: React.FC<PerformanceSummaryCardProps> = ({
  performance,
  formatCurrency,
  formatPercentage,
}) => {
  return (
    <div className="mb-6">
      <h2
        style={{
          fontSize: "var(--text-xl)",
          fontWeight: "var(--font-bold)",
          color: "var(--cube-gray-900)",
          marginBottom: "var(--space-4)",
        }}
      >
        Performance
      </h2>
      <div className="glass-card p-6 bg-purple-500/10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p
              style={{
                fontSize: "var(--text-sm)",
                fontWeight: "var(--font-medium)",
                color: "var(--cube-gray-900)",
                opacity: 0.7,
                marginBottom: "var(--space-1)",
              }}
            >
              Total Value
            </p>
            <h2
              style={{
                fontSize: "var(--text-4xl)",
                fontWeight: "var(--font-extrabold)",
                color: "var(--cube-gray-900)",
              }}
            >
              {formatCurrency(performance.totalValue)}
            </h2>
          </div>
          {performance.totalGainLoss >= 0 ? (
            <TrendingUp
              className="w-12 h-12"
              style={{ color: "var(--color-green-500)" }}
            />
          ) : (
            <TrendingDown
              className="w-12 h-12"
              style={{ color: "var(--color-red-500)" }}
            />
          )}
        </div>
        <div
          className="grid grid-cols-2 gap-4 pt-4 border-t"
          style={{ borderColor: "var(--color-black-10)" }}
        >
          <div>
            <p
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--cube-gray-900)",
                opacity: 0.7,
                marginBottom: "var(--space-1)",
              }}
            >
              Gain/Loss
            </p>
            <p
              style={{
                fontSize: "var(--text-lg)",
                fontWeight: "var(--font-bold)",
                color:
                  performance.totalGainLoss >= 0
                    ? "var(--color-green-500)"
                    : "var(--color-red-500)",
              }}
            >
              {formatCurrency(performance.totalGainLoss)}
            </p>
          </div>
          <div>
            <p
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--cube-gray-900)",
                opacity: 0.7,
                marginBottom: "var(--space-1)",
              }}
            >
              Return
            </p>
            <p
              style={{
                fontSize: "var(--text-lg)",
                fontWeight: "var(--font-bold)",
                color:
                  performance.totalGainLossPercentage >= 0
                    ? "var(--color-green-500)"
                    : "var(--color-red-500)",
              }}
            >
              {formatPercentage(performance.totalGainLossPercentage)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
