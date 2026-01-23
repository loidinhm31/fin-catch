import React from "react";
import {
  ChevronDown,
  ChevronUp,
  Edit,
  Trash2,
  Bell,
  BellOff,
} from "lucide-react";
import { CurrencyCode, EntryPerformance, PortfolioEntry } from "../types";

export interface StockHoldingCardProps {
  entryPerf: EntryPerformance;
  displayCurrency: CurrencyCode;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: (entry: PortfolioEntry) => void;
  onDelete: (entryId: string) => void;
  formatCurrency: (value: number, currency?: CurrencyCode) => string;
  formatPercentage: (value: number) => string;
  formatDate: (timestamp: number) => string;
  // Note: onResetAlert removed - alert state now managed by qm-sync server
}

export const StockHoldingCard: React.FC<StockHoldingCardProps> = ({
  entryPerf,
  displayCurrency,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  formatCurrency,
  formatPercentage,
  formatDate,
}) => {
  const entry = entryPerf.entry;
  const isPositive = entryPerf.gain_loss >= 0;

  // Alert status helpers
  const hasAlerts = entry.target_price || entry.stop_loss;
  const alertsEnabled = entry.alert_enabled !== false;
  // Note: alert_triggered state now managed by qm-sync server
  // Triggered alerts are shown via PriceAlertToast component

  // Calculate distance to thresholds
  const currentPrice = entryPerf.current_price;
  const targetDistance = entry.target_price
    ? ((entry.target_price - currentPrice) / currentPrice) * 100
    : null;
  const stopLossDistance = entry.stop_loss
    ? ((entry.stop_loss - currentPrice) / currentPrice) * 100
    : null;

  return (
    <div className="glass-card p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold"
              style={{
                backgroundColor: "#dbeafe",
                color: "#1e40af",
              }}
            >
              STOCK
            </span>
            {entry.currency && (
              <span
                className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold"
                style={{
                  backgroundColor:
                    entry.currency === displayCurrency ? "#d1fae5" : "#fce7f3",
                  color:
                    entry.currency === displayCurrency ? "#065f46" : "#9f1239",
                }}
              >
                {entry.currency}
              </span>
            )}
            {/* Alert indicator badges */}
            {hasAlerts && (
              <>
                {alertsEnabled ? (
                  <span title="Alerts enabled - monitored by server">
                    <Bell className="w-4 h-4" style={{ color: "#6b7280" }} />
                  </span>
                ) : (
                  <span title="Alerts disabled">
                    <BellOff className="w-4 h-4" style={{ color: "#d1d5db" }} />
                  </span>
                )}
              </>
            )}
            <h3
              style={{
                fontSize: "var(--text-lg)",
                fontWeight: "var(--font-bold)",
                color: "var(--cube-gray-900)",
              }}
            >
              {entry.symbol}
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--cube-gray-500)",
                  marginBottom: "2px",
                }}
              >
                Current Value
              </p>
              <p
                style={{
                  fontWeight: "var(--font-bold)",
                  color: "var(--cube-gray-900)",
                }}
              >
                {formatCurrency(entryPerf.current_value)}
              </p>
            </div>
            <div>
              <p
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--cube-gray-500)",
                  marginBottom: "2px",
                }}
              >
                P&L
              </p>
              <p
                style={{
                  fontWeight: "var(--font-bold)",
                  color: isPositive ? "#10b981" : "#ef4444",
                }}
              >
                {formatCurrency(entryPerf.gain_loss)}
              </p>
              <p
                style={{
                  fontSize: "var(--text-xs)",
                  color: isPositive ? "#10b981" : "#ef4444",
                }}
              >
                {formatPercentage(entryPerf.gain_loss_percentage)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 ml-4">
        <button
          onClick={() => onEdit(entry)}
          className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center hover:bg-blue-200 transition-all"
        >
          <Edit className="w-4 h-4" style={{ color: "#2563eb" }} />
        </button>
        <button
          onClick={() => onDelete(entry.id!)}
          className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center hover:bg-red-200 transition-all"
        >
          <Trash2 className="w-4 h-4" style={{ color: "#dc2626" }} />
        </button>
        <button
          onClick={onToggleExpand}
          className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-all"
        >
          {isExpanded ? (
            <ChevronUp
              className="w-4 h-4"
              style={{ color: "var(--cube-gray-700)" }}
            />
          ) : (
            <ChevronDown
              className="w-4 h-4"
              style={{ color: "var(--cube-gray-700)" }}
            />
          )}
        </button>
      </div>

      {isExpanded && (
        <div
          className="pt-3 border-t space-y-2"
          style={{ borderColor: "rgba(0, 0, 0, 0.1)" }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--cube-gray-500)",
                }}
              >
                Quantity (shares)
              </p>
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-medium)",
                  color: "var(--cube-gray-900)",
                }}
              >
                {entry.quantity}
              </p>
            </div>
            <div>
              <p
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--cube-gray-500)",
                }}
              >
                Purchase Price per share ({displayCurrency})
              </p>
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-medium)",
                  color: "var(--cube-gray-900)",
                }}
              >
                {formatCurrency(entryPerf.purchase_price || 0)}
              </p>
            </div>
            <div>
              <p
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--cube-gray-500)",
                }}
              >
                Current Price per share ({displayCurrency})
              </p>
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-medium)",
                  color: "var(--cube-gray-900)",
                }}
              >
                {formatCurrency(entryPerf.current_price)}
              </p>
            </div>
            <div>
              <p
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--cube-gray-500)",
                }}
              >
                Purchase Date
              </p>
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-medium)",
                  color: "var(--cube-gray-900)",
                }}
              >
                {formatDate(entry.purchase_date)}
              </p>
            </div>
            {entry.currency &&
              entry.currency !== displayCurrency &&
              entryPerf.exchange_rate && (
                <div className="col-span-2">
                  <p
                    style={{
                      fontSize: "var(--text-xs)",
                      color: "var(--cube-gray-500)",
                    }}
                  >
                    Exchange Rate
                  </p>
                  <p
                    style={{
                      fontSize: "var(--text-sm)",
                      fontWeight: "var(--font-medium)",
                      color: "var(--cube-gray-900)",
                    }}
                  >
                    1 {entry.currency} = {entryPerf.exchange_rate.toFixed(4)}{" "}
                    {displayCurrency}
                  </p>
                </div>
              )}
          </div>

          {/* Price Alerts Section */}
          {hasAlerts && (
            <div
              className="p-3 rounded-lg"
              style={{
                backgroundColor: "#f9fafb",
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <p
                  style={{
                    fontSize: "var(--text-xs)",
                    fontWeight: "var(--font-medium)",
                    color: "var(--cube-gray-700)",
                  }}
                >
                  Price Alerts
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {entry.target_price && (
                  <div>
                    <p
                      style={{
                        fontSize: "var(--text-xs)",
                        color: "var(--cube-gray-500)",
                      }}
                    >
                      🎯 Target Price
                    </p>
                    <p
                      style={{
                        fontSize: "var(--text-sm)",
                        fontWeight: "var(--font-medium)",
                        color: "var(--cube-gray-900)",
                      }}
                    >
                      {formatCurrency(entry.target_price)}
                      {targetDistance !== null && (
                        <span
                          style={{
                            fontSize: "var(--text-xs)",
                            color: targetDistance > 0 ? "#6b7280" : "#065f46",
                            marginLeft: "4px",
                          }}
                        >
                          ({targetDistance > 0 ? "+" : ""}
                          {targetDistance.toFixed(1)}%)
                        </span>
                      )}
                    </p>
                  </div>
                )}
                {entry.stop_loss && (
                  <div>
                    <p
                      style={{
                        fontSize: "var(--text-xs)",
                        color: "var(--cube-gray-500)",
                      }}
                    >
                      🛑 Stop Loss
                    </p>
                    <p
                      style={{
                        fontSize: "var(--text-sm)",
                        fontWeight: "var(--font-medium)",
                        color: "var(--cube-gray-900)",
                      }}
                    >
                      {formatCurrency(entry.stop_loss)}
                      {stopLossDistance !== null && (
                        <span
                          style={{
                            fontSize: "var(--text-xs)",
                            color: stopLossDistance < 0 ? "#6b7280" : "#991b1b",
                            marginLeft: "4px",
                          }}
                        >
                          ({stopLossDistance > 0 ? "+" : ""}
                          {stopLossDistance.toFixed(1)}%)
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {entry.notes && (
            <div>
              <p
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--cube-gray-500)",
                }}
              >
                Notes
              </p>
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  color: "var(--cube-gray-900)",
                }}
              >
                {entry.notes}
              </p>
            </div>
          )}
          {entry.tags && (
            <div>
              <p
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--cube-gray-500)",
                }}
              >
                Tags
              </p>
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  color: "var(--cube-gray-900)",
                }}
              >
                {entry.tags}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
