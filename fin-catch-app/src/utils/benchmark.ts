import { finCatchAPI } from "../services/api";
import {
  BenchmarkData,
  BenchmarkOption,
  PortfolioBenchmarkComparison,
  CurrencyCode,
  PortfolioEntry,
} from "../types";
import { convertCurrency } from "./currency";

/**
 * Calculate normalized portfolio value over time
 * Normalizes to 100 at the start date for comparison
 */
export const calculatePortfolioHistoricalPerformance = async (
  entries: PortfolioEntry[],
  startDate: number,
  endDate: number,
  displayCurrency: CurrencyCode,
  intervalDays: number = 1
): Promise<BenchmarkData[]> => {
  const result: BenchmarkData[] = [];
  const timestamps: number[] = [];

  // Generate timestamps at intervals
  for (let ts = startDate; ts <= endDate; ts += intervalDays * 86400) {
    timestamps.push(ts);
  }
  // Ensure end date is included
  if (timestamps[timestamps.length - 1] !== endDate) {
    timestamps.push(endDate);
  }

  let initialValue = 0;

  for (const timestamp of timestamps) {
    let totalValue = 0;

    for (const entry of entries) {
      // Skip if entry was purchased after this timestamp
      if (entry.purchase_date > timestamp) {
        continue;
      }

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

        // Convert price to display currency
        const priceInDisplayCurrency = await convertCurrency(
          currentPrice,
          currentPriceCurrency,
          displayCurrency
        );

        // Calculate quantity in proper units (for gold, convert to taels)
        let quantityInBaseUnit = entry.quantity;
        if (entry.asset_type === "gold") {
          const userUnit = entry.unit || "tael";
          if (userUnit === "mace") {
            quantityInBaseUnit = entry.quantity / 10;
          } else if (userUnit === "gram") {
            quantityInBaseUnit = entry.quantity / 37.5;
          }
        }

        totalValue += priceInDisplayCurrency * quantityInBaseUnit;
      } catch (error) {
        console.warn(`Failed to fetch price for ${entry.symbol} at ${timestamp}:`, error);
      }
    }

    // Set initial value at first timestamp
    if (initialValue === 0 && totalValue > 0) {
      initialValue = totalValue;
    }

    // Normalize to 100 at start
    const normalizedValue = initialValue > 0 ? (totalValue / initialValue) * 100 : 100;

    result.push({
      timestamp,
      value: normalizedValue,
    });
  }

  return result;
};

/**
 * Fetch benchmark historical data and normalize
 */
export const fetchBenchmarkData = async (
  benchmark: BenchmarkOption,
  startDate: number,
  endDate: number,
  _displayCurrency: CurrencyCode
): Promise<BenchmarkData[]> => {
  const result: BenchmarkData[] = [];

  try {
    const response = await finCatchAPI.fetchStockHistory({
      symbol: benchmark.symbol,
      resolution: "1D" as const,
      from: startDate,
      to: endDate,
      source: benchmark.source as any,
    });

    if (!response.data || response.data.length === 0) {
      return [];
    }

    const priceScale = (response.metadata?.price_scale as number) ?? 1;
    const firstPrice = response.data[0].close * priceScale;

    for (const candle of response.data) {
      const price = candle.close * priceScale;
      const normalizedValue = (price / firstPrice) * 100;

      result.push({
        timestamp: candle.timestamp,
        value: normalizedValue,
      });
    }

    return result;
  } catch (error) {
    console.error(`Failed to fetch benchmark data for ${benchmark.symbol}:`, error);
    return [];
  }
};

/**
 * Calculate complete benchmark comparison
 */
export const calculateBenchmarkComparison = async (
  entries: PortfolioEntry[],
  benchmark: BenchmarkOption,
  startDate: number,
  endDate: number,
  displayCurrency: CurrencyCode
): Promise<PortfolioBenchmarkComparison | null> => {
  try {
    // Calculate portfolio performance
    const portfolioData = await calculatePortfolioHistoricalPerformance(
      entries,
      startDate,
      endDate,
      displayCurrency,
      1 // Daily intervals
    );

    // Fetch benchmark data
    const benchmarkData = await fetchBenchmarkData(
      benchmark,
      startDate,
      endDate,
      displayCurrency
    );

    if (portfolioData.length === 0 || benchmarkData.length === 0) {
      return null;
    }

    // Calculate returns
    const portfolioReturn =
      portfolioData.length > 0
        ? portfolioData[portfolioData.length - 1].value - 100
        : 0;
    const benchmarkReturn =
      benchmarkData.length > 0
        ? benchmarkData[benchmarkData.length - 1].value - 100
        : 0;

    return {
      portfolio_data: portfolioData,
      benchmark_data: benchmarkData,
      benchmark_name: benchmark.name,
      start_date: startDate,
      end_date: endDate,
      currency: displayCurrency,
      portfolio_return: portfolioReturn,
      benchmark_return: benchmarkReturn,
      outperformance: portfolioReturn - benchmarkReturn,
    };
  } catch (error) {
    console.error("Failed to calculate benchmark comparison:", error);
    return null;
  }
};
