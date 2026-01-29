import type {
  ExchangeRateRequest,
  ExchangeRateResponse,
  GoldPremiumRequest,
  GoldPremiumResponse,
  GoldPriceRequest,
  GoldPriceResponse,
  IDataService,
  StockHistoryRequest,
  StockHistoryResponse,
} from "@fin-catch/shared";
import { tauriInvoke } from "./tauriInvoke";

export class TauriDataAdapter implements IDataService {
  async fetchStockHistory(
    request: StockHistoryRequest,
  ): Promise<StockHistoryResponse> {
    return tauriInvoke<StockHistoryResponse>("fetch_stock_history", {
      request,
    });
  }

  async fetchGoldPrice(request: GoldPriceRequest): Promise<GoldPriceResponse> {
    return tauriInvoke<GoldPriceResponse>("fetch_gold_price", { request });
  }

  async fetchExchangeRate(
    request: ExchangeRateRequest,
  ): Promise<ExchangeRateResponse> {
    return tauriInvoke<ExchangeRateResponse>("fetch_exchange_rate", {
      request,
    });
  }

  async fetchGoldPremium(
    request: GoldPremiumRequest,
  ): Promise<GoldPremiumResponse> {
    return tauriInvoke<GoldPremiumResponse>("fetch_gold_premium", { request });
  }

  async getSources(): Promise<Record<string, string[]>> {
    return tauriInvoke<Record<string, string[]>>("get_sources");
  }

  async healthCheckAll(): Promise<Record<string, boolean>> {
    return tauriInvoke<Record<string, boolean>>("health_check_all");
  }

  async healthCheckSource(sourceName: string): Promise<boolean> {
    return tauriInvoke<boolean>("health_check_source", { sourceName });
  }
}
