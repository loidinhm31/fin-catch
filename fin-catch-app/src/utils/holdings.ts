import { finCatchAPI } from "@/services/api";
import {
  CurrencyCode,
  HoldingPerformance,
  PortfolioEntry,
  PortfolioHoldingsPerformance,
} from "@/types";
import { convertCurrency } from "@/utils/currency";

// Chart colors for holdings
const CHART_COLORS = [
  "#ec4899", // pink
  "#06B6D4", // cyan
  "#10b981", // green
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ef4444", // red
  "#3b82f6", // blue
  "#14b8a6", // teal
  "#f97316", // orange
  "#a855f7", // purple
];

/**
 * Calculate normalized performance for a single holding
 * Normalizes to 100 at the purchase date
 */
export const calculateHoldingPerformance = async (
  entry: PortfolioEntry,
  startDate: number,
  endDate: number,
  displayCurrency: CurrencyCode,
  intervalDays: number = 1,
): Promise<
  {
    timestamp: number;
    value: number;
  }[]
> => {
  const result: { timestamp: number; value: number }[] = [];
  const timestamps: number[] = [];

  // Use entry purchase date as the start if it's later than requested start
  const effectiveStart = Math.max(startDate, entry.purchase_date);

  // Generate timestamps at intervals
  for (let ts = effectiveStart; ts <= endDate; ts += intervalDays * 86400) {
    timestamps.push(ts);
  }
  // Ensure end date is included
  if (
    timestamps.length === 0 ||
    timestamps[timestamps.length - 1] !== endDate
  ) {
    timestamps.push(endDate);
  }

  let purchasePrice = 0;
  let purchasePriceCurrency: CurrencyCode = entry.currency || "USD";

  // Calculate purchase price in display currency (with proper scaling)
  if (entry.asset_type === "stock") {
    purchasePrice = entry.purchase_price;
  } else if (entry.asset_type === "gold") {
    // For gold, convert purchase price to per-tael if needed
    const userUnit = entry.unit || "tael";
    if (userUnit === "mace") {
      purchasePrice = entry.purchase_price * 10; // Convert to per tael
    } else if (userUnit === "gram") {
      purchasePrice = entry.purchase_price * 37.5; // Convert to per tael
    } else {
      purchasePrice = entry.purchase_price;
    }
  }

  const purchasePriceInDisplayCurrency = await convertCurrency(
    purchasePrice,
    purchasePriceCurrency,
    displayCurrency,
  );

  for (const timestamp of timestamps) {
    try {
      let currentPrice = 0;
      let currentPriceCurrency: CurrencyCode = entry.currency || "USD";
      let priceScale = 1;

      if (entry.asset_type === "stock") {
        const response = await finCatchAPI.fetchStockHistory({
          symbol: entry.symbol,
          resolution: "1D" as const,
          from: timestamp - 86400,
          to: timestamp,
          source: entry.source as any,
        });

        if (response.data && response.data.length > 0) {
          const rawPrice = response.data[response.data.length - 1].close;
          priceScale = (response.metadata?.price_scale as number) ?? 1;
          currentPrice = rawPrice * priceScale;
        }
      } else if (entry.asset_type === "gold") {
        const goldSource = entry.source as "sjc";
        if (!goldSource || goldSource !== "sjc") {
          continue;
        }

        const response = await finCatchAPI.fetchGoldPrice({
          gold_price_id: entry.symbol,
          from: timestamp - 86400,
          to: timestamp,
          source: goldSource,
        });

        if (response.data && response.data.length > 0) {
          const rawPrice = response.data[response.data.length - 1].sell;
          priceScale = (response.metadata?.price_scale as number) ?? 1;
          currentPrice = rawPrice * priceScale;
          currentPriceCurrency = "VND";
        }
      }

      if (currentPrice === 0) continue;

      // Convert current price to display currency
      const currentPriceInDisplayCurrency = await convertCurrency(
        currentPrice,
        currentPriceCurrency,
        displayCurrency,
      );

      // Normalize to 100 at purchase
      const normalizedValue =
        purchasePriceInDisplayCurrency > 0
          ? (currentPriceInDisplayCurrency / purchasePriceInDisplayCurrency) *
            100
          : 100;

      result.push({
        timestamp,
        value: normalizedValue,
      });
    } catch (error) {
      console.warn(
        `Failed to fetch price for ${entry.symbol} at ${timestamp}:`,
        error,
      );
    }
  }

  return result;
};

/**
 * Calculate performance for all holdings in a portfolio
 */
export const calculateAllHoldingsPerformance = async (
  entries: PortfolioEntry[],
  startDate: number,
  endDate: number,
  displayCurrency: CurrencyCode,
): Promise<PortfolioHoldingsPerformance | null> => {
  if (entries.length === 0) {
    return null;
  }

  try {
    const holdings: HoldingPerformance[] = [];

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];

      const performanceData = await calculateHoldingPerformance(
        entry,
        startDate,
        endDate,
        displayCurrency,
        1, // Daily intervals
      );

      if (performanceData.length === 0) {
        continue; // Skip holdings with no data
      }

      // Calculate current return
      const currentReturn =
        performanceData.length > 0
          ? performanceData[performanceData.length - 1].value - 100
          : 0;

      holdings.push({
        entry,
        performance_data: performanceData,
        current_return: currentReturn,
        color: CHART_COLORS[i % CHART_COLORS.length],
      });
    }

    if (holdings.length === 0) {
      return null;
    }

    return {
      holdings,
      start_date: startDate,
      end_date: endDate,
      currency: displayCurrency,
    };
  } catch (error) {
    console.error("Failed to calculate holdings performance:", error);
    return null;
  }
};
