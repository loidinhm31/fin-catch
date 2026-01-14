import React, { useState } from "react";
import { Wallet } from "lucide-react";
import { CurrencyCode, PortfolioEntry } from "@/types";
import { formatCurrency as formatCurrencyUtil } from "@/utils/currency";
import { getPreference, setPreference } from "@/utils/preferences";
import { ConfirmDialog, CubeShape } from "@/components/atoms";
import {
  AddEditEntryModal,
  CreatePortfolioModal,
  CurrencySelectorSection,
  HoldingsChartSection,
  HoldingsSection,
  PerformanceSummaryCard,
  PortfolioSelector,
} from "@/components/organisms";
import { usePortfolios } from "@/hooks/usePortfolios";
import { usePortfolioEntries } from "@/hooks/usePortfolioEntries";
import { usePortfolioPerformance } from "@/hooks/usePortfolioPerformance";
import { useHoldingsPerformance } from "@/hooks/useHoldingsPerformance";

export const PortfolioPage: React.FC = () => {
  // Hooks for data management
  const {
    portfolios,
    selectedPortfolioId,
    selectedPortfolio,
    setSelectedPortfolioId,
    deletePortfolio,
    loadPortfolios,
    error: portfolioError,
  } = usePortfolios();

  const {
    entries,
    isLoading: isEntriesLoading,
    loadEntries,
    deleteEntry,
  } = usePortfolioEntries(selectedPortfolioId);

  const [displayCurrency, setDisplayCurrency] = useState<CurrencyCode>(
    () => getPreference("displayCurrency") || "USD",
  );

  const { performance } = usePortfolioPerformance(entries, displayCurrency);

  const {
    timeframe,
    setTimeframe,
    data: holdingsData,
    isLoading: isHoldingsLoading,
    showChart,
    setShowChart,
  } = useHoldingsPerformance(entries, displayCurrency);

  // Modal state
  const [showCreatePortfolio, setShowCreatePortfolio] = useState(false);
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [editingEntry, setEditingEntry] = useState<PortfolioEntry | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [portfolioToDelete, setPortfolioToDelete] = useState<number | null>(
    null,
  );

  // Handlers
  const handleCurrencyChange = (currency: CurrencyCode) => {
    setDisplayCurrency(currency);
    setPreference("displayCurrency", currency);
  };

  const handleDeletePortfolioClick = (portfolioId: number) => {
    setPortfolioToDelete(portfolioId);
    setShowDeleteConfirm(true);
  };

  const handleDeletePortfolioConfirm = async () => {
    if (!portfolioToDelete) return;

    try {
      await deletePortfolio(portfolioToDelete);
      setPortfolioToDelete(null);
    } catch (err) {
      console.error("Failed to delete portfolio:", err);
    }
  };

  const handleEditEntry = (entry: PortfolioEntry) => {
    setEditingEntry(entry);
    setShowAddEntry(true);
  };

  // Formatting helpers
  const formatCurrency = (value: number, currency?: CurrencyCode) => {
    return formatCurrencyUtil(value, currency || displayCurrency);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  return (
    <div className="screen-explore">
      <div className="relative z-10 mx-4 pb-28 min-h-[calc(100vh-4rem)] overflow-hidden">
        <div className="h-full">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1
                style={{
                  fontSize: "var(--text-3xl)",
                  fontWeight: "var(--font-bold)",
                  color: "var(--cube-gray-900)",
                }}
              >
                PORTFOLIO
              </h1>
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  color: "var(--cube-gray-900)",
                  opacity: 0.7,
                }}
              >
                Track your investments
              </p>
            </div>
            <CubeShape className="animate-float" variant="pink" />
          </div>

          {/* Portfolio Selector & Currency Selector */}
          <div className="mb-6 space-y-4">
            <PortfolioSelector
              portfolios={portfolios}
              selectedPortfolioId={selectedPortfolioId}
              onSelect={setSelectedPortfolioId}
              onDelete={handleDeletePortfolioClick}
              onCreateNew={() => setShowCreatePortfolio(true)}
            />

            <CurrencySelectorSection
              selectedCurrency={displayCurrency}
              onSelectCurrency={handleCurrencyChange}
            />
          </div>

          {/* Error Display */}
          {portfolioError && !showCreatePortfolio && !showAddEntry && (
            <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-xl">
              <p
                style={{
                  fontWeight: "var(--font-bold)",
                  color: "#dc2626",
                  fontSize: "var(--text-sm)",
                }}
              >
                Error
              </p>
              <p
                style={{
                  color: "#dc2626",
                  fontSize: "var(--text-xs)",
                  marginTop: "var(--space-1)",
                }}
              >
                {portfolioError}
              </p>
            </div>
          )}

          {selectedPortfolio && (
            <>
              {/* Performance Summary */}
              {performance && (
                <PerformanceSummaryCard
                  performance={performance}
                  formatCurrency={formatCurrency}
                  formatPercentage={formatPercentage}
                />
              )}

              {/* Holdings Performance Chart Section */}
              {entries.length > 0 && (
                <HoldingsChartSection
                  showChart={showChart}
                  isLoading={isHoldingsLoading}
                  data={holdingsData}
                  timeframe={timeframe}
                  onShowChart={() => setShowChart(true)}
                  onHideChart={() => setShowChart(false)}
                  onTimeframeChange={setTimeframe}
                />
              )}

              {/* Holdings Section */}
              <HoldingsSection
                performance={performance}
                isLoading={isEntriesLoading}
                displayCurrency={displayCurrency}
                onAdd={() => {
                  setEditingEntry(null);
                  setShowAddEntry(true);
                }}
                onEdit={handleEditEntry}
                onDelete={deleteEntry}
                onPaymentsChange={() => {
                  if (selectedPortfolioId) {
                    loadEntries(selectedPortfolioId);
                  }
                }}
                formatCurrency={formatCurrency}
                formatPercentage={formatPercentage}
                formatDate={formatDate}
              />
            </>
          )}

          {!selectedPortfolio && portfolios.length === 0 && (
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
                No portfolios yet
              </p>
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  color: "var(--cube-gray-900)",
                  opacity: 0.7,
                  marginTop: "var(--space-2)",
                }}
              >
                Create your first portfolio to start tracking investments
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreatePortfolioModal
        isOpen={showCreatePortfolio}
        onClose={() => setShowCreatePortfolio(false)}
        onSuccess={(portfolio) => {
          setShowCreatePortfolio(false);
          loadPortfolios();
          if (portfolio.id) {
            setSelectedPortfolioId(portfolio.id);
          }
        }}
      />

      <AddEditEntryModal
        isOpen={showAddEntry}
        onClose={() => {
          setShowAddEntry(false);
          setEditingEntry(null);
        }}
        onSuccess={() => {
          setShowAddEntry(false);
          setEditingEntry(null);
          // Reload entries to show the newly created/updated item
          if (selectedPortfolioId) {
            loadEntries(selectedPortfolioId);
          }
        }}
        portfolioId={selectedPortfolioId!}
        editingEntry={editingEntry}
      />

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setPortfolioToDelete(null);
        }}
        onConfirm={handleDeletePortfolioConfirm}
        title="Delete Portfolio"
        message="Are you sure you want to delete this portfolio? All entries will be removed."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};
