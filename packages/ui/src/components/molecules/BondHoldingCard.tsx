import React from "react";
import { ChevronDown, ChevronUp, Edit, Trash2 } from "lucide-react";
import {
  CurrencyCode,
  EntryPerformance,
  PortfolioEntry,
} from "@fin-catch/shared";
import { CouponPaymentsSection } from "./CouponPaymentsSection";

export interface BondHoldingCardProps {
  entryPerf: EntryPerformance;
  displayCurrency: CurrencyCode;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: (entry: PortfolioEntry) => void;
  onDelete: (entryId: string) => void;
  onPaymentsChange?: () => void;
  formatCurrency: (value: number, currency?: CurrencyCode) => string;
  formatPercentage: (value: number) => string;
  formatDate: (timestamp: number) => string;
}

export const BondHoldingCard: React.FC<BondHoldingCardProps> = ({
  entryPerf,
  displayCurrency,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onPaymentsChange,
  formatCurrency,
  formatPercentage,
  formatDate,
}) => {
  const entry = entryPerf.entry;
  const isPositive = entryPerf.gainLoss >= 0;

  return (
    <div className="glass-card cyber-grid-bg p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="cyber-terminal-header px-2 py-0.5 rounded border"
              style={{
                backgroundColor: "rgba(168, 85, 247, 0.1)",
                borderColor: "var(--color-violet-500)",
              }}
            >
              BOND
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
            <h3
              className="cyber-glow-purple font-mono"
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
                  color: "var(--color-text-muted)",
                  marginBottom: "2px",
                }}
              >
                Current Value
              </p>
              <p
                className="cyber-data"
                style={{
                  fontWeight: "var(--font-bold)",
                  color: "var(--color-text-primary)",
                }}
              >
                {formatCurrency(entryPerf.currentValue)}
              </p>
            </div>
            <div>
              <p
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--color-text-muted)",
                  marginBottom: "2px",
                }}
              >
                P&L
              </p>
              <p
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
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--color-text-muted)",
                }}
              >
                Quantity (bonds)
              </p>
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-medium)",
                  color: "var(--color-text-primary)",
                }}
              >
                {entry.quantity}
              </p>
            </div>
            <div>
              <p
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--color-text-muted)",
                }}
              >
                Purchase Price per bond ({displayCurrency})
              </p>
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-medium)",
                  color: "var(--color-text-primary)",
                }}
              >
                {formatCurrency(entryPerf.purchasePrice || 0)}
              </p>
            </div>
            <div>
              <p
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--color-text-muted)",
                }}
              >
                Current Price per bond ({displayCurrency})
              </p>
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-medium)",
                  color: "var(--color-text-primary)",
                }}
              >
                {formatCurrency(entryPerf.currentPrice)}
              </p>
            </div>
            <div>
              <p
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--color-text-muted)",
                }}
              >
                Purchase Date
              </p>
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-medium)",
                  color: "var(--color-text-primary)",
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
                      color: "var(--color-text-muted)",
                    }}
                  >
                    Exchange Rate
                  </p>
                  <p
                    style={{
                      fontSize: "var(--text-sm)",
                      fontWeight: "var(--font-medium)",
                      color: "var(--color-text-primary)",
                    }}
                  >
                    1 {entry.currency} = {entryPerf.exchangeRate.toFixed(4)}{" "}
                    {displayCurrency}
                  </p>
                </div>
              )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--color-text-muted)",
                }}
              >
                Face Value
              </p>
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-medium)",
                  color: "var(--color-text-primary)",
                }}
              >
                {entry.faceValue
                  ? formatCurrency(entry.faceValue, entry.currency)
                  : "N/A"}
              </p>
            </div>
            <div>
              <p
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--color-text-muted)",
                }}
              >
                Coupon Rate
              </p>
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-medium)",
                  color: "var(--color-text-primary)",
                }}
              >
                {entry.couponRate ? `${entry.couponRate.toFixed(2)}%` : "N/A"}
              </p>
            </div>
            <div>
              <p
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--color-text-muted)",
                }}
              >
                Maturity Date
              </p>
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-medium)",
                  color: "var(--color-text-primary)",
                }}
              >
                {entry.maturityDate ? formatDate(entry.maturityDate) : "N/A"}
              </p>
            </div>
            <div>
              <p
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--color-text-muted)",
                }}
              >
                Frequency
              </p>
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-medium)",
                  color: "var(--color-text-primary)",
                }}
              >
                {entry.couponFrequency
                  ? entry.couponFrequency.charAt(0).toUpperCase() +
                    entry.couponFrequency.slice(1)
                  : "N/A"}
              </p>
            </div>
            {entry.currentMarketPrice && (
              <div className="col-span-2">
                <p
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--color-text-muted)",
                  }}
                >
                  Current Market Price (Manual)
                </p>
                <p
                  style={{
                    fontSize: "var(--text-sm)",
                    fontWeight: "var(--font-medium)",
                    color: "var(--color-text-primary)",
                  }}
                >
                  {formatCurrency(entry.currentMarketPrice, entry.currency)}
                  {entry.lastPriceUpdate && (
                    <span
                      style={{
                        fontSize: "var(--text-xs)",
                        color: "var(--color-text-muted)",
                        marginLeft: "4px",
                      }}
                    >
                      (Updated: {formatDate(entry.lastPriceUpdate)})
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Coupon Payments Section */}
          {entry.id && (
            <CouponPaymentsSection
              entryId={entry.id}
              entryCurrency={entry.currency || "USD"}
              displayCurrency={displayCurrency}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              onPaymentsChange={onPaymentsChange}
            />
          )}

          {entry.notes && (
            <div>
              <p
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--color-text-muted)",
                }}
              >
                Notes
              </p>
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  color: "var(--color-text-primary)",
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
                  color: "var(--color-text-muted)",
                }}
              >
                Tags
              </p>
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  color: "var(--color-text-primary)",
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
