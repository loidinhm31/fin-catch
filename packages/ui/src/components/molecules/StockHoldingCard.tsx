import React from "react";
import {
  Bell,
  BellOff,
  ChevronDown,
  ChevronUp,
  Edit,
  Trash2,
} from "lucide-react";
import {
  CurrencyCode,
  EntryPerformance,
  PortfolioEntry,
} from "@fin-catch/shared";

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
  const isPositive = entryPerf.gainLoss >= 0;

  // Alert status helpers
  const hasAlerts = entry.targetPrice || entry.stopLoss;
  const alertsEnabled = entry.alertEnabled !== false;
  // Note: alert_triggered state now managed by qm-sync server
  // Triggered alerts are shown via PriceAlertToast component

  // Calculate distance to thresholds
  const currentPrice = entryPerf.currentPrice;
  const targetDistance = entry.targetPrice
    ? ((entry.targetPrice - currentPrice) / currentPrice) * 100
    : null;
  const stopLossDistance = entry.stopLoss
    ? ((entry.stopLoss - currentPrice) / currentPrice) * 100
    : null;

  return (
    <div className="glass-card cyber-grid-bg p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="cyber-terminal-header px-2 py-0.5 rounded border"
              style={{
                backgroundColor: "rgba(59, 130, 246, 0.1)",
                borderColor: "#3B82F6",
              }}
            >
              STOCK
            </span>
            {entry.currency && (
              <span
                className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold"
                style={{
                  backgroundColor:
                    entry.currency === displayCurrency
                      ? "var(--color-badge-currency-match-bg)"
                      : "var(--color-badge-currency-diff-bg)",
                  color:
                    entry.currency === displayCurrency
                      ? "var(--color-badge-currency-match-text)"
                      : "var(--color-badge-currency-diff-text)",
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
                    <Bell
                      className="w-4 h-4"
                      style={{ color: "var(--color-text-tertiary)" }}
                    />
                  </span>
                ) : (
                  <span title="Alerts disabled">
                    <BellOff
                      className="w-4 h-4"
                      style={{ color: "var(--color-text-secondary)" }}
                    />
                  </span>
                )}
              </>
            )}
            <h3
              className="cyber-glow-cyan font-mono"
              style={{
                fontSize: "var(--text-lg)",
                fontWeight: "var(--font-bold)",
              }}
            >
              {entry.symbol}
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p
                className="uppercase tracking-wide font-mono"
                style={{
                  fontSize: "var(--text-xs)",
                  color: "#64748B",
                  marginBottom: "2px",
                }}
              >
                Current Value
              </p>
              <p
                className="cyber-data"
                style={{
                  fontWeight: "var(--font-bold)",
                  color: "var(--cube-gray-900)",
                }}
              >
                {formatCurrency(entryPerf.currentValue)}
              </p>
            </div>
            <div>
              <p
                className="uppercase tracking-wide font-mono"
                style={{
                  fontSize: "var(--text-xs)",
                  color: "#64748B",
                  marginBottom: "2px",
                }}
              >
                P&L
              </p>
              <p
                className="cyber-data"
                style={{
                  fontWeight: "var(--font-bold)",
                  color: isPositive
                    ? "var(--color-green-500)"
                    : "var(--color-red-500)",
                }}
              >
                {formatCurrency(entryPerf.gainLoss)}
              </p>
              <p
                className="cyber-data"
                style={{
                  fontSize: "var(--text-xs)",
                  color: isPositive
                    ? "var(--color-green-500)"
                    : "var(--color-red-500)",
                }}
              >
                {formatPercentage(entryPerf.gainLossPercentage)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 ml-4">
        <button
          onClick={() => onEdit(entry)}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
          style={{ backgroundColor: "var(--color-action-edit-bg)" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor =
              "var(--color-action-edit-hover)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor =
              "var(--color-action-edit-bg)")
          }
        >
          <Edit
            className="w-4 h-4"
            style={{ color: "var(--color-action-edit-icon)" }}
          />
        </button>
        <button
          onClick={() => onDelete(entry.id!)}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
          style={{ backgroundColor: "var(--color-action-delete-bg)" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor =
              "var(--color-action-delete-hover)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor =
              "var(--color-action-delete-bg)")
          }
        >
          <Trash2
            className="w-4 h-4"
            style={{ color: "var(--color-action-delete-icon)" }}
          />
        </button>
        <button
          onClick={onToggleExpand}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
          style={{ backgroundColor: "var(--color-action-expand-bg)" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor =
              "var(--color-action-expand-hover)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor =
              "var(--color-action-expand-bg)")
          }
        >
          {isExpanded ? (
            <ChevronUp
              className="w-4 h-4"
              style={{ color: "var(--color-action-expand-icon)" }}
            />
          ) : (
            <ChevronDown
              className="w-4 h-4"
              style={{ color: "var(--color-action-expand-icon)" }}
            />
          )}
        </button>
      </div>

      {isExpanded && (
        <div
          className="pt-3 border-t space-y-2"
          style={{ borderColor: "var(--color-black-10)" }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p
                className="uppercase tracking-wide font-mono"
                style={{
                  fontSize: "var(--text-xs)",
                  color: "#64748B",
                }}
              >
                Quantity (shares)
              </p>
              <p
                className="cyber-data"
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
                className="uppercase tracking-wide font-mono"
                style={{
                  fontSize: "var(--text-xs)",
                  color: "#64748B",
                }}
              >
                Purchase Price ({displayCurrency})
              </p>
              <p
                className="cyber-data"
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-medium)",
                  color: "var(--cube-gray-900)",
                }}
              >
                {formatCurrency(entryPerf.purchasePrice || 0)}
              </p>
            </div>
            <div>
              <p
                className="uppercase tracking-wide font-mono"
                style={{
                  fontSize: "var(--text-xs)",
                  color: "#64748B",
                }}
              >
                Current Price ({displayCurrency})
              </p>
              <p
                className="cyber-data"
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-medium)",
                  color: "var(--cube-gray-900)",
                }}
              >
                {formatCurrency(entryPerf.currentPrice)}
              </p>
            </div>
            <div>
              <p
                className="uppercase tracking-wide font-mono"
                style={{
                  fontSize: "var(--text-xs)",
                  color: "#64748B",
                }}
              >
                Purchase Date
              </p>
              <p
                className="cyber-data"
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-medium)",
                  color: "var(--cube-gray-900)",
                }}
              >
                {formatDate(entry.purchaseDate)}
              </p>
            </div>
            {entry.currency &&
              entry.currency !== displayCurrency &&
              entryPerf.exchangeRate && (
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
                    1 {entry.currency} = {entryPerf.exchangeRate.toFixed(4)}{" "}
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
                backgroundColor: "var(--color-bg-secondary)",
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <p
                  className="uppercase tracking-wide font-mono"
                  style={{
                    fontSize: "var(--text-xs)",
                    fontWeight: "var(--font-medium)",
                    color: "#64748B",
                  }}
                >
                  Price Alerts
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {entry.targetPrice && (
                  <div>
                    <p
                      className="uppercase tracking-wide font-mono"
                      style={{
                        fontSize: "var(--text-xs)",
                        color: "#64748B",
                      }}
                    >
                      🎯 Target Price
                    </p>
                    <p
                      className="cyber-data"
                      style={{
                        fontSize: "var(--text-sm)",
                        fontWeight: "var(--font-medium)",
                        color: "var(--cube-gray-900)",
                      }}
                    >
                      {formatCurrency(entry.targetPrice)}
                      {targetDistance !== null && (
                        <span
                          style={{
                            fontSize: "var(--text-xs)",
                            color:
                              targetDistance > 0
                                ? "var(--color-text-tertiary)"
                                : "#065f46",
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
                {entry.stopLoss && (
                  <div>
                    <p
                      className="uppercase tracking-wide font-mono"
                      style={{
                        fontSize: "var(--text-xs)",
                        color: "#64748B",
                      }}
                    >
                      🛑 Stop Loss
                    </p>
                    <p
                      className="cyber-data"
                      style={{
                        fontSize: "var(--text-sm)",
                        fontWeight: "var(--font-medium)",
                        color: "var(--cube-gray-900)",
                      }}
                    >
                      {formatCurrency(entry.stopLoss)}
                      {stopLossDistance !== null && (
                        <span
                          style={{
                            fontSize: "var(--text-xs)",
                            color:
                              stopLossDistance < 0
                                ? "var(--color-text-tertiary)"
                                : "#991b1b",
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
