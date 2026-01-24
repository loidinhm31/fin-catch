import React, { useState } from "react";
import { Plus, Wallet } from "lucide-react";
import {
  CurrencyCode,
  PortfolioEntry,
  PortfolioPerformance,
} from "@fin-catch/shared";
import { HoldingCard } from "@fin-catch/ui/molecules";

export interface HoldingsSectionProps {
  performance: PortfolioPerformance | null;
  isLoading: boolean;
  displayCurrency: CurrencyCode;
  onAdd: () => void;
  onEdit: (entry: PortfolioEntry) => void;
  onDelete: (entryId: string) => void;
  onPaymentsChange?: () => void; // Callback for when coupon payments change
  formatCurrency: (value: number, currency?: CurrencyCode) => string;
  formatPercentage: (value: number) => string;
  formatDate: (timestamp: number) => string;
}

export const HoldingsSection: React.FC<HoldingsSectionProps> = ({
  performance,
  isLoading,
  displayCurrency,
  onAdd,
  onEdit,
  onDelete,
  onPaymentsChange,
  formatCurrency,
  formatPercentage,
  formatDate,
}) => {
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(
    new Set(),
  );

  const toggleExpanded = (entryId: string) => {
    const newExpanded = new Set(expandedEntries);
    if (newExpanded.has(entryId)) {
      newExpanded.delete(entryId);
    } else {
      newExpanded.add(entryId);
    }
    setExpandedEntries(newExpanded);
  };

  const entriesCount = performance?.entries_performance.length || 0;

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2
          style={{
            fontSize: "var(--text-xl)",
            fontWeight: "var(--font-bold)",
            color: "var(--cube-gray-900)",
          }}
        >
          Holdings{" "}
          <span style={{ color: "var(--cube-gray-400)" }}>
            ({entriesCount})
          </span>
        </h2>
        <button
          onClick={onAdd}
          className="bg-linear-to-r from-cyan-300 to-blue-700 text-white px-4 py-2 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
          style={{ fontSize: "var(--text-sm)" }}
        >
          <Plus className="w-4 h-4" />
          ADD
        </button>
      </div>

      {isLoading ? (
        <div className="glass-card p-12 text-center">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      ) : entriesCount === 0 ? (
        <div className="glass-card p-12 text-center">
          <Wallet
            className="w-16 h-16 mx-auto mb-4 opacity-30"
            style={{ color: "var(--cube-pink)" }}
          />
          <p
            style={{
              fontSize: "var(--text-lg)",
              fontWeight: "var(--font-bold)",
              color: "var(--cube-gray-900)",
            }}
          >
            No holdings yet
          </p>
          <p
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--cube-gray-900)",
              opacity: 0.7,
              marginTop: "var(--space-2)",
            }}
          >
            Add stocks or gold to start tracking
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {performance?.entries_performance.map((entryPerf) => (
            <HoldingCard
              key={entryPerf.entry.id}
              entryPerf={entryPerf}
              displayCurrency={displayCurrency}
              isExpanded={expandedEntries.has(entryPerf.entry.id!)}
              onToggleExpand={() => toggleExpanded(entryPerf.entry.id!)}
              onEdit={onEdit}
              onDelete={onDelete}
              onPaymentsChange={onPaymentsChange}
              formatCurrency={formatCurrency}
              formatPercentage={formatPercentage}
              formatDate={formatDate}
            />
          ))}
        </div>
      )}
    </div>
  );
};
