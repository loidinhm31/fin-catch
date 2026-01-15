import { CurrencyCode } from "@/types/api";
import { PortfolioEntry } from "@/types/portfolio";

// Holdings performance chart types
export interface HoldingPerformanceData {
  timestamp: number;

  [symbol: string]: number; // Symbol -> normalized value (base 100 at purchase date)
}

export interface HoldingPerformance {
  entry: PortfolioEntry;
  performance_data: {
    timestamp: number;
    value: number; // Normalized to 100 at purchase date
  }[];
  current_return: number; // Percentage return from purchase
  color: string; // Chart line color
}

export interface PortfolioHoldingsPerformance {
  holdings: HoldingPerformance[];
  start_date: number;
  end_date: number;
  currency: CurrencyCode;
}
