import type {
  ExchangeRateRequest,
  ExchangeRateResponse,
  GoldPremiumRequest,
  GoldPremiumResponse,
  GoldPriceRequest,
  GoldPriceResponse,
  StockHistoryRequest,
  StockHistoryResponse,
} from "@fin-catch/shared";

/**
 * Data service interface for external market data
 * Implemented by TauriDataAdapter (backend APIs) and WebDataAdapter (limited/unavailable)
 */
export interface IDataService {
  fetchStockHistory(
    request: StockHistoryRequest,
  ): Promise<StockHistoryResponse>;
  fetchGoldPrice(request: GoldPriceRequest): Promise<GoldPriceResponse>;
  fetchExchangeRate(
    request: ExchangeRateRequest,
  ): Promise<ExchangeRateResponse>;
  fetchGoldPremium(request: GoldPremiumRequest): Promise<GoldPremiumResponse>;
  getSources(): Promise<Record<string, string[]>>;
  healthCheckAll(): Promise<Record<string, boolean>>;
  healthCheckSource(sourceName: string): Promise<boolean>;
}
