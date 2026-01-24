import { invoke } from "@tauri-apps/api/core";
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
import type { IDataService } from "../interfaces";

/**
 * Tauri adapter for external market data operations
 * Wraps invoke() calls to Rust backend
 */
export class TauriDataAdapter implements IDataService {
  async fetchStockHistory(
    request: StockHistoryRequest,
  ): Promise<StockHistoryResponse> {
    console.log("[Tauri IPC] fetch_stock_history", request);
    const response = await invoke<StockHistoryResponse>("fetch_stock_history", {
      request,
    });
    console.log("[Tauri IPC Response]", response);
    return response;
  }

  async fetchGoldPrice(request: GoldPriceRequest): Promise<GoldPriceResponse> {
    console.log("[Tauri IPC] fetch_gold_price", request);
    const response = await invoke<GoldPriceResponse>("fetch_gold_price", {
      request,
    });
    console.log("[Tauri IPC Response]", response);
    return response;
  }

  async fetchExchangeRate(
    request: ExchangeRateRequest,
  ): Promise<ExchangeRateResponse> {
    console.log("[Tauri IPC] fetch_exchange_rate", request);
    const response = await invoke<ExchangeRateResponse>("fetch_exchange_rate", {
      request,
    });
    console.log("[Tauri IPC Response]", response);
    return response;
  }

  async fetchGoldPremium(
    request: GoldPremiumRequest,
  ): Promise<GoldPremiumResponse> {
    console.log("[Tauri IPC] fetch_gold_premium", request);
    const response = await invoke<GoldPremiumResponse>("fetch_gold_premium", {
      request,
    });
    console.log("[Tauri IPC Response]", response);
    return response;
  }

  async getSources(): Promise<Record<string, string[]>> {
    console.log("[Tauri IPC] get_sources");
    const response = await invoke<Record<string, string[]>>("get_sources");
    console.log("[Tauri IPC Response]", response);
    return response;
  }

  async healthCheckAll(): Promise<Record<string, boolean>> {
    console.log("[Tauri IPC] health_check_all");
    const response = await invoke<Record<string, boolean>>("health_check_all");
    console.log("[Tauri IPC Response]", response);
    return response;
  }

  async healthCheckSource(sourceName: string): Promise<boolean> {
    console.log("[Tauri IPC] health_check_source", sourceName);
    const response = await invoke<boolean>("health_check_source", {
      sourceName,
    });
    console.log("[Tauri IPC Response]", response);
    return response;
  }
}
