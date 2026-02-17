import React, { useEffect, useState } from "react";
import { Coins, TrendingDown, TrendingUp } from "lucide-react";
import {
  GoldChartResponsive,
  GoldPremiumChartResponsive,
  GoldQueryForm,
  StockChartResponsive,
  StockQueryForm,
} from "@fin-catch/ui/components/organisms";
import {
  dateToUnixTimestamp,
  GoldPremiumRequest,
  GoldPremiumResponse,
  GoldPriceRequest,
  GoldPriceResponse,
  StockHistoryRequest,
  StockHistoryResponse,
} from "@fin-catch/shared";
import {
  fetchStockHistory,
  fetchGoldPrice,
  fetchGoldPremium as fetchGoldPremiumService,
} from "@fin-catch/ui/services";
import { DateRangePicker } from "@fin-catch/ui/components/molecules";

type ActiveTab = "stock" | "gold";

// Cube decoration component
const CubeShape = ({
  className = "",
  variant = "default",
}: {
  className?: string;
  variant?: "default" | "yellow" | "pink";
}) => (
  <div
    className={`cube-decoration ${variant === "yellow" ? "cube-yellow" : variant === "pink" ? "cube-pink" : ""} ${className}`}
  ></div>
);

export const FinancialDataPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>("stock");
  const [isLoading, setIsLoading] = useState(false);

  // Stock data state
  const [stockData, setStockData] = useState<StockHistoryResponse | null>(null);
  const [stockError, setStockError] = useState<string | null>(null);

  // Gold data state
  const [goldData, setGoldData] = useState<GoldPriceResponse | null>(null);
  const [goldError, setGoldError] = useState<string | null>(null);

  // Gold premium state
  const [showGoldPremium, setShowGoldPremium] = useState(false);
  const [goldPremiumData, setGoldPremiumData] =
    useState<GoldPremiumResponse | null>(null);
  const [goldPremiumError, setGoldPremiumError] = useState<string | null>(null);
  const [showFullPremiumChart, setShowFullPremiumChart] = useState(false);
  const [premiumDateRange, setPremiumDateRange] = useState<{
    from: Date;
    to: Date;
  }>(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 180); // Default 180 days
    return { from, to };
  });

  // AbortController for cancelling API requests
  const [premiumAbortController, setPremiumAbortController] =
    useState<AbortController | null>(null);

  const handleStockSubmit = async (request: StockHistoryRequest) => {
    setIsLoading(true);
    setStockError(null);

    try {
      const response = await fetchStockHistory(request);

      if (response.status === "error") {
        setStockError(response.error || "Failed to fetch stock data");
        setStockData(null);
      } else {
        setStockData(response);
        setStockError(null);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setStockError(errorMessage);
      setStockData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoldSubmit = async (request: GoldPriceRequest) => {
    setIsLoading(true);
    setGoldError(null);

    try {
      const response = await fetchGoldPrice(request);

      if (response.status === "error") {
        setGoldError(response.error || "Failed to fetch gold data");
        setGoldData(null);
      } else {
        setGoldData(response);
        setGoldError(null);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setGoldError(errorMessage);
      setGoldData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGoldPremium = async (dateRange: { from: Date; to: Date }) => {
    // Cancel previous request if it exists
    if (premiumAbortController) {
      premiumAbortController.abort();
    }

    // Create new AbortController for this request
    const abortController = new AbortController();
    setPremiumAbortController(abortController);

    setIsLoading(true);
    setGoldPremiumError(null);

    try {
      const request: GoldPremiumRequest = {
        from: dateToUnixTimestamp(dateRange.from),
        to: dateToUnixTimestamp(dateRange.to),
        gold_price_id: "49",
        currency_code: "USD",
        gold_source: "sjc",
        stock_source: "yahoo_finance",
      };

      const response = await fetchGoldPremiumService(request);

      if (response.status === "error") {
        setGoldPremiumError(
          response.error || "Failed to fetch gold premium data",
        );
        setGoldPremiumData(null);
      } else {
        setGoldPremiumData(response);
        setGoldPremiumError(null);
      }
    } catch (error) {
      // Don't show error if request was cancelled
      if (error instanceof Error && error.name === "CanceledError") {
        console.log("Request cancelled");
        return;
      }
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setGoldPremiumError(errorMessage);
      setGoldPremiumData(null);
    } finally {
      setIsLoading(false);
      setPremiumAbortController(null);
    }
  };

  const handleToggleGoldPremium = async () => {
    const newShowState = !showGoldPremium;
    setShowGoldPremium(newShowState);

    if (newShowState && !goldPremiumData) {
      // Fetch current date data
      const today = new Date();
      await fetchGoldPremium({ from: today, to: today });
    }
  };

  const handleToggleFullChart = async () => {
    const newShowFullState = !showFullPremiumChart;
    setShowFullPremiumChart(newShowFullState);

    if (newShowFullState) {
      // Fetch full date range data
      await fetchGoldPremium(premiumDateRange);
    } else {
      // Fetch only current date
      const today = new Date();
      await fetchGoldPremium({ from: today, to: today });
    }
  };

  const handlePremiumDateRangeChange = async (from: Date, to: Date) => {
    setPremiumDateRange({ from, to });
    if (showFullPremiumChart) {
      await fetchGoldPremium({ from, to });
    }
  };

  const currentData = activeTab === "stock" ? stockData : goldData;
  const currentError = activeTab === "stock" ? stockError : goldError;

  // Cleanup: Cancel any pending requests on unmount
  useEffect(() => {
    return () => {
      if (premiumAbortController) {
        premiumAbortController.abort();
      }
    };
  }, [premiumAbortController]);

  return (
    <div className="screen-explore cyber-grid-bg min-h-screen">
      {/* Main glass container */}
      <div className="relative z-10 mx-4 pb-28 min-h-[calc(100vh-4rem)] overflow-hidden">
        <div className="h-full">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1
                style={{
                  fontSize: "var(--text-3xl)",
                  fontWeight: "var(--font-bold)",
                  color: "var(--cube-gray-900)",
                }}
              >
                FIN-CATCH
              </h1>
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  color: "var(--cube-gray-900)",
                  opacity: 0.7,
                }}
              >
                Financial Data Query System
              </p>
            </div>
            <div className="flex items-center gap-2">
              <CubeShape className="animate-float" />
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-3 mb-3">
            <button
              onClick={() => setActiveTab("stock")}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all"
              style={
                activeTab === "stock"
                  ? {
                      background: "var(--color-tab-active-stock)",
                      color: "var(--color-text-primary)",
                      boxShadow: "var(--shadow-glow-cyan)",
                      fontSize: "var(--text-sm)",
                    }
                  : {
                      background: "var(--glass-bg-dark)",
                      color: "var(--color-tab-inactive-text)",
                      fontSize: "var(--text-sm)",
                    }
              }
            >
              <TrendingUp className="w-5 h-5" />
              STOCK
            </button>
            <button
              onClick={() => setActiveTab("gold")}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-2 rounded-xl font-bold transition-all"
              style={
                activeTab === "gold"
                  ? {
                      background: "var(--color-tab-active-gold)",
                      color: "var(--color-text-primary)",
                      boxShadow: "0 0 15px rgba(251, 191, 36, 0.5)",
                      fontSize: "var(--text-sm)",
                    }
                  : {
                      background: "var(--glass-bg-dark)",
                      color: "var(--color-tab-inactive-text)",
                      fontSize: "var(--text-sm)",
                    }
              }
            >
              <Coins className="w-5 h-5" />
              GOLD
            </button>
          </div>

          {/* Query Form Section */}
          <div className="mb-3">
            <h2
              style={{
                fontSize: "var(--text-xl)",
                fontWeight: "var(--font-bold)",
                color: "var(--cube-gray-900)",
                marginBottom: "var(--space-4)",
              }}
            >
              {activeTab === "stock" ? "Stock Query" : "Gold Query"}
            </h2>
            <div className="glass-card p-3">
              {activeTab === "stock" ? (
                <StockQueryForm
                  onSubmit={handleStockSubmit}
                  isLoading={isLoading}
                />
              ) : (
                <GoldQueryForm
                  onSubmit={handleGoldSubmit}
                  isLoading={isLoading}
                />
              )}
            </div>
          </div>

          {/* Error Display */}
          {currentError && (
            <div
              className="mb-6 p-4 rounded-xl"
              style={{
                backgroundColor: "var(--color-alert-error-bg)",
                borderWidth: "1px",
                borderStyle: "solid",
                borderColor: "var(--color-alert-error-border)",
              }}
            >
              <p
                style={{
                  fontWeight: "var(--font-bold)",
                  color: "var(--color-alert-error-text)",
                  fontSize: "var(--text-sm)",
                }}
              >
                Error
              </p>
              <p
                style={{
                  color: "var(--color-alert-error-text)",
                  fontSize: "var(--text-xs)",
                  marginTop: "var(--space-1)",
                }}
              >
                {currentError}
              </p>
            </div>
          )}

          {/* Chart Display Section */}
          {currentData && currentData.data && currentData.data.length > 0 ? (
            <div>
              {activeTab === "stock" && stockData ? (
                <StockChartResponsive
                  data={stockData.data!}
                  resolution={stockData.resolution}
                  symbol={stockData.symbol}
                />
              ) : activeTab === "gold" && goldData ? (
                <GoldChartResponsive
                  data={goldData.data!}
                  goldPriceId={goldData.gold_price_id}
                />
              ) : null}

              {/* Data Summary */}
              <div className="mt-6 glass-card p-6">
                <h3
                  style={{
                    fontSize: "var(--text-lg)",
                    fontWeight: "var(--font-bold)",
                    color: "var(--cube-gray-900)",
                    marginBottom: "var(--space-4)",
                  }}
                >
                  Data Summary
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {activeTab === "stock" && stockData && (
                    <>
                      <div>
                        <p
                          style={{
                            fontSize: "var(--text-xs)",
                            color: "var(--cube-gray-900)",
                            opacity: 0.6,
                          }}
                        >
                          Symbol
                        </p>
                        <p
                          style={{
                            fontSize: "var(--text-lg)",
                            fontWeight: "var(--font-bold)",
                            color: "var(--cube-gray-900)",
                          }}
                        >
                          {stockData.symbol}
                        </p>
                      </div>
                      <div>
                        <p
                          style={{
                            fontSize: "var(--text-xs)",
                            color: "var(--cube-gray-900)",
                            opacity: 0.6,
                          }}
                        >
                          Source
                        </p>
                        <p
                          style={{
                            fontSize: "var(--text-lg)",
                            fontWeight: "var(--font-bold)",
                            color: "var(--cube-gray-900)",
                          }}
                        >
                          {stockData.source}
                        </p>
                      </div>
                      <div>
                        <p
                          style={{
                            fontSize: "var(--text-xs)",
                            color: "var(--cube-gray-900)",
                            opacity: 0.6,
                          }}
                        >
                          Resolution
                        </p>
                        <p
                          style={{
                            fontSize: "var(--text-lg)",
                            fontWeight: "var(--font-bold)",
                            color: "var(--cube-gray-900)",
                          }}
                        >
                          {stockData.resolution}
                        </p>
                      </div>
                      <div>
                        <p
                          style={{
                            fontSize: "var(--text-xs)",
                            color: "var(--cube-gray-900)",
                            opacity: 0.6,
                          }}
                        >
                          Data Points
                        </p>
                        <p
                          style={{
                            fontSize: "var(--text-lg)",
                            fontWeight: "var(--font-bold)",
                            color: "var(--cube-gray-900)",
                          }}
                        >
                          {stockData.data?.length || 0}
                        </p>
                      </div>
                    </>
                  )}
                  {activeTab === "gold" && goldData && (
                    <>
                      <div>
                        <p
                          style={{
                            fontSize: "var(--text-xs)",
                            color: "var(--cube-gray-900)",
                            opacity: 0.6,
                          }}
                        >
                          Gold Type
                        </p>
                        <p
                          style={{
                            fontSize: "var(--text-lg)",
                            fontWeight: "var(--font-bold)",
                            color: "var(--cube-gray-900)",
                          }}
                        >
                          {goldData.gold_price_id}
                        </p>
                      </div>
                      <div>
                        <p
                          style={{
                            fontSize: "var(--text-xs)",
                            color: "var(--cube-gray-900)",
                            opacity: 0.6,
                          }}
                        >
                          Source
                        </p>
                        <p
                          style={{
                            fontSize: "var(--text-lg)",
                            fontWeight: "var(--font-bold)",
                            color: "var(--cube-gray-900)",
                          }}
                        >
                          {goldData.source}
                        </p>
                      </div>
                      <div>
                        <p
                          style={{
                            fontSize: "var(--text-xs)",
                            color: "var(--cube-gray-900)",
                            opacity: 0.6,
                          }}
                        >
                          Status
                        </p>
                        <p
                          style={{
                            fontSize: "var(--text-lg)",
                            fontWeight: "var(--font-bold)",
                            color: "var(--cube-gray-900)",
                          }}
                        >
                          {goldData.status}
                        </p>
                      </div>
                      <div>
                        <p
                          style={{
                            fontSize: "var(--text-xs)",
                            color: "var(--cube-gray-900)",
                            opacity: 0.6,
                          }}
                        >
                          Data Points
                        </p>
                        <p
                          style={{
                            fontSize: "var(--text-lg)",
                            fontWeight: "var(--font-bold)",
                            color: "var(--cube-gray-900)",
                          }}
                        >
                          {goldData.data?.length || 0}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card p-12 text-center">
              {activeTab === "stock" ? (
                <TrendingUp
                  className="w-20 h-20 mx-auto mb-4 opacity-30"
                  style={{ color: "var(--cube-cyan)" }}
                />
              ) : (
                <Coins
                  className="w-20 h-20 mx-auto mb-4 opacity-30"
                  style={{ color: "var(--cube-yellow)" }}
                />
              )}
              <p
                style={{
                  fontSize: "var(--text-lg)",
                  fontWeight: "var(--font-bold)",
                  color: "var(--cube-gray-900)",
                }}
              >
                No data yet
              </p>
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  color: "var(--cube-gray-900)",
                  opacity: 0.7,
                  marginTop: "var(--space-2)",
                }}
              >
                Submit a query to view the chart
              </p>
            </div>
          )}

          {/* Gold Premium Section */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2
                style={{
                  fontSize: "var(--text-xl)",
                  fontWeight: "var(--font-bold)",
                  color: "var(--cube-gray-900)",
                }}
              >
                Gold Premium Analysis
              </h2>
              <button
                onClick={handleToggleGoldPremium}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
                  showGoldPremium
                    ? "bg-amber-400 text-white shadow-amber-500/50"
                    : "glass-button text-gray-700"
                }`}
                style={{ fontSize: "var(--text-sm)" }}
              >
                <TrendingDown className="w-5 h-5" />
                {showGoldPremium ? "HIDE PREMIUM" : "SHOW PREMIUM"}
              </button>
            </div>

            {showGoldPremium && (
              <div className="space-y-4">
                {/* Controls */}
                <div className="glass-card p-4">
                  <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <button
                      onClick={handleToggleFullChart}
                      className="btn-primary"
                      style={{
                        background: "var(--color-amber-400)",
                        boxShadow: "0 0 15px rgba(251, 191, 36, 0.5)",
                      }}
                    >
                      {showFullPremiumChart
                        ? "SHOW CURRENT DATE ONLY"
                        : "VIEW FULL CHART"}
                    </button>

                    {showFullPremiumChart && (
                      <div className="flex-1 w-full md:w-auto">
                        <DateRangePicker
                          fromDate={premiumDateRange.from}
                          toDate={premiumDateRange.to}
                          onFromDateChange={(date) => {
                            if (date) {
                              handlePremiumDateRangeChange(
                                date,
                                premiumDateRange.to,
                              );
                            }
                          }}
                          onToDateChange={(date) => {
                            if (date) {
                              handlePremiumDateRangeChange(
                                premiumDateRange.from,
                                date,
                              );
                            }
                          }}
                          required
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Error Display */}
                {goldPremiumError && (
                  <div
                    className="p-4 rounded-xl"
                    style={{
                      backgroundColor: "var(--color-alert-error-bg)",
                      borderWidth: "1px",
                      borderStyle: "solid",
                      borderColor: "var(--color-alert-error-border)",
                    }}
                  >
                    <p
                      style={{
                        fontWeight: "var(--font-bold)",
                        color: "var(--color-alert-error-text)",
                        fontSize: "var(--text-sm)",
                      }}
                    >
                      Error
                    </p>
                    <p
                      style={{
                        color: "var(--color-alert-error-text)",
                        fontSize: "var(--text-xs)",
                        marginTop: "var(--space-1)",
                      }}
                    >
                      {goldPremiumError}
                    </p>
                  </div>
                )}

                {/* Chart */}
                {goldPremiumData &&
                goldPremiumData.data &&
                goldPremiumData.data.length > 0 ? (
                  <div>
                    <GoldPremiumChartResponsive
                      data={goldPremiumData.data}
                      showFullChart={showFullPremiumChart}
                    />

                    {/* Metadata Display */}
                    {goldPremiumData.metadata && (
                      <div
                        className="mt-6 p-4 rounded-xl"
                        style={{
                          backgroundColor: "var(--color-alert-info-bg)",
                          borderWidth: "1px",
                          borderStyle: "solid",
                          borderColor: "var(--color-alert-info-border)",
                        }}
                      >
                        <h4
                          style={{
                            fontSize: "var(--text-sm)",
                            fontWeight: "var(--font-bold)",
                            color: "var(--color-alert-info-text)",
                            marginBottom: "var(--space-2)",
                          }}
                        >
                          Calculation Details
                        </h4>
                        <div
                          className="space-y-1"
                          style={{
                            fontSize: "var(--text-xs)",
                            color: "var(--color-alert-info-text)",
                            lineHeight: "1.6",
                          }}
                        >
                          <p>
                            <strong
                              style={{ color: "var(--color-alert-info-text)" }}
                            >
                              Formula:
                            </strong>{" "}
                            {String(goldPremiumData.metadata.formula || "N/A")}
                          </p>
                          <p>
                            <strong
                              style={{ color: "var(--color-alert-info-text)" }}
                            >
                              Conversion:
                            </strong>{" "}
                            {String(
                              goldPremiumData.metadata.conversion || "N/A",
                            )}
                          </p>
                          <p>
                            <strong
                              style={{ color: "var(--color-alert-info-text)" }}
                            >
                              Note:
                            </strong>{" "}
                            {String(goldPremiumData.metadata.note || "N/A")}
                          </p>
                          <p>
                            <strong
                              style={{ color: "var(--color-alert-info-text)" }}
                            >
                              Sources:
                            </strong>{" "}
                            Gold:{" "}
                            {String(
                              goldPremiumData.metadata.gold_source || "N/A",
                            )}
                            , Exchange:{" "}
                            {String(
                              goldPremiumData.metadata.exchange_rate_source ||
                                "N/A",
                            )}
                            , Market:{" "}
                            {String(
                              goldPremiumData.metadata.stock_source || "N/A",
                            )}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : showGoldPremium && !isLoading ? (
                  <div className="glass-card p-8 text-center">
                    <TrendingDown
                      className="w-16 h-16 mx-auto mb-4 opacity-30"
                      style={{ color: "var(--cube-yellow)" }}
                    />
                    <p
                      style={{
                        fontSize: "var(--text-lg)",
                        fontWeight: "var(--font-bold)",
                        color: "var(--cube-gray-900)",
                      }}
                    >
                      No premium data available
                    </p>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
