import React from "react";
import {
  AlertCircle,
  Loader2,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import type { Deal } from "@fin-catch/shared";

/**
 * Props for Holdings component
 */
interface HoldingsProps {
  /** List of deals/holdings */
  deals: Deal[];
  /** Loading state */
  isLoading?: boolean;
  /** Callback to refresh deals */
  onRefresh?: () => void;
  /** Callback when clicking on a deal (for selling) */
  onDealClick?: (deal: Deal) => void;
}

/**
 * Format currency value
 */
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("vi-VN", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Format percentage value
 */
const formatPercent = (value: number): string => {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
};

/**
 * Holdings component
 *
 * Displays current positions with:
 * - Symbol, quantity, cost price, market price
 * - Unrealized P&L with color coding
 * - Click to sell functionality
 */
export const Holdings: React.FC<HoldingsProps> = ({
  deals,
  isLoading = false,
  onRefresh,
  onDealClick,
}) => {
  // Filter to only show open positions with quantity
  const openDeals = deals.filter(
    (d) => d.status === "OPEN" && d.accumulateQuantity > 0,
  );

  // Calculate totals
  const totalCost = openDeals.reduce(
    (sum, d) => sum + d.costPrice * d.accumulateQuantity,
    0,
  );
  const totalMarket = openDeals.reduce(
    (sum, d) => sum + (d.marketPrice || d.costPrice) * d.accumulateQuantity,
    0,
  );
  const totalPnl = totalMarket - totalCost;
  const totalPnlPercent = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

  return (
    <div
      className="rounded-2xl p-6 border"
      style={{
        background: "rgba(26, 31, 58, 0.6)",
        backdropFilter: "blur(16px)",
        borderColor: "rgba(123, 97, 255, 0.2)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3
          className="text-lg font-semibold"
          style={{ color: "var(--color-text-primary)" }}
        >
          Holdings
        </h3>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2 rounded-lg transition-colors hover:bg-white/10 disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw
            className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
            style={{ color: "var(--color-text-secondary)" }}
          />
        </button>
      </div>

      {/* Summary Card */}
      {openDeals.length > 0 && (
        <div
          className="p-4 rounded-xl border mb-4"
          style={{
            background: "rgba(15, 23, 42, 0.5)",
            borderColor: "rgba(123, 97, 255, 0.2)",
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div
                className="text-sm"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Market Value
              </div>
              <div
                className="text-xl font-semibold"
                style={{ color: "var(--color-text-primary)" }}
              >
                {formatCurrency(totalMarket)}
              </div>
            </div>
            <div>
              <div
                className="text-sm"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Unrealized P&L
              </div>
              <div
                className="text-xl font-semibold flex items-center gap-1"
                style={{ color: totalPnl >= 0 ? "#00ff88" : "#ff3366" }}
              >
                {totalPnl >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                {formatCurrency(Math.abs(totalPnl))}
                <span className="text-sm">
                  ({formatPercent(totalPnlPercent)})
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && openDeals.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <Loader2
            className="w-5 h-5 animate-spin"
            style={{ color: "#00d4ff" }}
          />
          <span
            className="ml-2 text-sm"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Loading holdings...
          </span>
        </div>
      ) : openDeals.length === 0 ? (
        <div
          className="text-center py-8"
          style={{ color: "var(--color-text-secondary)" }}
        >
          <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No open positions</p>
        </div>
      ) : (
        <div className="space-y-3">
          {openDeals.map((deal) => {
            const marketValue =
              (deal.marketPrice || deal.costPrice) * deal.accumulateQuantity;
            const costValue = deal.costPrice * deal.accumulateQuantity;
            const pnl = deal.unrealizedPnl ?? marketValue - costValue;
            const pnlPercent =
              deal.unrealizedPnlPercent ??
              (costValue > 0 ? (pnl / costValue) * 100 : 0);
            const isProfit = pnl >= 0;

            return (
              <div
                key={deal.id}
                className="p-4 rounded-xl border cursor-pointer transition-colors hover:bg-white/5"
                style={{
                  background: "rgba(15, 23, 42, 0.5)",
                  borderColor: "rgba(123, 97, 255, 0.2)",
                }}
                onClick={() => onDealClick?.(deal)}
              >
                <div className="flex items-start justify-between">
                  {/* Left: Stock Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="font-semibold"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {deal.symbol}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded"
                        style={{
                          background: "rgba(0, 212, 255, 0.15)",
                          color: "#00d4ff",
                        }}
                      >
                        {deal.side === "NB" ? "LONG" : "SHORT"}
                      </span>
                    </div>

                    <div
                      className="text-sm space-y-1"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      <div className="flex justify-between">
                        <span>Quantity</span>
                        <span style={{ color: "var(--color-text-primary)" }}>
                          {formatCurrency(deal.accumulateQuantity)}
                          {deal.availableQuantity !==
                            deal.accumulateQuantity && (
                            <span style={{ color: "var(--color-text-muted)" }}>
                              {" "}
                              ({formatCurrency(deal.availableQuantity)} avail)
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cost Price</span>
                        <span style={{ color: "var(--color-text-primary)" }}>
                          {formatCurrency(deal.costPrice)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Market Price</span>
                        <span style={{ color: "var(--color-text-primary)" }}>
                          {deal.marketPrice
                            ? formatCurrency(deal.marketPrice)
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: P&L */}
                  <div className="text-right">
                    <div
                      className="text-lg font-semibold flex items-center justify-end gap-1"
                      style={{ color: isProfit ? "#00ff88" : "#ff3366" }}
                    >
                      {isProfit ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      {formatCurrency(Math.abs(pnl))}
                    </div>
                    <div
                      className="text-sm"
                      style={{ color: isProfit ? "#00ff88" : "#ff3366" }}
                    >
                      {formatPercent(pnlPercent)}
                    </div>
                    <div
                      className="text-xs mt-1"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      Value: {formatCurrency(marketValue)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
