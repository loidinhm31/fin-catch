import React, { useState } from "react";
import { TrendingUp, Coins } from "lucide-react";
import {
  StockQueryForm,
  GoldQueryForm,
  StockChart,
  GoldChart,
} from "../organisms";
import {
  StockHistoryRequest,
  GoldPriceRequest,
  StockHistoryResponse,
  GoldPriceResponse,
} from "../../types";
import { finCatchAPI } from "../../services/api";

type ActiveTab = "stock" | "gold";

// Cube decoration component
const CubeShape = ({ className = "", variant = "default" }: { className?: string; variant?: "default" | "yellow" | "pink" }) => (
  <div className={`cube-decoration ${variant === 'yellow' ? 'cube-yellow' : variant === 'pink' ? 'cube-pink' : ''} ${className}`}></div>
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

  const handleStockSubmit = async (request: StockHistoryRequest) => {
    setIsLoading(true);
    setStockError(null);

    try {
      const response = await finCatchAPI.fetchStockHistory(request);

      if (response.status === "error") {
        setStockError(response.error || "Failed to fetch stock data");
        setStockData(null);
      } else {
        setStockData(response);
        setStockError(null);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
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
      const response = await finCatchAPI.fetchGoldPrice(request);

      if (response.status === "error") {
        setGoldError(response.error || "Failed to fetch gold data");
        setGoldData(null);
      } else {
        setGoldData(response);
        setGoldError(null);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      setGoldError(errorMessage);
      setGoldData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const currentData = activeTab === "stock" ? stockData : goldData;
  const currentError = activeTab === "stock" ? stockError : goldError;

  return (
    <div className="screen-explore">
      {/* Decorative cube elements */}
      <CubeShape className="absolute top-20 right-8 animate-pulse-glow" />
      <CubeShape className="absolute bottom-32 left-8 animate-pulse-glow" />
      <CubeShape className="absolute top-1/2 right-16 animate-float" variant="yellow" />
      <div className="absolute bottom-20 right-12 w-16 h-16 cube-decoration cube-yellow"></div>
      <div className="absolute top-40 left-12 w-20 h-20 cube-decoration cube-pink"></div>

      {/* Main glass container */}
      <div className="glass-container relative z-10 mx-4 my-8 min-h-[calc(100vh-4rem)] overflow-hidden">
        <div className="h-full overflow-y-auto p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)', color: 'var(--cube-gray-900)' }}>
                FIN-CATCH
              </h1>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--cube-gray-900)', opacity: 0.7 }}>
                Financial Data Query System
              </p>
            </div>
            <div className="flex items-center gap-2">
              <CubeShape className="animate-float" />
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setActiveTab("stock")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all ${
                activeTab === "stock"
                  ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-white shadow-lg"
                  : "glass-button text-gray-700"
              }`}
              style={{ fontSize: 'var(--text-sm)' }}
            >
              <TrendingUp className="w-5 h-5" />
              STOCK
            </button>
            <button
              onClick={() => setActiveTab("gold")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all ${
                activeTab === "gold"
                  ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg"
                  : "glass-button text-gray-700"
              }`}
              style={{ fontSize: 'var(--text-sm)' }}
            >
              <Coins className="w-5 h-5" />
              GOLD
            </button>
          </div>

          {/* Query Form Section */}
          <div className="mb-6">
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', color: 'var(--cube-gray-900)', marginBottom: 'var(--space-4)' }}>
              {activeTab === "stock" ? "Stock Query" : "Gold Query"}
            </h2>
            <div className="glass-card p-6">
              {activeTab === "stock" ? (
                <StockQueryForm onSubmit={handleStockSubmit} isLoading={isLoading} />
              ) : (
                <GoldQueryForm onSubmit={handleGoldSubmit} isLoading={isLoading} />
              )}
            </div>
          </div>

          {/* Error Display */}
          {currentError && (
            <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-xl">
              <p style={{ fontWeight: 'var(--font-bold)', color: '#dc2626', fontSize: 'var(--text-sm)' }}>Error</p>
              <p style={{ color: '#dc2626', fontSize: 'var(--text-xs)', marginTop: 'var(--space-1)' }}>{currentError}</p>
            </div>
          )}

          {/* Chart Display Section */}
          {currentData && currentData.data && currentData.data.length > 0 ? (
            <div>
              <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', color: 'var(--cube-gray-900)', marginBottom: 'var(--space-4)' }}>
                Chart Visualization
              </h2>
              <div className="glass-card p-6">
                {activeTab === "stock" && stockData ? (
                  <StockChart
                    data={stockData.data!}
                    resolution={stockData.resolution}
                    symbol={stockData.symbol}
                  />
                ) : activeTab === "gold" && goldData ? (
                  <GoldChart data={goldData.data!} goldPriceId={goldData.gold_price_id} />
                ) : null}
              </div>

              {/* Data Summary */}
              <div className="mt-6 glass-card p-6">
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', color: 'var(--cube-gray-900)', marginBottom: 'var(--space-4)' }}>
                  Data Summary
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {activeTab === "stock" && stockData && (
                    <>
                      <div>
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--cube-gray-900)', opacity: 0.6 }}>Symbol</p>
                        <p style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', color: 'var(--cube-gray-900)' }}>
                          {stockData.symbol}
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--cube-gray-900)', opacity: 0.6 }}>Source</p>
                        <p style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', color: 'var(--cube-gray-900)' }}>
                          {stockData.source}
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--cube-gray-900)', opacity: 0.6 }}>Resolution</p>
                        <p style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', color: 'var(--cube-gray-900)' }}>
                          {stockData.resolution}
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--cube-gray-900)', opacity: 0.6 }}>Data Points</p>
                        <p style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', color: 'var(--cube-gray-900)' }}>
                          {stockData.data?.length || 0}
                        </p>
                      </div>
                    </>
                  )}
                  {activeTab === "gold" && goldData && (
                    <>
                      <div>
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--cube-gray-900)', opacity: 0.6 }}>Gold Type</p>
                        <p style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', color: 'var(--cube-gray-900)' }}>
                          {goldData.gold_price_id}
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--cube-gray-900)', opacity: 0.6 }}>Source</p>
                        <p style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', color: 'var(--cube-gray-900)' }}>
                          {goldData.source}
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--cube-gray-900)', opacity: 0.6 }}>Status</p>
                        <p style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', color: 'var(--cube-gray-900)' }}>
                          {goldData.status}
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--cube-gray-900)', opacity: 0.6 }}>Data Points</p>
                        <p style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', color: 'var(--cube-gray-900)' }}>
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
                <TrendingUp className="w-20 h-20 mx-auto mb-4 opacity-30" style={{ color: 'var(--cube-cyan)' }} />
              ) : (
                <Coins className="w-20 h-20 mx-auto mb-4 opacity-30" style={{ color: 'var(--cube-yellow)' }} />
              )}
              <p style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', color: 'var(--cube-gray-900)' }}>
                No data yet
              </p>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--cube-gray-900)', opacity: 0.7, marginTop: 'var(--space-2)' }}>
                Submit a query to view the chart
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
