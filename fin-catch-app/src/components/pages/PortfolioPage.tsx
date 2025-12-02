import React, { useEffect, useState } from "react";
import { Plus, Trash2, Edit, ChevronDown, ChevronUp, X, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { finCatchAPI } from "../../services/api";
import {
  Portfolio,
  PortfolioEntry,
  PortfolioPerformance,
  EntryPerformance,
  CurrencyCode,
} from "../../types";
import { dateToUnixTimestamp } from "../../utils/dateUtils";
import { convertCurrency, formatCurrency as formatCurrencyUtil } from "../../utils/currency";
import { getPreference, setPreference } from "../../utils/preferences";
import {
  Button,
  Input,
  Select,
  Textarea,
  Label,
  Modal,
  ErrorAlert,
  ConfirmDialog,
} from "../atoms/UI";
import { CurrencySelect } from "../atoms";
import { CURRENCY_SYMBOLS } from "../../types";

// Cube decoration component
const CubeShape = ({ className = "", variant = "default" }: { className?: string; variant?: "default" | "yellow" | "pink" }) => (
  <div className={`cube-decoration ${variant === 'yellow' ? 'cube-yellow' : variant === 'pink' ? 'cube-pink' : ''} ${className}`}></div>
);

// Gold price ID to unit mapping (based on API source metadata)
const getGoldUnitByIdAndSource = (goldPriceId: string, source: string): "gram" | "mace" | "tael" | "ounce" | "kg" => {
  if (source === "sjc") {
    // SJC gold bars (1L, 10L, 1KG) - priced per tael (lượng)
    if (goldPriceId === "1" || goldPriceId === "2") {
      return "tael";
    }
    // SJC jewelry/rings (99.99%) - priced per mace (chỉ)
    if (goldPriceId === "49") {
      return "mace";
    }
    // Default for other SJC types
    return "mace";
  }

  // Default to mace for Vietnamese gold
  return "mace";
};

// Helper functions for gold unit conversions
const getGramsPerUnit = (unit: string): number => {
  switch (unit) {
    case "gram": return 1;
    case "mace": return 3.75; // 1 mace (chỉ) = 3.75 grams
    case "tael": return 37.5; // 1 tael (lượng) = 10 mace = 37.5 grams
    case "ounce": return 31.1035; // 1 troy ounce = 31.1035 grams
    case "kg": return 1000;
    default: return 1;
  }
};

const convertToGrams = (quantity: number, unit: string): number => {
  return quantity * getGramsPerUnit(unit);
};

const getUnitLabel = (unit: string): string => {
  switch (unit) {
    case "gram": return "Gram (g)";
    case "mace": return "Mace/Chỉ (3.75g)";
    case "tael": return "Tael/Lượng (37.5g)";
    case "ounce": return "Troy Ounce (31.1g)";
    case "kg": return "Kilogram (kg)";
    default: return unit;
  }
};

export const PortfolioPage: React.FC = () => {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<number | null>(null);
  const [entries, setEntries] = useState<PortfolioEntry[]>([]);
  const [performance, setPerformance] = useState<PortfolioPerformance | null>(null);
  const [displayCurrency, setDisplayCurrency] = useState<CurrencyCode>(
    () => getPreference("displayCurrency") || "USD"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showCreatePortfolio, setShowCreatePortfolio] = useState(false);
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [editingEntry, setEditingEntry] = useState<PortfolioEntry | null>(null);

  const [portfolioFormError, setPortfolioFormError] = useState<string | null>(null);
  const [entryFormError, setEntryFormError] = useState<string | null>(null);

  const [portfolioName, setPortfolioName] = useState("");
  const [portfolioDescription, setPortfolioDescription] = useState("");

  const [entryAssetType, setEntryAssetType] = useState<"stock" | "gold">("stock");
  const [entrySymbol, setEntrySymbol] = useState("");
  const [entryQuantity, setEntryQuantity] = useState("");
  const [entryPurchasePrice, setEntryPurchasePrice] = useState("");
  const [entryCurrency, setEntryCurrency] = useState<CurrencyCode>("USD");
  const [entryPurchaseDate, setEntryPurchaseDate] = useState("");
  const [entryNotes, setEntryNotes] = useState("");
  const [entryTags, setEntryTags] = useState("");
  const [entryFees, setEntryFees] = useState("");
  const [entrySource, setEntrySource] = useState("");

  // Gold-specific fields
  const [goldUnit, setGoldUnit] = useState<"gram" | "mace" | "tael" | "ounce" | "kg">("mace");
  const [goldType, setGoldType] = useState<string>("");

  const [expandedEntries, setExpandedEntries] = useState<Set<number>>(new Set());

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [portfolioToDelete, setPortfolioToDelete] = useState<number | null>(null);

  // Load portfolios on mount
  useEffect(() => {
    loadPortfolios();
  }, []);

  // Load entries when portfolio changes
  useEffect(() => {
    if (selectedPortfolioId) {
      loadEntries(selectedPortfolioId);
    }
  }, [selectedPortfolioId]);

  // Calculate performance when entries or display currency changes
  useEffect(() => {
    if (entries.length > 0 && selectedPortfolioId) {
      calculatePerformance();
    } else {
      setPerformance(null);
    }
  }, [entries, displayCurrency]);

  const loadPortfolios = async () => {
    try {
      const portfolioList = await finCatchAPI.listPortfolios();
      setPortfolios(portfolioList);
      if (portfolioList.length > 0 && !selectedPortfolioId) {
        setSelectedPortfolioId(portfolioList[0].id!);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load portfolios");
    }
  };

  const loadEntries = async (portfolioId: number) => {
    setIsLoading(true);
    try {
      const entryList = await finCatchAPI.listEntries(portfolioId);
      setEntries(entryList);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load entries");
    } finally {
      setIsLoading(false);
    }
  };

  const calculatePerformance = async () => {
    if (entries.length === 0) return;

    try {
      const entriesPerformance: EntryPerformance[] = [];

      for (const entry of entries) {
        let currentPrice = 0;
        let currentPriceCurrency: CurrencyCode = entry.currency || "USD";
        let priceScale = 1; // Default price scale

        if (entry.asset_type === "stock") {
          const response = await finCatchAPI.fetchStockHistory({
            symbol: entry.symbol,
            resolution: "1D" as const,
            from: Math.floor(Date.now() / 1000) - 86400,
            to: Math.floor(Date.now() / 1000),
            source: entry.source as any,
          });

          if (response.data && response.data.length > 0) {
            const rawPrice = response.data[response.data.length - 1].close;
            // Get price_scale from metadata (default to 1 if not present)
            priceScale = (response.metadata?.price_scale as number) ?? 1;
            currentPrice = rawPrice * priceScale;
          }
        } else if (entry.asset_type === "gold") {
          // Ensure source is valid for gold API
          const goldSource = entry.source as "sjc";
          if (!goldSource || goldSource !== "sjc") {
            console.warn(`Invalid gold source for entry ${entry.id}: ${entry.source}`);
            continue; // Skip this entry if source is invalid
          }

          const response = await finCatchAPI.fetchGoldPrice({
            gold_price_id: entry.symbol, // This is now the gold price ID (1, 2, 999, etc.)
            from: Math.floor(Date.now() / 1000) - 86400,
            to: Math.floor(Date.now() / 1000),
            source: goldSource,
          });

          if (response.data && response.data.length > 0) {
            const rawPrice = response.data[response.data.length - 1].sell;
            // Get price_scale from metadata (default to 1 if not present)
            priceScale = (response.metadata?.price_scale as number) ?? 1;
            currentPrice = rawPrice * priceScale;

            // SJC gold API ALWAYS returns prices in VND per tael (lượng = 37.5g)
            currentPriceCurrency = "VND";

            // NOTE: All Vietnamese gold APIs return prices per tael (lượng = 37.5g = 10 chỉ)
            // If user entered price per mace (chỉ), we need to convert to per tael for comparison
          }
        }

        // Convert current price to display currency
        const currentPriceInDisplayCurrency = await convertCurrency(
          currentPrice,
          currentPriceCurrency,
          displayCurrency
        );

        // For stocks: purchase_price is per share (apply price_scale for consistency with API format)
        // For gold: need to handle unit conversion
        let scaledPurchasePrice: number;
        if (entry.asset_type === "stock") {
          scaledPurchasePrice = entry.purchase_price * priceScale;
        } else {
          // Gold: API returns price per tael, but user might have entered per mace
          // Convert user's purchase price to per-tael if needed
          const userUnit = entry.unit || "tael"; // Default to tael if not set

          if (userUnit === "mace") {
            // User entered per mace (chỉ), convert to per tael (lượng)
            // 1 tael = 10 mace, so multiply by 10
            scaledPurchasePrice = entry.purchase_price * 10;
          } else if (userUnit === "tael") {
            // User entered per tael, use as-is
            scaledPurchasePrice = entry.purchase_price;
          } else if (userUnit === "gram") {
            // User entered per gram, convert to per tael (37.5g)
            scaledPurchasePrice = entry.purchase_price * 37.5;
          } else {
            // Default: assume tael
            scaledPurchasePrice = entry.purchase_price;
          }
        }

        // Convert purchase price to display currency
        const purchasePriceInDisplayCurrency = await convertCurrency(
          scaledPurchasePrice,
          entry.currency || "USD",
          displayCurrency
        );

        // Convert transaction fees to display currency
        const feesInDisplayCurrency = entry.transaction_fees
          ? await convertCurrency(entry.transaction_fees, entry.currency || "USD", displayCurrency)
          : 0;

        // Calculate exchange rate (for display purposes)
        const exchangeRate = currentPriceCurrency !== displayCurrency
          ? currentPriceInDisplayCurrency / (currentPrice || 1)
          : 1.0;

        // For gold: convert quantity to taels if user entered in mace
        let quantityInTaels = entry.quantity;
        if (entry.asset_type === "gold") {
          const userUnit = entry.unit || "tael";
          if (userUnit === "mace") {
            // User has quantity in mace, convert to taels (divide by 10)
            quantityInTaels = entry.quantity / 10;
          } else if (userUnit === "gram") {
            // User has quantity in grams, convert to taels (divide by 37.5)
            quantityInTaels = entry.quantity / 37.5;
          }
          // If unit is "tael", quantityInTaels is already correct
        }

        const currentValue = currentPriceInDisplayCurrency * quantityInTaels;
        const totalCost = purchasePriceInDisplayCurrency * quantityInTaels + feesInDisplayCurrency;
        const gainLoss = currentValue - totalCost;
        const gainLossPercentage = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0;

        entriesPerformance.push({
          entry,
          current_price: currentPriceInDisplayCurrency,
          purchase_price: purchasePriceInDisplayCurrency, // Store scaled purchase price in display currency
          current_value: currentValue,
          total_cost: totalCost,
          gain_loss: gainLoss,
          gain_loss_percentage: gainLossPercentage,
          price_source: entry.source || "unknown",
          currency: displayCurrency,
          exchange_rate: exchangeRate,
        });
      }

      const totalValue = entriesPerformance.reduce((sum, e) => sum + e.current_value, 0);
      const totalCost = entriesPerformance.reduce((sum, e) => sum + e.total_cost, 0);
      const totalGainLoss = totalValue - totalCost;
      const totalGainLossPercentage = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

      setPerformance({
        total_value: totalValue,
        total_cost: totalCost,
        total_gain_loss: totalGainLoss,
        total_gain_loss_percentage: totalGainLossPercentage,
        currency: displayCurrency,
        entries_performance: entriesPerformance,
      });
    } catch (err) {
      console.error("Failed to calculate performance:", err);
    }
  };

  const handleCreatePortfolio = async () => {
    if (!portfolioName.trim()) {
      setPortfolioFormError("Portfolio name is required");
      return;
    }

    try {
      const newPortfolio: Portfolio = {
        name: portfolioName,
        description: portfolioDescription || undefined,
        created_at: Math.floor(Date.now() / 1000),
      };

      const portfolioId = await finCatchAPI.createPortfolio(newPortfolio);
      await loadPortfolios();
      setSelectedPortfolioId(portfolioId);
      setShowCreatePortfolio(false);
      resetPortfolioForm();
    } catch (err) {
      setPortfolioFormError(err instanceof Error ? err.message : "Failed to create portfolio");
    }
  };

  const handleDeletePortfolioClick = (portfolioId: number) => {
    setPortfolioToDelete(portfolioId);
    setShowDeleteConfirm(true);
  };

  const handleDeletePortfolioConfirm = async () => {
    if (!portfolioToDelete) return;

    try {
      await finCatchAPI.deletePortfolio(portfolioToDelete);
      await loadPortfolios();
      if (selectedPortfolioId === portfolioToDelete) {
        setSelectedPortfolioId(portfolios.length > 1 ? portfolios[0].id! : null);
      }
      setPortfolioToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete portfolio");
    }
  };

  const handleSaveEntry = async () => {
    // Validation
    if (entryAssetType === "gold") {
      if (!goldType || !entryQuantity || !entryPurchasePrice || !entryPurchaseDate || !entrySource) {
        setEntryFormError("Gold price ID, quantity, purchase price, date, and source are required");
        return;
      }
    } else {
      if (!entrySymbol.trim() || !entryQuantity || !entryPurchasePrice || !entryPurchaseDate) {
        setEntryFormError("Symbol, quantity, purchase price, and date are required");
        return;
      }
    }

    try {
      const entry: PortfolioEntry = {
        id: editingEntry?.id,
        portfolio_id: selectedPortfolioId!,
        asset_type: entryAssetType,
        symbol: entryAssetType === "gold" ? goldType : entrySymbol.toUpperCase(),
        quantity: parseFloat(entryQuantity),
        purchase_price: parseFloat(entryPurchasePrice),
        currency: entryCurrency,
        purchase_date: dateToUnixTimestamp(new Date(entryPurchaseDate)),
        notes: entryNotes || undefined,
        tags: entryTags || undefined,
        transaction_fees: entryFees ? parseFloat(entryFees) : undefined,
        source: entrySource || undefined,
        created_at: editingEntry?.created_at || Math.floor(Date.now() / 1000),
        // Add gold-specific fields
        unit: entryAssetType === "gold" ? goldUnit : undefined,
        gold_type: entryAssetType === "gold" ? goldType : undefined,
      };

      if (editingEntry) {
        await finCatchAPI.updateEntry(entry);
      } else {
        await finCatchAPI.createEntry(entry);
      }

      await loadEntries(selectedPortfolioId!);
      setShowAddEntry(false);
      resetEntryForm();
    } catch (err) {
      setEntryFormError(err instanceof Error ? err.message : "Failed to save entry");
    }
  };

  const handleDeleteEntry = async (entryId: number) => {
    try {
      await finCatchAPI.deleteEntry(entryId);
      await loadEntries(selectedPortfolioId!);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete entry");
    }
  };

  const handleEditEntry = (entry: PortfolioEntry) => {
    setEditingEntry(entry);
    setEntryAssetType(entry.asset_type);

    // Set asset-type-specific fields
    if (entry.asset_type === "gold") {
      setGoldType(entry.gold_type || entry.symbol); // Use gold_type if available, fallback to symbol
      setGoldUnit((entry.unit as any) || "mace"); // Default to mace if not set
    } else {
      setEntrySymbol(entry.symbol);
    }

    setEntryQuantity(entry.quantity.toString());
    setEntryPurchasePrice(entry.purchase_price.toString());
    setEntryCurrency(entry.currency || "USD");
    setEntryPurchaseDate(new Date(entry.purchase_date * 1000).toISOString().split("T")[0]);
    setEntryNotes(entry.notes || "");
    setEntryTags(entry.tags || "");
    setEntryFees(entry.transaction_fees?.toString() || "");
    setEntrySource(entry.source || "");
    setEntryFormError(null);
    setShowAddEntry(true);
  };

  const toggleExpanded = (entryId: number) => {
    const newExpanded = new Set(expandedEntries);
    if (newExpanded.has(entryId)) {
      newExpanded.delete(entryId);
    } else {
      newExpanded.add(entryId);
    }
    setExpandedEntries(newExpanded);
  };

  const resetPortfolioForm = () => {
    setPortfolioName("");
    setPortfolioDescription("");
    setPortfolioFormError(null);
  };

  const resetEntryForm = () => {
    setEntryAssetType("stock");
    setEntrySymbol("");
    setEntryQuantity("");
    setEntryPurchasePrice("");
    setEntryCurrency("USD");
    setEntryPurchaseDate("");
    setEntryNotes("");
    setEntryTags("");
    setEntryFees("");
    setEntrySource("");
    setEditingEntry(null);
    setEntryFormError(null);
    // Reset gold-specific fields
    setGoldUnit("mace"); // Default to mace (chỉ) for Vietnamese gold
    setGoldType("");
  };

  const formatCurrency = (value: number, currency?: CurrencyCode) => {
    return formatCurrencyUtil(value, currency || displayCurrency);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const handleCurrencyChange = (currency: CurrencyCode) => {
    setDisplayCurrency(currency);
    setPreference("displayCurrency", currency);
  };

  const selectedPortfolio = portfolios.find((p) => p.id === selectedPortfolioId);

  return (
    <div className="screen-explore">
      {/* Main glass container */}
      <div className="relative z-10 mx-4 pb-28 min-h-[calc(100vh-4rem)] overflow-hidden">
        <div className="h-full">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)', color: 'var(--cube-gray-900)' }}>
                PORTFOLIO
              </h1>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--cube-gray-900)', opacity: 0.7 }}>
                Track your investments
              </p>
            </div>
            <CubeShape className="animate-float" variant="pink" />
          </div>

          {/* Portfolio Selector & Currency Selector */}
          <div className="mb-6 space-y-4">
            <div>
              <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', color: 'var(--cube-gray-900)', marginBottom: 'var(--space-4)' }}>
                Your Portfolios
              </h2>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {portfolios.map((portfolio) => (
                <button
                  key={portfolio.id}
                  onClick={() => setSelectedPortfolioId(portfolio.id!)}
                  className={`relative flex-shrink-0 px-4 py-3 rounded-xl font-bold transition-all ${
                    selectedPortfolioId === portfolio.id
                      ? "bg-gradient-to-r from-pink-400 to-purple-600 text-white shadow-lg"
                      : "glass-button"
                  }`}
                  style={{ fontSize: 'var(--text-sm)' }}
                >
                  {portfolio.name}
                  {selectedPortfolioId === portfolio.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePortfolioClick(portfolio.id!);
                      }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </button>
              ))}
              <button
                onClick={() => {
                  setPortfolioFormError(null);
                  setShowCreatePortfolio(true);
                }}
                className="glass-button flex-shrink-0 px-4 py-3 rounded-xl font-bold transition-all"
                style={{ fontSize: 'var(--text-sm)' }}
              >
                <Plus className="w-5 h-5 inline-block mr-2" />
                NEW
              </button>
            </div>
            </div>

            {/* Currency Selector */}
            <div>
              <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', color: 'var(--cube-gray-900)', opacity: 0.7, marginBottom: 'var(--space-2)' }}>
                Display Currency
              </h3>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {(["USD", "VND", "EUR", "GBP", "JPY"] as CurrencyCode[]).map((currency) => (
                  <button
                    key={currency}
                    onClick={() => handleCurrencyChange(currency)}
                    className={`flex-shrink-0 px-3 py-2 rounded-lg font-bold transition-all ${
                      displayCurrency === currency
                        ? "bg-gradient-to-r from-cyan-400 to-blue-600 text-white shadow-md"
                        : "glass-button"
                    }`}
                    style={{ fontSize: 'var(--text-xs)' }}
                  >
                    {CURRENCY_SYMBOLS[currency]} {currency}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && !showCreatePortfolio && !showAddEntry && (
            <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-xl">
              <p style={{ fontWeight: 'var(--font-bold)', color: '#dc2626', fontSize: 'var(--text-sm)' }}>Error</p>
              <p style={{ color: '#dc2626', fontSize: 'var(--text-xs)', marginTop: 'var(--space-1)' }}>{error}</p>
            </div>
          )}

          {selectedPortfolio && (
            <>
              {/* Performance Summary */}
              {performance && (
                <div className="mb-6">
                  <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', color: 'var(--cube-gray-900)', marginBottom: 'var(--space-4)' }}>
                    Performance
                  </h2>
                  <div className="glass-card p-6 bg-gradient-to-br from-pink-100 to-purple-100">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', color: 'var(--cube-gray-900)', opacity: 0.7, marginBottom: 'var(--space-1)' }}>
                          Total Value
                        </p>
                        <h2 style={{ fontSize: 'var(--text-4xl)', fontWeight: 'var(--font-extrabold)', color: 'var(--cube-gray-900)' }}>
                          {formatCurrency(performance.total_value)}
                        </h2>
                      </div>
                      {performance.total_gain_loss >= 0 ? (
                        <TrendingUp className="w-12 h-12" style={{ color: '#10b981' }} />
                      ) : (
                        <TrendingDown className="w-12 h-12" style={{ color: '#ef4444' }} />
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t" style={{ borderColor: 'rgba(0, 0, 0, 0.1)' }}>
                      <div>
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--cube-gray-900)', opacity: 0.7, marginBottom: 'var(--space-1)' }}>
                          Gain/Loss
                        </p>
                        <p style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', color: performance.total_gain_loss >= 0 ? '#10b981' : '#ef4444' }}>
                          {formatCurrency(performance.total_gain_loss)}
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--cube-gray-900)', opacity: 0.7, marginBottom: 'var(--space-1)' }}>
                          Return
                        </p>
                        <p style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', color: performance.total_gain_loss_percentage >= 0 ? '#10b981' : '#ef4444' }}>
                          {formatPercentage(performance.total_gain_loss_percentage)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Holdings Section */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', color: 'var(--cube-gray-900)' }}>
                    Holdings <span style={{ color: 'var(--cube-gray-400)' }}>({entries.length})</span>
                  </h2>
                  <button
                    onClick={() => {
                      resetEntryForm();
                      setEditingEntry(null);
                      setEntryFormError(null);
                      setShowAddEntry(true);
                    }}
                    className="bg-gradient-to-r from-cyan-300 to-blue-700 text-white px-4 py-2 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                    style={{ fontSize: 'var(--text-sm)' }}
                  >
                    <Plus className="w-4 h-4" />
                    ADD
                  </button>
                </div>

                {isLoading ? (
                  <div className="glass-card p-12 text-center">
                    <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </div>
                ) : entries.length === 0 ? (
                  <div className="glass-card p-12 text-center">
                    <Wallet className="w-16 h-16 mx-auto mb-4 opacity-30" style={{ color: 'var(--cube-pink)' }} />
                    <p style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', color: 'var(--cube-gray-900)' }}>
                      No holdings yet
                    </p>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--cube-gray-900)', opacity: 0.7, marginTop: 'var(--space-2)' }}>
                      Add stocks or gold to start tracking
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {performance?.entries_performance.map((entryPerf) => {
                      const entry = entryPerf.entry;
                      const isExpanded = expandedEntries.has(entry.id!);
                      const isPositive = entryPerf.gain_loss >= 0;

                      return (
                        <div key={entry.id} className="glass-card p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold"
                                  style={{
                                    backgroundColor: entry.asset_type === "stock" ? '#dbeafe' : '#fef3c7',
                                    color: entry.asset_type === "stock" ? '#1e40af' : '#92400e',
                                  }}
                                >
                                  {entry.asset_type.toUpperCase()}
                                </span>
                                {entry.currency && (
                                  <span
                                    className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold"
                                    style={{
                                      backgroundColor: entry.currency === displayCurrency ? '#d1fae5' : '#fce7f3',
                                      color: entry.currency === displayCurrency ? '#065f46' : '#9f1239',
                                    }}
                                  >
                                    {entry.currency}
                                  </span>
                                )}
                                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', color: 'var(--cube-gray-900)' }}>
                                  {entry.symbol}
                                </h3>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--cube-gray-500)', marginBottom: '2px' }}>
                                    Current Value
                                  </p>
                                  <p style={{ fontWeight: 'var(--font-bold)', color: 'var(--cube-gray-900)' }}>
                                    {formatCurrency(entryPerf.current_value)}
                                  </p>
                                </div>
                                <div>
                                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--cube-gray-500)', marginBottom: '2px' }}>
                                    P&L
                                  </p>
                                  <p style={{ fontWeight: 'var(--font-bold)', color: isPositive ? '#10b981' : '#ef4444' }}>
                                    {formatCurrency(entryPerf.gain_loss)}
                                  </p>
                                  <p style={{ fontSize: 'var(--text-xs)', color: isPositive ? '#10b981' : '#ef4444' }}>
                                    {formatPercentage(entryPerf.gain_loss_percentage)}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <button
                                onClick={() => handleEditEntry(entry)}
                                className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center hover:bg-blue-200 transition-all"
                              >
                                <Edit className="w-4 h-4" style={{ color: '#2563eb' }} />
                              </button>
                              <button
                                onClick={() => handleDeleteEntry(entry.id!)}
                                className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center hover:bg-red-200 transition-all"
                              >
                                <Trash2 className="w-4 h-4" style={{ color: '#dc2626' }} />
                              </button>
                              <button
                                onClick={() => toggleExpanded(entry.id!)}
                                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-all"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4" style={{ color: 'var(--cube-gray-700)' }} />
                                ) : (
                                  <ChevronDown className="w-4 h-4" style={{ color: 'var(--cube-gray-700)' }} />
                                )}
                              </button>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="pt-3 border-t space-y-2" style={{ borderColor: 'rgba(0, 0, 0, 0.1)' }}>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--cube-gray-500)' }}>
                                    Quantity {entry.asset_type === "gold" && entry.unit ? `(${getUnitLabel(entry.unit)})` : ""}
                                  </p>
                                  <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', color: 'var(--cube-gray-900)' }}>
                                    {entry.quantity}
                                    {entry.asset_type === "gold" && entry.unit && (
                                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--cube-gray-500)', marginLeft: 'var(--space-1)' }}>
                                        ({convertToGrams(entry.quantity, entry.unit).toFixed(2)}g)
                                      </span>
                                    )}
                                  </p>
                                </div>
                                <div>
                                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--cube-gray-500)' }}>
                                    Purchase Price per {entry.asset_type === "gold" && entry.unit ? entry.unit : "share"} ({displayCurrency})
                                  </p>
                                  <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', color: 'var(--cube-gray-900)' }}>
                                    {formatCurrency(entryPerf.purchase_price || 0)}
                                  </p>
                                </div>
                                <div>
                                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--cube-gray-500)' }}>
                                    Current Price per {entry.asset_type === "gold" && entry.unit ? entry.unit : "share"} ({displayCurrency})
                                  </p>
                                  <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', color: 'var(--cube-gray-900)' }}>
                                    {formatCurrency(entryPerf.current_price)}
                                  </p>
                                </div>
                                <div>
                                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--cube-gray-500)' }}>Purchase Date</p>
                                  <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', color: 'var(--cube-gray-900)' }}>
                                    {formatDate(entry.purchase_date)}
                                  </p>
                                </div>
                                {entry.currency && entry.currency !== displayCurrency && entryPerf.exchange_rate && (
                                  <div className="col-span-2">
                                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--cube-gray-500)' }}>Exchange Rate</p>
                                    <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', color: 'var(--cube-gray-900)' }}>
                                      1 {entry.currency} = {entryPerf.exchange_rate.toFixed(4)} {displayCurrency}
                                    </p>
                                  </div>
                                )}
                              </div>
                              {entry.asset_type === "gold" && entry.gold_type && (
                                <div>
                                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--cube-gray-500)' }}>Gold Type</p>
                                  <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', color: 'var(--cube-gray-900)' }}>
                                    {entry.gold_type}
                                  </p>
                                </div>
                              )}
                              {entry.notes && (
                                <div>
                                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--cube-gray-500)' }}>Notes</p>
                                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--cube-gray-900)' }}>{entry.notes}</p>
                                </div>
                              )}
                              {entry.tags && (
                                <div>
                                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--cube-gray-500)' }}>Tags</p>
                                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--cube-gray-900)' }}>{entry.tags}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {!selectedPortfolio && portfolios.length === 0 && (
            <div className="glass-card p-12 text-center">
              <Wallet className="w-16 h-16 mx-auto mb-4 opacity-30" style={{ color: 'var(--cube-pink)' }} />
              <p style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', color: 'var(--cube-gray-900)' }}>
                No portfolios yet
              </p>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--cube-gray-900)', opacity: 0.7, marginTop: 'var(--space-2)' }}>
                Create your first portfolio to start tracking investments
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Portfolio Modal */}
      <Modal
        isOpen={showCreatePortfolio}
        onClose={() => {
          setShowCreatePortfolio(false);
          resetPortfolioForm();
        }}
        title="Create Portfolio"
        size="md"
      >
        {portfolioFormError && (
          <ErrorAlert message={portfolioFormError} onDismiss={() => setPortfolioFormError(null)} />
        )}
        <div className="space-y-4">
          <div>
            <Label required>Portfolio Name</Label>
            <Input
              type="text"
              value={portfolioName}
              onChange={(e) => setPortfolioName(e.target.value)}
              placeholder="e.g., Growth Portfolio"
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={portfolioDescription}
              onChange={(e) => setPortfolioDescription(e.target.value)}
              placeholder="Optional description"
              rows={3}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setShowCreatePortfolio(false);
                resetPortfolioForm();
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" className="flex-1" onClick={handleCreatePortfolio}>
              Create
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add/Edit Entry Modal */}
      <Modal
        isOpen={showAddEntry}
        onClose={() => {
          setShowAddEntry(false);
          resetEntryForm();
        }}
        title={editingEntry ? "Edit Entry" : "Add Entry"}
        size="lg"
      >
        {entryFormError && <ErrorAlert message={entryFormError} onDismiss={() => setEntryFormError(null)} />}
        <div className="space-y-4">
          <div>
            <Label required>Asset Type</Label>
            <Select
              value={entryAssetType}
              onChange={(e) => {
                const newType = e.target.value as "stock" | "gold";
                setEntryAssetType(newType);
                // Auto-set defaults for gold
                if (newType === "gold") {
                  setEntryCurrency("VND");
                  setEntrySource("sjc");
                } else {
                  setEntryCurrency("USD");
                  setEntrySource("");
                }
              }}
            >
              <option value="stock">Stock</option>
              <option value="gold">Gold</option>
            </Select>
          </div>

          {entryAssetType === "gold" ? (
            <>
              {/* Gold-specific fields */}
              <div>
                <Label required>Gold Price ID</Label>
                <Select
                  value={goldType}
                  onChange={(e) => {
                    const newGoldType = e.target.value;
                    setGoldType(newGoldType);
                    // Auto-select the correct unit based on gold ID and source
                    if (newGoldType && entrySource) {
                      const correctUnit = getGoldUnitByIdAndSource(newGoldType, entrySource);
                      setGoldUnit(correctUnit);
                    }
                  }}
                >
                  <option value="">Select gold price ID</option>
                  <optgroup label="SJC - Gold Bars (per tael/lượng)">
                    <option value="1">SJC 1L, 10L, 1KG - Ho Chi Minh</option>
                    <option value="2">SJC 1L, 10L, 1KG - Ha Noi</option>
                  </optgroup>
                  <optgroup label="SJC - Jewelry/Rings (per mace/chỉ)">
                    <option value="49">SJC Nhẫn 99.99% (1 chỉ, 2 chỉ, 5 chỉ)</option>
                  </optgroup>
                </Select>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--cube-gray-500)', marginTop: 'var(--space-1)' }}>
                  Select the gold price source to track
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label required>Unit</Label>
                  <Select value={goldUnit} onChange={(e) => setGoldUnit(e.target.value as any)}>
                    <option value="mace">Mace/Chỉ (3.75g) - Default for VN</option>
                    <option value="tael">Tael/Lượng (37.5g)</option>
                    <option value="gram">Gram (g)</option>
                    <option value="ounce">Troy Ounce (31.1g)</option>
                    <option value="kg">Kilogram (kg)</option>
                  </Select>
                  <p style={{ fontSize: 'var(--text-xs)', color: '#6366f1', marginTop: 'var(--space-1)' }}>
                    💡 You can enter in any unit - prices will be auto-converted for comparison
                  </p>
                  <p style={{ fontSize: 'var(--text-xs)', color: '#10b981', marginTop: 'var(--space-1)' }}>
                    ℹ️ {entrySource ? entrySource.toUpperCase() : 'API'} returns prices per tael, conversion handled automatically
                  </p>
                </div>
                <div>
                  <Label required>Quantity</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={entryQuantity}
                    onChange={(e) => setEntryQuantity(e.target.value)}
                    placeholder={`Number of ${goldUnit}s`}
                  />
                </div>
              </div>

              <div>
                <Label required>Purchase Price per {getUnitLabel(goldUnit)}</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={entryPurchasePrice}
                  onChange={(e) => setEntryPurchasePrice(e.target.value)}
                  placeholder="Price per unit"
                />
                {entryQuantity && entryPurchasePrice && (
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--cube-gray-600)', marginTop: 'var(--space-1)' }}>
                    Total: {formatCurrencyUtil(parseFloat(entryPurchasePrice) * parseFloat(entryQuantity), entryCurrency)}
                  </p>
                )}
                <p style={{ fontSize: 'var(--text-xs)', color: '#10b981', marginTop: 'var(--space-1)' }}>
                  ✓ Enter your purchase price in your preferred unit - system handles conversion
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Stock-specific fields */}
              <div>
                <Label required>Symbol</Label>
                <Input
                  type="text"
                  value={entrySymbol}
                  onChange={(e) => setEntrySymbol(e.target.value)}
                  placeholder="e.g., AAPL, MSFT"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label required>Quantity</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={entryQuantity}
                    onChange={(e) => setEntryQuantity(e.target.value)}
                    placeholder="Number of shares"
                  />
                </div>
                <div>
                  <Label required>Purchase Price per Share</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={entryPurchasePrice}
                    onChange={(e) => setEntryPurchasePrice(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </>
          )}
          <div>
            <CurrencySelect
              label="Currency"
              value={entryCurrency}
              onChange={setEntryCurrency}
              id="entry-currency"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label required>Purchase Date</Label>
              <Input
                type="date"
                value={entryPurchaseDate}
                onChange={(e) => setEntryPurchaseDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Transaction Fees</Label>
              <Input
                type="number"
                step="0.01"
                value={entryFees}
                onChange={(e) => setEntryFees(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>
          <div>
            <Label required={entryAssetType === "gold"}>Source</Label>
            {entryAssetType === "gold" ? (
              <>
                <Select
                  value={entrySource}
                  onChange={(e) => {
                    const newSource = e.target.value;
                    setEntrySource(newSource);
                    // Auto-select the correct unit based on source and gold ID
                    if (newSource && goldType) {
                      const correctUnit = getGoldUnitByIdAndSource(goldType, newSource);
                      setGoldUnit(correctUnit);
                    }
                  }}
                >
                  <option value="">Select source</option>
                  <option value="sjc">SJC Gold</option>
                </Select>
                <p style={{ fontSize: 'var(--text-xs)', color: '#2563eb', marginTop: 'var(--space-1)' }}>
                  💡 Source determines which API to use for current prices
                </p>
              </>
            ) : (
              <Input
                type="text"
                value={entrySource}
                onChange={(e) => setEntrySource(e.target.value)}
                placeholder="e.g., yahoo_finance"
              />
            )}
          </div>
          <div>
            <Label>Tags</Label>
            <Input
              type="text"
              value={entryTags}
              onChange={(e) => setEntryTags(e.target.value)}
              placeholder="e.g., tech, growth"
            />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea
              value={entryNotes}
              onChange={(e) => setEntryNotes(e.target.value)}
              placeholder="Optional notes"
              rows={3}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setShowAddEntry(false);
                resetEntryForm();
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" className="flex-1" onClick={handleSaveEntry}>
              {editingEntry ? "Update" : "Add"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Portfolio Confirm Dialog */}
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
