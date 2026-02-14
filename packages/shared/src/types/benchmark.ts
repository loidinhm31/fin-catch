import { CurrencyCode } from "./api";

// Benchmark types for portfolio comparison
export interface BenchmarkData {
  timestamp: number;
  value: number; // Normalized to 100 at start date
}

export interface PortfolioBenchmarkComparison {
  portfolioData: BenchmarkData[];
  benchmarkData: BenchmarkData[];
  benchmarkName: string;
  startDate: number;
  endDate: number;
  currency: CurrencyCode;
  portfolioReturn: number; // Percentage return
  benchmarkReturn: number; // Percentage return
  outperformance: number; // Portfolio return - benchmark return
}

// Available benchmarks
export type BenchmarkType =
  | "SPY" // S&P 500 ETF
  | "QQQ" // NASDAQ-100 ETF
  | "VTI" // Total Stock Market ETF
  | "VNM" // Vietnam ETF
  | "GOLD" // Gold price benchmark
  | "CUSTOM"; // Custom benchmark

export interface BenchmarkOption {
  id: BenchmarkType;
  name: string;
  symbol: string;
  description: string;
  source: string;
}

export const BENCHMARK_OPTIONS: BenchmarkOption[] = [
  {
    id: "SPY",
    name: "S&P 500",
    symbol: "SPY",
    description: "U.S. Large Cap Stocks",
    source: "yahoo_finance",
  },
  {
    id: "QQQ",
    name: "NASDAQ-100",
    symbol: "QQQ",
    description: "U.S. Tech & Growth Stocks",
    source: "yahoo_finance",
  },
  {
    id: "VTI",
    name: "Total Market",
    symbol: "VTI",
    description: "Total U.S. Stock Market",
    source: "yahoo_finance",
  },
  {
    id: "VNM",
    name: "Vietnam Market",
    symbol: "VNM",
    description: "Vietnam Stock Market",
    source: "yahoo_finance",
  },
  {
    id: "GOLD",
    name: "Gold",
    symbol: "GC=F",
    description: "Gold Futures",
    source: "yahoo_finance",
  },
];
