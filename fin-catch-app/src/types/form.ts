import {GoldSource, Resolution, StockSource} from "./api";

// Stock query form data
export interface StockFormData {
  symbol: string;
  resolution: Resolution;
  fromDate: Date;
  toDate: Date;
  source: StockSource;
}

// Gold query form data
export interface GoldFormData {
  goldPriceId: string;
  fromDate: Date;
  toDate: Date;
  source: GoldSource;
}

// Chart data type
export type ChartDataType = "stock" | "gold";

// Chart state
export interface ChartState {
  type: ChartDataType | null;
  data: any[];
  loading: boolean;
  error: string | null;
}
