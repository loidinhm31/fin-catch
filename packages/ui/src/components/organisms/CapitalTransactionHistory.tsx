import React from "react";
import { CapitalTransaction, CapitalTransactionType } from "@fin-catch/shared";

export interface CapitalTransactionHistoryProps {
  transactions: CapitalTransaction[];
  displayCurrency?: string;
  formatDate: (timestamp: number) => string;
}

const TYPE_LABELS: Record<CapitalTransactionType, string> = {
  "pay-in": "Pay-In",
  withdraw: "Withdraw",
  "buy-deduction": "Buy",
  "sell-credit": "Sell",
};

const TYPE_COLORS: Record<
  CapitalTransactionType,
  { bg: string; color: string }
> = {
  "pay-in": {
    bg: "rgba(16, 185, 129, 0.15)",
    color: "var(--color-green-500)",
  },
  withdraw: {
    bg: "rgba(239, 68, 68, 0.15)",
    color: "var(--color-red-500)",
  },
  "buy-deduction": {
    bg: "rgba(239, 68, 68, 0.12)",
    color: "var(--color-red-500)",
  },
  "sell-credit": {
    bg: "rgba(16, 185, 129, 0.12)",
    color: "var(--color-green-500)",
  },
};

const isCredit = (type: CapitalTransactionType) =>
  type === "pay-in" || type === "sell-credit";

export const CapitalTransactionHistory: React.FC<
  CapitalTransactionHistoryProps
> = ({ transactions, displayCurrency, formatDate }) => {
  const sorted = [...transactions].sort((a, b) => b.date - a.date);

  if (sorted.length === 0) {
    return (
      <p
        className="text-sm text-center py-4"
        style={{ color: "var(--color-text-muted)" }}
      >
        No capital transactions yet
      </p>
    );
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
      {sorted.map((tx) => {
        const colors = TYPE_COLORS[tx.type];
        const credit = isCredit(tx.type);
        return (
          <div
            key={tx.id}
            className="flex items-center justify-between p-3 rounded-xl border"
            style={{
              background: "var(--glass-bg-input)",
              borderColor: "var(--glass-border-medium)",
            }}
          >
            <div className="flex items-center gap-3">
              <span
                className="text-xs px-2 py-0.5 rounded font-semibold"
                style={{ background: colors.bg, color: colors.color }}
              >
                {TYPE_LABELS[tx.type]}
              </span>
              <div>
                <div
                  className="text-xs"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {formatDate(tx.date)}
                </div>
                {tx.notes && (
                  <div
                    className="text-xs truncate max-w-[120px]"
                    style={{ color: "var(--color-text-muted)" }}
                    title={tx.notes}
                  >
                    {tx.notes}
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <div
                className="text-sm font-semibold"
                style={{ color: colors.color }}
              >
                {credit ? "+" : "-"}
                {tx.amount.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}{" "}
                {tx.currency}
              </div>
              {displayCurrency && tx.currency !== displayCurrency && (
                <div
                  className="text-xs"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  ≈ {tx.baseCurrencyAmount.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })} {displayCurrency}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
