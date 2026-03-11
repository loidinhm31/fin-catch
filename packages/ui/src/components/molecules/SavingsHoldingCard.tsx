import React from "react";
import { ChevronDown, ChevronUp, Edit, Trash2 } from "lucide-react";
import {
  CurrencyCode,
  EntryPerformance,
  PortfolioEntry,
} from "@fin-catch/shared";
import {
  calculateSavingsEarlyWithdrawal,
  calculateSavingsValue,
} from "@fin-catch/ui/utils";

export interface SavingsHoldingCardProps {
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

export const SavingsHoldingCard: React.FC<SavingsHoldingCardProps> = ({
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

  // 30.44 days/month average — display approximation, may be ±1 day vs. actual bank contract date
  const maturityTimestamp =
    entry.termMonths && entry.termMonths > 0
      ? entry.purchaseDate +
        Math.round(entry.termMonths * 30.44 * 24 * 3600)
      : null;

  const savingsCalc =
    entry.purchasePrice > 0 &&
    entry.interestRate !== undefined &&
    entry.termMonths !== undefined
      ? calculateSavingsValue(
          entry.purchasePrice,
          entry.interestRate,
          entry.termMonths,
          entry.compoundingType || "simple",
          entry.purchaseDate,
        )
      : null;

  const earlyWithdrawalValue =
    entry.purchasePrice > 0 && entry.demandDepositRate !== undefined
      ? calculateSavingsEarlyWithdrawal(
          entry.purchasePrice,
          entry.demandDepositRate,
          entry.purchaseDate,
        ) * entry.quantity
      : null;

  return (
    <div className="glass-card cyber-grid-bg p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="cyber-terminal-header px-2 py-0.5 rounded border"
              style={{
                backgroundColor: "rgba(16, 185, 129, 0.1)",
                borderColor: "var(--color-green-500)",
              }}
            >
              SAVINGS
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
              className="font-mono"
              style={{
                fontSize: "var(--text-lg)",
                fontWeight: "var(--font-bold)",
                color: "var(--color-green-500)",
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
                Principal
              </p>
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-medium)",
                  color: "var(--color-text-primary)",
                }}
              >
                {formatCurrency(entry.purchasePrice, entry.currency as CurrencyCode)}
              </p>
            </div>
            <div>
              <p
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--color-text-muted)",
                }}
              >
                Interest Rate
              </p>
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-medium)",
                  color: "var(--color-text-primary)",
                }}
              >
                {entry.interestRate !== undefined
                  ? `${entry.interestRate.toFixed(2)}%`
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
                Term
              </p>
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-medium)",
                  color: "var(--color-text-primary)",
                }}
              >
                {entry.termMonths !== undefined
                  ? `${entry.termMonths} months`
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
                Maturity Date
              </p>
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-medium)",
                  color: "var(--color-text-primary)",
                }}
              >
                {maturityTimestamp ? formatDate(maturityTimestamp) : "N/A"}
              </p>
            </div>
            <div>
              <p
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--color-text-muted)",
                }}
              >
                Compounding
              </p>
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-medium)",
                  color: "var(--color-text-primary)",
                }}
              >
                {entry.compoundingType
                  ? entry.compoundingType.charAt(0).toUpperCase() +
                    entry.compoundingType.slice(1)
                  : "Simple"}
              </p>
            </div>
            <div>
              <p
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--color-text-muted)",
                }}
              >
                Demand Deposit Rate
              </p>
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-medium)",
                  color: "var(--color-text-primary)",
                }}
              >
                {entry.demandDepositRate !== undefined
                  ? `${entry.demandDepositRate.toFixed(2)}%`
                  : "N/A"}
              </p>
            </div>
          </div>

          {savingsCalc && (
            <div className="grid grid-cols-2 gap-3">
              <div
                className="col-span-2 p-3 rounded"
                style={{
                  backgroundColor: "var(--color-alert-success-bg)",
                  border: "1px solid var(--color-alert-success-border)",
                }}
              >
                <p
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--color-alert-success-text)",
                    fontWeight: "var(--font-medium)",
                    marginBottom: "var(--space-2)",
                  }}
                >
                  At Maturity Value
                </p>
                <p
                  style={{
                    fontSize: "var(--text-sm)",
                    fontWeight: "var(--font-bold)",
                    color: "var(--color-alert-success-text)",
                  }}
                >
                  {formatCurrency(
                    savingsCalc.maturityValue * entry.quantity,
                    entry.currency as CurrencyCode,
                  )}
                </p>
              </div>
              {earlyWithdrawalValue !== null && (
                <div
                  className="col-span-2 p-3 rounded"
                  style={{
                    backgroundColor: "var(--color-alert-info-bg)",
                    border: "1px solid var(--color-alert-info-border)",
                  }}
                >
                  <p
                    style={{
                      fontSize: "var(--text-xs)",
                      color: "var(--color-alert-info-text)",
                      fontWeight: "var(--font-medium)",
                      marginBottom: "var(--space-2)",
                    }}
                  >
                    Early Withdrawal Value (if withdrawn today)
                  </p>
                  <p
                    style={{
                      fontSize: "var(--text-sm)",
                      fontWeight: "var(--font-bold)",
                      color: "var(--color-alert-info-text)",
                    }}
                  >
                    {formatCurrency(
                      earlyWithdrawalValue,
                      entry.currency as CurrencyCode,
                    )}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--color-text-muted)",
                }}
              >
                Deposit Date
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
                <div>
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
                    1 {entry.currency} ={" "}
                    {entryPerf.exchangeRate.toFixed(4)} {displayCurrency}
                  </p>
                </div>
              )}
          </div>

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
