import React from "react";
import { ArrowDownLeft, ArrowUpRight, DollarSign } from "lucide-react";
import { CapitalSummary, CurrencyCode } from "@fin-catch/shared";
import { Button } from "@fin-catch/ui/components/atoms";

export interface CapitalAccountCardProps {
  summary: CapitalSummary;
  formatCurrency: (value: number, currency?: CurrencyCode) => string;
  onPayIn: () => void;
  onWithdraw: () => void;
}

export const CapitalAccountCard: React.FC<CapitalAccountCardProps> = ({
  summary,
  formatCurrency,
  onPayIn,
  onWithdraw,
}) => {
  const isPositive = summary.availableCapital >= 0;

  return (
    <div className="mb-6">
      <h2
        style={{
          fontSize: "var(--text-xl)",
          fontWeight: "var(--font-bold)",
          color: "var(--color-text-primary)",
          marginBottom: "var(--space-4)",
        }}
      >
        Capital Account
      </h2>
      <div className="glass-card p-6 bg-cyan-500/10">
        {/* Available capital header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p
              style={{
                fontSize: "var(--text-sm)",
                color: "var(--color-text-primary)",
                opacity: 0.7,
                marginBottom: "var(--space-1)",
              }}
            >
              Available Capital ({summary.baseCurrency})
            </p>
            <h2
              style={{
                fontSize: "var(--text-4xl)",
                fontWeight: "var(--font-extrabold)",
                color: isPositive
                  ? "var(--color-green-500)"
                  : "var(--color-red-500)",
              }}
            >
              {formatCurrency(summary.availableCapital)}
            </h2>
          </div>
          <DollarSign
            className="w-12 h-12"
            style={{ color: "var(--color-cyan-400)" }}
          />
        </div>

        {/* Stats grid */}
        <div
          className="grid grid-cols-2 gap-4 pt-4 border-t mb-4"
          style={{ borderColor: "var(--color-black-10)" }}
        >
          <div>
            <p
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--color-text-primary)",
                opacity: 0.7,
                marginBottom: "var(--space-1)",
              }}
            >
              Total Pay-In
            </p>
            <p
              style={{
                fontSize: "var(--text-lg)",
                fontWeight: "var(--font-bold)",
                color: "var(--color-green-500)",
              }}
            >
              {formatCurrency(summary.totalPayIn)}
            </p>
          </div>
          <div>
            <p
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--color-text-primary)",
                opacity: 0.7,
                marginBottom: "var(--space-1)",
              }}
            >
              Total Withdraw
            </p>
            <p
              style={{
                fontSize: "var(--text-lg)",
                fontWeight: "var(--font-bold)",
                color: "var(--color-red-500)",
              }}
            >
              {formatCurrency(summary.totalWithdraw)}
            </p>
          </div>
          <div>
            <p
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--color-text-primary)",
                opacity: 0.7,
                marginBottom: "var(--space-1)",
              }}
            >
              Total Invested
            </p>
            <p
              style={{
                fontSize: "var(--text-lg)",
                fontWeight: "var(--font-bold)",
                color: "var(--color-text-primary)",
              }}
            >
              {formatCurrency(summary.totalInvested)}
            </p>
          </div>
          <div>
            <p
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--color-text-primary)",
                opacity: 0.7,
                marginBottom: "var(--space-1)",
              }}
            >
              Net Flow
            </p>
            <p
              style={{
                fontSize: "var(--text-lg)",
                fontWeight: "var(--font-bold)",
                color:
                  summary.netCapitalFlow >= 0
                    ? "var(--color-green-500)"
                    : "var(--color-red-500)",
              }}
            >
              {formatCurrency(summary.netCapitalFlow)}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <Button
            variant="primary"
            onClick={onPayIn}
            className="flex-1 flex items-center justify-center gap-2"
            style={{ background: "var(--color-green-500)" }}
          >
            <ArrowDownLeft className="w-4 h-4" />
            Pay In
          </Button>
          <Button
            variant="primary"
            onClick={onWithdraw}
            className="flex-1 flex items-center justify-center gap-2"
            style={{ background: "var(--color-red-600)" }}
          >
            <ArrowUpRight className="w-4 h-4" />
            Withdraw
          </Button>
        </div>
      </div>
    </div>
  );
};
