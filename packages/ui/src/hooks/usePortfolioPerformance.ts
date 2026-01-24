import { useEffect, useState } from "react";
import {
  CurrencyCode,
  PortfolioEntry,
  PortfolioPerformance,
} from "@fin-catch/shared";
import { calculatePortfolioPerformance } from "../utils/performanceCalculations";

export const usePortfolioPerformance = (
  entries: PortfolioEntry[],
  displayCurrency: CurrencyCode,
) => {
  const [performance, setPerformance] = useState<PortfolioPerformance | null>(
    null,
  );
  const [isCalculating, setIsCalculating] = useState(false);

  const calculatePerformance = async () => {
    if (entries.length === 0) {
      setPerformance(null);
      return;
    }

    setIsCalculating(true);
    try {
      const result = await calculatePortfolioPerformance(
        entries,
        displayCurrency,
      );
      setPerformance(result);
    } catch (err) {
      console.error("Failed to calculate performance:", err);
    } finally {
      setIsCalculating(false);
    }
  };

  useEffect(() => {
    calculatePerformance();
  }, [entries, displayCurrency]);

  return {
    performance,
    isCalculating,
    recalculate: calculatePerformance,
  };
};
