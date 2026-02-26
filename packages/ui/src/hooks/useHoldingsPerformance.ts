import { useEffect, useState } from "react";
import {
  CurrencyCode,
  PortfolioEntry,
  PortfolioHoldingsPerformance,
} from "@fin-catch/shared";
import { calculateAllHoldingsPerformance } from "@fin-catch/ui/utils";

export const useHoldingsPerformance = (
  entries: PortfolioEntry[],
  displayCurrency: CurrencyCode,
) => {
  const [timeframe, setTimeframe] = useState<"1M" | "3M" | "6M" | "1Y" | "ALL">(
    "1Y",
  );
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
          start = Math.min(...entries.map((e) => e.purchaseDate));
        } else {
          start = now - 365 * 86400;
        }
        break;
    }

    return { start, end: now };
  };

  useEffect(() => {
    if (!showChart || entries.length === 0) return;

    let cancelled = false;

    const run = async () => {
      setIsLoading(true);
      try {
        const { start, end } = calculateTimeframe();
        const performanceData = await calculateAllHoldingsPerformance(
          entries,
          start,
          end,
          displayCurrency,
        );
        if (!cancelled) {
          setData(performanceData);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load holdings performance:", err);
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load holdings performance",
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
    // entries identity changes only when content changes (useState setter replaces array)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showChart, timeframe, displayCurrency, entries]);

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
