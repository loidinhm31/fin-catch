import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useNav } from "@fin-catch/ui/hooks";
import {
  ArrowLeft,
  RefreshCw,
  Wallet,
  LayoutGrid,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Briefcase,
} from "lucide-react";
import type {
  TradingPlatformId,
  LoanPackage,
  Order,
  Deal,
  StockInfo,
  OHLC,
  OhlcResolution,
  TopPrice,
} from "@fin-catch/shared";
import { Button } from "@fin-catch/ui/components/atoms";
import { MultiSymbolSubscription } from "@fin-catch/ui/components/molecules";
import {
  OrderBook,
  Holdings,
  MarketIndexBar,
  DraggableSymbolGrid,
} from "@fin-catch/ui/components/organisms";
import { usePlatformServices } from "@fin-catch/ui/platform";

/**
 * Storage key for collapsible section states
 */
const COLLAPSED_SECTIONS_KEY = "trading-collapsed-sections";

/**
 * Load collapsed section states from localStorage
 */
function loadCollapsedSections(): { orderBook: boolean; holdings: boolean } {
  try {
    const saved = localStorage.getItem(COLLAPSED_SECTIONS_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // Ignore errors
  }
  return { orderBook: false, holdings: false };
}

/**
 * Save collapsed section states to localStorage
 */
function saveCollapsedSections(state: {
  orderBook: boolean;
  holdings: boolean;
}): void {
  try {
    localStorage.setItem(COLLAPSED_SECTIONS_KEY, JSON.stringify(state));
  } catch {
    // Ignore errors
  }
}

/**
 * TradingOperationsPage component
 *
 * Main trading page accessible at /trading/operations
 * URL params: ?platform=dnse&account=123
 *
 * Features:
 * - Multi-symbol subscription with OHLC support
 * - Draggable symbol card grid with click-to-order popover
 * - Order book (today's orders) - collapsible
 * - Holdings (current positions) - collapsible
 */
export const TradingOperationsPage: React.FC = () => {
  const { nav } = useNav();
  const [searchParams] = useSearchParams();

  // Get params from URL
  const platform =
    (searchParams.get("platform") as TradingPlatformId) || "dnse";
  const accountNo = searchParams.get("account") || "";

  // Get services from platform context
  const { trading: tradingService, marketData: marketDataService } =
    usePlatformServices();

  // Data state
  const [loanPackages, setLoanPackages] = useState<LoanPackage[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);

  // Multi-symbol subscription state
  const [subscribedSymbols, setSubscribedSymbols] = useState<string[]>([]);
  const [symbolData, setSymbolData] = useState<Map<string, StockInfo>>(
    new Map(),
  );
  const [ohlcData, setOhlcData] = useState<Map<string, OHLC>>(new Map());
  const [topPriceData, setTopPriceData] = useState<Map<string, TopPrice>>(
    new Map(),
  );
  const [includeOhlc, setIncludeOhlc] = useState(false);
  const [ohlcResolution, setOhlcResolution] = useState<OhlcResolution>("1");
  const [isSubscribing, setIsSubscribing] = useState(false);

  // Collapsible section states
  const [collapsedSections, setCollapsedSections] = useState(() =>
    loadCollapsedSections(),
  );

  // Loading state
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [isLoadingDeals, setIsLoadingDeals] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Toggle section collapse
  const toggleSection = useCallback((section: "orderBook" | "holdings") => {
    setCollapsedSections((prev) => {
      const newState = { ...prev, [section]: !prev[section] };
      saveCollapsedSections(newState);
      return newState;
    });
  }, []);

  // Load loan packages
  const loadLoanPackages = useCallback(async () => {
    if (!tradingService || !accountNo) {
      setIsLoadingPackages(false);
      return;
    }

    setIsLoadingPackages(true);
    try {
      const packages = await tradingService.getLoanPackages(
        platform,
        accountNo,
      );
      setLoanPackages(packages);
    } catch (err) {
      console.error("Failed to load loan packages:", err);
    } finally {
      setIsLoadingPackages(false);
    }
  }, [tradingService, platform, accountNo]);

  // Load orders
  const loadOrders = useCallback(async () => {
    if (!tradingService || !accountNo) {
      setIsLoadingOrders(false);
      return;
    }

    setIsLoadingOrders(true);
    try {
      const orderList = await tradingService.getOrders(platform, accountNo);
      setOrders(orderList);
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setIsLoadingOrders(false);
    }
  }, [tradingService, platform, accountNo]);

  // Load deals
  const loadDeals = useCallback(async () => {
    if (!tradingService || !accountNo) {
      setIsLoadingDeals(false);
      return;
    }

    setIsLoadingDeals(true);
    try {
      const dealList = await tradingService.getDeals(platform, accountNo);
      setDeals(dealList);
    } catch (err) {
      console.error("Failed to load deals:", err);
    } finally {
      setIsLoadingDeals(false);
    }
  }, [tradingService, platform, accountNo]);

  // Initial load
  useEffect(() => {
    if (!accountNo) {
      setError("Account number is required");
      return;
    }

    loadLoanPackages();
    loadOrders();
    loadDeals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountNo]);

  // Handle multi-symbol subscription
  const handleSubscribe = useCallback(
    async (
      symbols: string[],
      withOhlc: boolean,
      resolution: OhlcResolution,
    ) => {
      if (!marketDataService) return;

      setIsSubscribing(true);
      setIncludeOhlc(withOhlc);
      setOhlcResolution(resolution);

      try {
        // Use batch subscribe with OHLC option
        await marketDataService.subscribeBatchWithOhlc(platform, {
          symbols,
          includeOhlc: withOhlc,
          ohlcResolution: resolution,
        });

        // Update subscribed symbols list
        setSubscribedSymbols((prev) => [
          ...prev,
          ...symbols.filter((s) => !prev.includes(s)),
        ]);
      } catch (err) {
        console.error("Failed to subscribe to symbols:", err);
      } finally {
        setIsSubscribing(false);
      }
    },
    [marketDataService, platform],
  );

  // Handle symbol unsubscription
  const handleUnsubscribe = useCallback(
    async (symbol: string) => {
      if (!marketDataService) return;

      try {
        await marketDataService.unsubscribe(platform, symbol);
        if (includeOhlc) {
          await marketDataService.unsubscribeOhlc(
            platform,
            symbol,
            ohlcResolution,
          );
        }

        setSubscribedSymbols((prev) => prev.filter((s) => s !== symbol));
        setSymbolData((prev) => {
          const next = new Map(prev);
          next.delete(symbol);
          return next;
        });
        setOhlcData((prev) => {
          const next = new Map(prev);
          next.delete(`${symbol}:${ohlcResolution}`);
          return next;
        });
        setTopPriceData((prev) => {
          const next = new Map(prev);
          next.delete(symbol);
          return next;
        });
      } catch (err) {
        console.error("Failed to unsubscribe from symbol:", err);
      }
    },
    [marketDataService, platform, includeOhlc, ohlcResolution],
  );

  // Update symbol data from market data service cache
  useEffect(() => {
    if (!marketDataService || subscribedSymbols.length === 0) return;

    const updateData = () => {
      const newSymbolData = new Map<string, StockInfo>();
      const newOhlcData = new Map<string, OHLC>();
      const newTopPriceData = new Map<string, TopPrice>();

      for (const symbol of subscribedSymbols) {
        // Get stock info snapshot
        const snapshot = marketDataService.getSnapshot(symbol);
        if (snapshot) {
          newSymbolData.set(symbol, snapshot);
        }

        // Get OHLC data
        if (includeOhlc) {
          const ohlc = marketDataService.getOhlc(symbol, ohlcResolution);
          if (ohlc) {
            newOhlcData.set(`${symbol}:${ohlcResolution}`, ohlc);
          }
        }

        // Get top price (bid/ask) data from order book
        const topPrice = marketDataService.getOrderBook(symbol);
        if (topPrice) {
          newTopPriceData.set(symbol, topPrice);
        }
      }

      setSymbolData(newSymbolData);
      setOhlcData(newOhlcData);
      setTopPriceData(newTopPriceData);
    };

    // Initial update
    updateData();

    // Poll for updates (market data is pushed via SSE, but we need to read from cache)
    const interval = setInterval(updateData, 1000);

    return () => clearInterval(interval);
  }, [marketDataService, subscribedSymbols, includeOhlc, ohlcResolution]);

  // Handle order placed from card popover
  const handleOrderPlaced = useCallback(() => {
    loadOrders();
    loadDeals();
  }, [loadOrders, loadDeals]);

  // Handle order cancelled
  const handleOrderCancelled = useCallback(() => {
    loadOrders();
  }, [loadOrders]);

  // Handle deal click (for selling from holdings)
  const handleDealClick = useCallback(
    (deal: Deal) => {
      // Subscribe to the deal's symbol if not already subscribed
      if (!subscribedSymbols.includes(deal.symbol)) {
        handleSubscribe([deal.symbol], includeOhlc, ohlcResolution);
      }
    },
    [subscribedSymbols, handleSubscribe, includeOhlc, ohlcResolution],
  );

  // Handle card reorder
  const handleReorder = useCallback((newOrder: string[]) => {
    setSubscribedSymbols(newOrder);
  }, []);

  // Handle back navigation
  const handleBack = () => {
    nav("trading");
  };

  // Refresh all data
  const handleRefreshAll = () => {
    loadOrders();
    loadDeals();
  };

  if (!tradingService) {
    return (
      <div className="p-6">
        <div
          className="rounded-2xl p-6 border text-center"
          style={{
            background: "rgba(26, 31, 58, 0.6)",
            backdropFilter: "blur(16px)",
            borderColor: "rgba(255, 51, 102, 0.3)",
            color: "#ff3366",
          }}
        >
          Trading service not available
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div
          className="rounded-2xl p-6 border text-center"
          style={{
            background: "rgba(26, 31, 58, 0.6)",
            backdropFilter: "blur(16px)",
            borderColor: "rgba(255, 51, 102, 0.3)",
            color: "#ff3366",
          }}
        >
          <p className="mb-4">{error}</p>
          <Button variant="secondary" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Trading
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div
          className="rounded-2xl p-4 md:p-6 border"
          style={{
            background: "rgba(26, 31, 58, 0.6)",
            backdropFilter: "blur(16px)",
            borderColor: "rgba(123, 97, 255, 0.2)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="p-2 rounded-lg transition-colors hover:bg-white/10"
              >
                <ArrowLeft
                  className="w-5 h-5"
                  style={{ color: "var(--color-text-secondary)" }}
                />
              </button>
              <div className="flex items-center gap-3">
                <div
                  className="p-2 rounded-lg"
                  style={{ background: "rgba(0, 212, 255, 0.1)" }}
                >
                  <Wallet className="w-5 h-5" style={{ color: "#00d4ff" }} />
                </div>
                <div>
                  <h1
                    className="text-lg md:text-xl font-bold"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    Trading Operations
                  </h1>
                  <p
                    className="text-xs md:text-sm"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {platform.toUpperCase()} - Account: {accountNo}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={handleRefreshAll}
              className="p-2 rounded-lg transition-colors hover:bg-white/10"
              title="Refresh All"
            >
              <RefreshCw
                className="w-5 h-5"
                style={{ color: "var(--color-text-secondary)" }}
              />
            </button>
          </div>
        </div>

        {/* Market Index Bar */}
        <MarketIndexBar platform={platform} />

        {/* Multi-Symbol Subscription */}
        <div
          className="rounded-2xl p-4 border"
          style={{
            background: "rgba(26, 31, 58, 0.6)",
            backdropFilter: "blur(16px)",
            borderColor: "rgba(0, 212, 255, 0.2)",
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <LayoutGrid className="w-4 h-4" style={{ color: "#00d4ff" }} />
            <h2 className="text-sm font-semibold" style={{ color: "#00d4ff" }}>
              Market Watch
            </h2>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                background: "rgba(0, 212, 255, 0.1)",
                color: "#00d4ff",
              }}
            >
              Click card to trade
            </span>
          </div>
          <MultiSymbolSubscription
            onSubscribe={handleSubscribe}
            onUnsubscribe={handleUnsubscribe}
            subscribedSymbols={subscribedSymbols}
            loading={isSubscribing}
          />
        </div>

        {/* Draggable Symbol Grid */}
        {!isLoadingPackages && tradingService && (
          <DraggableSymbolGrid
            symbols={subscribedSymbols}
            symbolData={symbolData}
            topPriceData={topPriceData}
            onReorder={handleReorder}
            tradingService={tradingService}
            platform={platform}
            accountNo={accountNo}
            loanPackages={loanPackages}
            onOrderPlaced={handleOrderPlaced}
            showMarketDepth={true}
            showTickTape={true}
          />
        )}

        {/* Collapsible Bottom Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Order Book - Collapsible */}
          <div
            className="rounded-2xl border overflow-hidden"
            style={{
              background: "rgba(26, 31, 58, 0.6)",
              backdropFilter: "blur(16px)",
              borderColor: "rgba(123, 97, 255, 0.2)",
            }}
          >
            <button
              onClick={() => toggleSection("orderBook")}
              className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" style={{ color: "#00d4ff" }} />
                <span
                  className="font-semibold text-sm"
                  style={{ color: "#00d4ff" }}
                >
                  Order Book
                </span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: "rgba(0, 212, 255, 0.1)",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  {orders.length} orders
                </span>
              </div>
              {collapsedSections.orderBook ? (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              )}
            </button>
            <div
              style={{
                maxHeight: collapsedSections.orderBook ? "0px" : "400px",
                overflow: "hidden",
                transition: "max-height 0.3s ease-in-out",
              }}
            >
              <div className="p-4 pt-0">
                <OrderBook
                  tradingService={tradingService}
                  platform={platform}
                  accountNo={accountNo}
                  orders={orders}
                  isLoading={isLoadingOrders}
                  onCancelOrder={handleOrderCancelled}
                  onRefresh={loadOrders}
                />
              </div>
            </div>
          </div>

          {/* Holdings - Collapsible */}
          <div
            className="rounded-2xl border overflow-hidden"
            style={{
              background: "rgba(26, 31, 58, 0.6)",
              backdropFilter: "blur(16px)",
              borderColor: "rgba(123, 97, 255, 0.2)",
            }}
          >
            <button
              onClick={() => toggleSection("holdings")}
              className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" style={{ color: "#00ff88" }} />
                <span
                  className="font-semibold text-sm"
                  style={{ color: "#00ff88" }}
                >
                  Holdings
                </span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: "rgba(0, 255, 136, 0.1)",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  {deals.length} positions
                </span>
              </div>
              {collapsedSections.holdings ? (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              )}
            </button>
            <div
              style={{
                maxHeight: collapsedSections.holdings ? "0px" : "400px",
                overflow: "hidden",
                transition: "max-height 0.3s ease-in-out",
              }}
            >
              <div className="p-4 pt-0">
                <Holdings
                  deals={deals}
                  isLoading={isLoadingDeals}
                  onRefresh={loadDeals}
                  onDealClick={handleDealClick}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
