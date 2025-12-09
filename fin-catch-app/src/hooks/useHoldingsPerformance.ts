import { useState, useEffect } from "react";
import { PortfolioEntry, CurrencyCode, PortfolioHoldingsPerformance } from "../types";
import { calculateAllHoldingsPerformance } from "../utils/holdings";

export const useHoldingsPerformance = (
  entries: PortfolioEntry[],
  displayCurrency: CurrencyCode
) => {
  const [timeframe, setTimeframe] = useState<"1M" | "3M" | "6M" | "1Y" | "ALL">("1Y");
  const [data, setData] = useState<PortfolioHoldingsPerformance | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateTimeframe = (): { start: number; end: number } => {
    const now = Math.floor(Date.now() / 1000);
    let start = now;

    switch (timeframe) {
      case "1M":
        start = now - 30 * 86400;
        break;
      case "3M":
        start = now - 90 * 86400;
        break;
      case "6M":
        start = now - 180 * 86400;
        break;
      case "1Y":
        start = now - 365 * 86400;
        break;
      case "ALL":
        if (entries.length > 0) {
          start = Math.min(...entries.map((e) => e.purchase_date));
        } else {
          start = now - 365 * 86400;
        }
        break;
    }

    return { start, end: now };
  };

  const loadPerformance = async () => {
    if (entries.length === 0) {
      setData(null);
      return;
    }

    setIsLoading(true);
    try {
      const { start, end } = calculateTimeframe();
      const performanceData = await calculateAllHoldingsPerformance(
        entries,
        start,
        end,
        displayCurrency
      );
      setData(performanceData);
      setError(null);
    } catch (err) {
      console.error("Failed to load holdings performance:", err);
      setError(err instanceof Error ? err.message : "Failed to load holdings performance");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (showChart && entries.length > 0) {
      loadPerformance();
    }
  }, [showChart, timeframe, displayCurrency]);

  return {
    timeframe,
    setTimeframe,
    data,
    isLoading,
    error,
    showChart,
    setShowChart,
  };
};
