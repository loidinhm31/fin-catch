import React, { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { CurrencyCode, PortfolioEntry } from "@fin-catch/shared";
import { ConfirmDialog } from "@fin-catch/ui/components/atoms";
import { useSellTransactions } from "@fin-catch/ui/hooks";

export interface SellHistorySectionProps {
  entry: PortfolioEntry;
  baseCurrency: CurrencyCode;
  formatDate: (timestamp: number) => string;
}

export const SellHistorySection: React.FC<SellHistorySectionProps> = ({
  entry,
  baseCurrency,
  formatDate,
}) => {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const { sellTransactions, isLoading, totalRealized, deleteSell } =
    useSellTransactions(entry.id ?? null, entry, baseCurrency);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-3">
        <Loader2
          className="w-4 h-4 animate-spin"
          style={{ color: "var(--color-text-muted)" }}
        />
        <span
          className="text-xs"
          style={{ color: "var(--color-text-muted)" }}
        >
          Loading sell history…
        </span>
      </div>
    );
  }

  if (sellTransactions.length === 0) {
    return (
      <p
        className="text-xs py-3"
        style={{ color: "var(--color-text-muted)" }}
      >
        No sell records for this position.
      </p>
    );
  }

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Sell History
        </span>
        <span
          className="text-xs font-semibold"
          style={{
            color:
              totalRealized >= 0
                ? "var(--color-green-500)"
                : "var(--color-red-500)",
          }}
        >
          Total Realized: {totalRealized >= 0 ? "+" : ""}
          {totalRealized.toLocaleString(undefined, {
            maximumFractionDigits: 2,
          })}{" "}
          {entry.currency}
        </span>
      </div>
      <div className="space-y-2">
        {sellTransactions.map((tx) => (
          <div
            key={tx.id}
            className="flex items-start justify-between p-2.5 rounded-lg border text-xs"
            style={{
              background: "var(--glass-bg-input)",
              borderColor: "var(--glass-border-medium)",
            }}
          >
            <div className="flex-1 space-y-0.5">
              <div className="flex items-center gap-2">
                <span style={{ color: "var(--color-text-secondary)" }}>
                  {formatDate(tx.sellDate)}
                </span>
                <span style={{ color: "var(--color-text-muted)" }}>
                  {tx.quantity} @ {tx.sellPrice.toLocaleString()} {tx.currency}
                </span>
              </div>
              {tx.notes && (
                <div style={{ color: "var(--color-text-muted)" }}>
                  {tx.notes}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 ml-3">
              <span
                className="font-semibold"
                style={{
                  color:
                    tx.realizedGainLoss >= 0
                      ? "var(--color-green-500)"
                      : "var(--color-red-500)",
                }}
              >
                {tx.realizedGainLoss >= 0 ? "+" : ""}
                {tx.realizedGainLoss.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPendingDeleteId(tx.id);
                }}
                className="p-1 rounded transition-opacity hover:opacity-70"
                style={{ color: "var(--color-red-500)" }}
                title="Delete sell record"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        isOpen={!!pendingDeleteId}
        onClose={() => setPendingDeleteId(null)}
        onConfirm={() => {
          if (pendingDeleteId) deleteSell(pendingDeleteId);
        }}
        title="Delete Sell Record"
        message="This will remove the sell transaction and restore the quantity to your holding. This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};
