import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  RefreshCw,
  Wallet,
  Activity,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
} from "lucide-react";
import type {
  TradingPlatformId,
  LoanPackage,
  Order,
  Deal,
  StockInfo,
  OHLC,
  OhlcResolution,
} from "@fin-catch/shared";
import { Button } from "@fin-catch/ui/atoms";
import { MultiSymbolSubscription, SymbolCard } from "@fin-catch/ui/molecules";
import {
  OrderForm,
  OrderBook,
  Holdings,
  MarketDataTicker,
  MarketDepth,
  MarketIndexBar,
  TickTape,
} from "@fin-catch/ui/organisms";
import { usePlatformServices } from "@fin-catch/ui/platform";

/**
 * TradingOperationsPage component
 *
 * Main trading page accessible at /trading/operations
 * URL params: ?platform=dnse&account=123
 *
 * Features:
 * - Multi-symbol subscription with OHLC support
 * - Responsive symbol card grid (1-4 columns)
 * - Order placement form
 * - Order book (today's orders)
 * - Holdings (current positions)
 */
export interface TradingOperationsPageProps {
  /** Base path for navigation */
  basePath?: string;
}

export const TradingOperationsPage: React.FC<TradingOperationsPageProps> = ({
  basePath,
}) => {
  const navigate = useNavigate();
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
  const [includeOhlc, setIncludeOhlc] = useState(false);
  const [ohlcResolution, setOhlcResolution] = useState<OhlcResolution>("1");
  const [isSubscribing, setIsSubscribing] = useState(false);

  // Selected symbol state (for detail panel)
  const [selectedSymbol, setSelectedSymbol] = useState<string>("");
  const [currentPrice, setCurrentPrice] = useState<number | undefined>();
  const [showDetailPanel, setShowDetailPanel] = useState(true);

  // Loading state
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [isLoadingDeals, setIsLoadingDeals] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        // Select first symbol if none selected
        if (!selectedSymbol && symbols.length > 0) {
          setSelectedSymbol(symbols[0]);
        }
      } catch (err) {
        console.error("Failed to subscribe to symbols:", err);
      } finally {
        setIsSubscribing(false);
      }
    },
    [marketDataService, platform, selectedSymbol],
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

        // Clear selection if this was the selected symbol
        if (selectedSymbol === symbol) {
          const remaining = subscribedSymbols.filter((s) => s !== symbol);
          setSelectedSymbol(remaining.length > 0 ? remaining[0] : "");
        }
      } catch (err) {
        console.error("Failed to unsubscribe from symbol:", err);
      }
    },
    [
      marketDataService,
      platform,
      selectedSymbol,
      subscribedSymbols,
      includeOhlc,
      ohlcResolution,
    ],
  );

  // Update symbol data from market data service cache
  useEffect(() => {
    if (!marketDataService || subscribedSymbols.length === 0) return;

    const updateData = () => {
      const newSymbolData = new Map<string, StockInfo>();
      const newOhlcData = new Map<string, OHLC>();

      for (const symbol of subscribedSymbols) {
        const snapshot = marketDataService.getSnapshot(symbol);
        if (snapshot) {
          newSymbolData.set(symbol, snapshot);
        }

        if (includeOhlc) {
          const ohlc = marketDataService.getOhlc(symbol, ohlcResolution);
          if (ohlc) {
            newOhlcData.set(`${symbol}:${ohlcResolution}`, ohlc);
          }
        }
      }

      setSymbolData(newSymbolData);
      setOhlcData(newOhlcData);
    };

    // Initial update
    updateData();

    // Poll for updates (market data is pushed via SSE, but we need to read from cache)
    const interval = setInterval(updateData, 1000);

    return () => clearInterval(interval);
  }, [marketDataService, subscribedSymbols, includeOhlc, ohlcResolution]);

  // Get OHLC for a symbol
  const getOhlcForSymbol = useCallback(
    (symbol: string): OHLC | null => {
      return ohlcData.get(`${symbol}:${ohlcResolution}`) || null;
    },
    [ohlcData, ohlcResolution],
  );

  // Handle symbol card click
  const handleSymbolClick = useCallback((symbol: string) => {
    setSelectedSymbol(symbol);
    setCurrentPrice(undefined);
    setShowDetailPanel(true);
  }, []);

  // Handle order placed
  const handleOrderPlaced = useCallback(() => {
    loadOrders();
    loadDeals();
  }, [loadOrders, loadDeals]);

  // Handle order cancelled
  const handleOrderCancelled = useCallback(() => {
    loadOrders();
  }, [loadOrders]);

  // Handle deal click (for selling)
  const handleDealClick = useCallback((deal: Deal) => {
    setSelectedSymbol(deal.symbol);
    setShowDetailPanel(true);
  }, []);

  // Handle price update from market data ticker
  const handlePriceUpdate = useCallback((price: number | undefined) => {
    setCurrentPrice(price);
  }, []);

  // Handle price click from order book depth
  const handlePriceClick = useCallback(
    (price: number, _side: "bid" | "ask") => {
      console.log("Price clicked:", price);
    },
    [],
  );

  // Handle back navigation
  const handleBack = () => {
    navigate(basePath ? `${basePath}/trading` : "/trading");
  };

  // Refresh all data
  const handleRefreshAll = () => {
    loadOrders();
    loadDeals();
  };

  // Sorted symbols for grid display
  const sortedSymbols = useMemo(() => {
    return [...subscribedSymbols].sort((a, b) => {
      const dataA = symbolData.get(a);
      const dataB = symbolData.get(b);
      // Sort by change percent descending (best performers first)
      const changeA = dataA?.changePercent ?? 0;
      const changeB = dataB?.changePercent ?? 0;
      return changeB - changeA;
    });
  }, [subscribedSymbols, symbolData]);

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
          </div>
          <MultiSymbolSubscription
            onSubscribe={handleSubscribe}
            onUnsubscribe={handleUnsubscribe}
            subscribedSymbols={subscribedSymbols}
            loading={isSubscribing}
          />
        </div>

        {/* Subscribed Symbols Grid - Responsive 1-4 columns */}
        {subscribedSymbols.length > 0 && (
          <div
            className="grid gap-3"
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            }}
          >
            {sortedSymbols.map((symbol) => (
              <SymbolCard
                key={symbol}
                symbol={symbol}
                stockInfo={symbolData.get(symbol) || null}
                ohlc={getOhlcForSymbol(symbol)}
                isSelected={selectedSymbol === symbol}
                onClick={() => handleSymbolClick(symbol)}
                showOhlc={includeOhlc}
              />
            ))}
          </div>
        )}

        {/* Selected Symbol Detail Panel */}
        {selectedSymbol && (
          <div
            className="rounded-2xl border overflow-hidden"
            style={{
              background: "rgba(26, 31, 58, 0.6)",
              backdropFilter: "blur(16px)",
              borderColor: "rgba(0, 212, 255, 0.3)",
            }}
          >
            {/* Panel Header - Collapsible */}
            <button
              className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
              onClick={() => setShowDetailPanel(!showDetailPanel)}
            >
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4" style={{ color: "#00d4ff" }} />
                <span className="font-semibold" style={{ color: "#00d4ff" }}>
                  {selectedSymbol} Detail
                </span>
              </div>
              {showDetailPanel ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>

            {/* Panel Content */}
            {showDetailPanel && (
              <div className="p-4 pt-0 grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Market Data Column */}
                <div className="space-y-4">
                  <MarketDataTicker
                    symbol={selectedSymbol}
                    platform={platform}
                    showDetails={true}
                    onPriceUpdate={handlePriceUpdate}
                  />
                  <MarketDepth
                    symbol={selectedSymbol}
                    platform={platform}
                    maxLevels={10}
                    onPriceClick={handlePriceClick}
                  />
                </div>

                {/* Tick Tape Column */}
                <div>
                  <TickTape
                    symbol={selectedSymbol}
                    platform={platform}
                    maxTicks={20}
                  />
                </div>

                {/* Order Form Column */}
                <div>
                  {isLoadingPackages ? (
                    <div
                      className="rounded-lg p-6 flex flex-col items-center justify-center"
                      style={{
                        background: "rgba(15, 23, 42, 0.5)",
                        minHeight: "200px",
                      }}
                    >
                      <Loader2
                        className="w-5 h-5 animate-spin"
                        style={{ color: "#00d4ff" }}
                      />
                      <span className="mt-2 text-sm text-gray-400">
                        Loading...
                      </span>
                    </div>
                  ) : (
                    <OrderForm
                      tradingService={tradingService}
                      platform={platform}
                      accountNo={accountNo}
                      loanPackages={loanPackages}
                      onOrderPlaced={handleOrderPlaced}
                      initialSymbol={selectedSymbol}
                      initialPrice={currentPrice}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Orders and Holdings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Order Book */}
          <OrderBook
            tradingService={tradingService}
            platform={platform}
            accountNo={accountNo}
            orders={orders}
            isLoading={isLoadingOrders}
            onCancelOrder={handleOrderCancelled}
            onRefresh={loadOrders}
          />

          {/* Holdings */}
          <Holdings
            deals={deals}
            isLoading={isLoadingDeals}
            onRefresh={loadDeals}
            onDealClick={handleDealClick}
          />
        </div>
      </div>
    </div>
  );
};
