import React from "react";
import { ChevronDown, ChevronUp, Edit, Trash2 } from "lucide-react";
import {
  convertToGrams,
  CurrencyCode,
  EntryPerformance,
  getUnitLabel,
  PortfolioEntry,
} from "@fin-catch/shared";

export interface GoldHoldingCardProps {
  entryPerf: EntryPerformance;
  displayCurrency: CurrencyCode;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: (entry: PortfolioEntry) => void;
  onDelete: (entryId: string) => void;
  formatCurrency: (value: number, currency?: CurrencyCode) => string;
  formatPercentage: (value: number) => string;
  formatDate: (timestamp: number) => string;
}

export const GoldHoldingCard: React.FC<GoldHoldingCardProps> = ({
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

  return (
    <div className="glass-card cyber-grid-bg p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="cyber-terminal-header px-2 py-0.5 rounded border"
              style={{
                backgroundColor: "rgba(250, 204, 21, 0.1)",
                borderColor: "var(--color-amber-400)",
              }}
            >
              GOLD
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
              className="cyber-glow-yellow font-mono"
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
                Quantity {entry.unit ? `(${getUnitLabel(entry.unit)})` : ""}
              </p>
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-medium)",
                  color: "var(--color-text-primary)",
                }}
              >
                {entry.quantity}
                {entry.unit && (
                  <span
                    style={{
                      fontSize: "var(--text-xs)",
                      color: "var(--color-text-muted)",
                      marginLeft: "var(--space-1)",
                    }}
                  >
                    ({convertToGrams(entry.quantity, entry.unit).toFixed(2)}g)
                  </span>
                )}
              </p>
            </div>
            <div>
              <p
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--color-text-muted)",
                }}
              >
                Purchase Price per {entry.unit || "unit"} ({displayCurrency})
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
                Current Price per {entry.unit || "unit"} ({displayCurrency})
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
          {entry.goldType && (
            <div>
              <p
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--color-text-muted)",
                }}
              >
                Gold Type
              </p>
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-medium)",
                  color: "var(--color-text-primary)",
                }}
              >
                {entry.goldType}
              </p>
            </div>
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
