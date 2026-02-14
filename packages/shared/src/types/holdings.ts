import { CurrencyCode } from "./api";
import { PortfolioEntry } from "./portfolio";

// Holdings performance chart types
export interface HoldingPerformanceData {
  timestamp: number;

  [symbol: string]: number; // Symbol -> normalized value (base 100 at purchase date)
}

export interface HoldingPerformance {
  entry: PortfolioEntry;
  performanceData: {
    timestamp: number;
    value: number; // Normalized to 100 at purchase date
  }[];
  currentReturn: number; // Percentage return from purchase
  color: string; // Chart line color
}

export interface PortfolioHoldingsPerformance {
  holdings: HoldingPerformance[];
  startDate: number;
  endDate: number;
  currency: CurrencyCode;
}
