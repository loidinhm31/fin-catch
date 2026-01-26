import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, RefreshCw, Wallet, Activity } from "lucide-react";
import type {
  TradingPlatformId,
  LoanPackage,
  Order,
  Deal,
} from "@fin-catch/shared";
import { Button } from "@fin-catch/ui/atoms";
import { SymbolSearch } from "@fin-catch/ui/molecules";
import {
  OrderForm,
  OrderBook,
  Holdings,
  MarketDataTicker,
  MarketDepth,
} from "@fin-catch/ui/organisms";
import { usePlatformServices } from "@fin-catch/ui/platform";

/**
 * TradingOperationsPage component
 *
 * Main trading page accessible at /trading/operations
 * URL params: ?platform=dnse&account=123
 *
 * Features:
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

  // Get trading service from platform context
  const { trading: tradingService } = usePlatformServices();

  // Data state
  const [loanPackages, setLoanPackages] = useState<LoanPackage[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);

  // Market data state
  const [selectedSymbol, setSelectedSymbol] = useState<string>("");
  const [currentPrice, setCurrentPrice] = useState<number | undefined>();

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
      // Don't set error - packages are optional
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

  // Initial load - only run when accountNo changes, not when callbacks change
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

  // Auto-refresh disabled - users can manually refresh using the refresh button
  // This reduces API overhead and prevents interference with user input

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
    // Pre-populate sell by selecting the symbol
    setSelectedSymbol(deal.symbol);
    console.log("Deal clicked:", deal);
  }, []);

  // Handle symbol selection from market data
  const handleSymbolSelect = useCallback((symbol: string) => {
    setSelectedSymbol(symbol);
    setCurrentPrice(undefined); // Reset price until we get new data
  }, []);

  // Handle price update from market data ticker
  const handlePriceUpdate = useCallback((price: number | undefined) => {
    setCurrentPrice(price);
  }, []);

  // Handle price click from order book depth
  const handlePriceClick = useCallback(
    (price: number, _side: "bid" | "ask") => {
      // Could use this to pre-fill order form price
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
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div
          className="rounded-2xl p-6 border"
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
                    className="text-xl font-bold"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    Trading Operations
                  </h1>
                  <p
                    className="text-sm"
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

        {/* Main Content Grid - 4 Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Column 1: Market Data */}
          <div className="lg:col-span-1 space-y-4">
            {/* Section Header */}
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" style={{ color: "#00d4ff" }} />
              <h2
                className="text-lg font-semibold"
                style={{ color: "#00d4ff" }}
              >
                Market Data
              </h2>
            </div>

            {/* Symbol Search */}
            <SymbolSearch
              onSelect={handleSymbolSelect}
              initialValue={selectedSymbol}
            />

            {/* Market Data Ticker */}
            {selectedSymbol && (
              <>
                <MarketDataTicker
                  symbol={selectedSymbol}
                  platform={platform}
                  showDetails={true}
                  onPriceUpdate={handlePriceUpdate}
                />

                {/* Market Depth (Order Book L2) */}
                <MarketDepth
                  symbol={selectedSymbol}
                  platform={platform}
                  maxLevels={10}
                  onPriceClick={handlePriceClick}
                />
              </>
            )}

            {/* Placeholder when no symbol selected */}
            {!selectedSymbol && (
              <div
                className="rounded-2xl p-6 border text-center"
                style={{
                  background: "rgba(26, 31, 58, 0.6)",
                  backdropFilter: "blur(16px)",
                  borderColor: "rgba(0, 212, 255, 0.2)",
                }}
              >
                <p
                  className="text-sm"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Select a symbol to view real-time market data
                </p>
              </div>
            )}
          </div>

          {/* Column 2: Order Form */}
          <div className="lg:col-span-1">
            {isLoadingPackages ? (
              <div
                className="rounded-2xl p-6 border flex flex-col items-center justify-center"
                style={{
                  background: "rgba(26, 31, 58, 0.6)",
                  backdropFilter: "blur(16px)",
                  borderColor: "rgba(123, 97, 255, 0.2)",
                  minHeight: "300px",
                }}
              >
                <Loader2
                  className="w-5 h-5 animate-spin"
                  style={{ color: "#00d4ff" }}
                />
                <span
                  className="mt-2 text-sm"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Loading order form...
                </span>
                <button
                  onClick={loadLoanPackages}
                  className="mt-4 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors hover:bg-white/10"
                  style={{
                    background: "rgba(0, 212, 255, 0.1)",
                    border: "1px solid rgba(0, 212, 255, 0.3)",
                    color: "#00d4ff",
                  }}
                >
                  <RefreshCw className="w-4 h-4" />
                  Reload
                </button>
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

          {/* Columns 3-4: Orders and Holdings */}
          <div className="lg:col-span-2 space-y-6">
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
    </div>
  );
};
