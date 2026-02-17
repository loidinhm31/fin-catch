/**
 * Tauri Data Adapter
 *
 * Uses native IPC to call fin-catch-data commands in the Tauri backend.
 * This is faster than HTTP calls to qm-hub-server for market data.
 */

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
import { serviceLogger } from "@fin-catch/ui/utils";
import type { IDataService } from "@fin-catch/ui/adapters/factory/interfaces";

/**
 * Tauri adapter for financial data APIs
 * Calls native Rust commands via IPC for better performance
 */
export class TauriDataAdapter implements IDataService {
  constructor() {
    serviceLogger.market("TauriDataAdapter initialized (native IPC)");
  }

  async fetchStockHistory(
    request: StockHistoryRequest,
  ): Promise<StockHistoryResponse> {
    try {
      serviceLogger.market(`Native: fetchStockHistory ${request.symbol}`);
      return await invoke<StockHistoryResponse>("fetch_stock_history", {
        request,
      });
    } catch (error) {
      serviceLogger.marketError("Native stock history fetch failed");
      return {
        symbol: request.symbol,
        resolution: request.resolution,
        source: request.source || "vndirect",
        status: "error",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async fetchGoldPrice(request: GoldPriceRequest): Promise<GoldPriceResponse> {
    try {
      serviceLogger.market(`Native: fetchGoldPrice ${request.gold_price_id}`);
      return await invoke<GoldPriceResponse>("fetch_gold_price", { request });
    } catch (error) {
      serviceLogger.marketError("Native gold price fetch failed");
      return {
        gold_price_id: request.gold_price_id,
        source: request.source || "sjc",
        status: "error",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async fetchExchangeRate(
    request: ExchangeRateRequest,
  ): Promise<ExchangeRateResponse> {
    try {
      serviceLogger.market(
        `Native: fetchExchangeRate ${request.currency_code}`,
      );
      return await invoke<ExchangeRateResponse>("fetch_exchange_rate", {
        request,
      });
    } catch (error) {
      serviceLogger.marketError("Native exchange rate fetch failed");
      return {
        currency_code: request.currency_code,
        source: request.source || "vietcombank",
        status: "error",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async fetchGoldPremium(
    request: GoldPremiumRequest,
  ): Promise<GoldPremiumResponse> {
    try {
      serviceLogger.market("Native: fetchGoldPremium");
      return await invoke<GoldPremiumResponse>("fetch_gold_premium", {
        request,
      });
    } catch (error) {
      serviceLogger.marketError("Native gold premium fetch failed");
      return {
        status: "error",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async getSources(): Promise<Record<string, string[]>> {
    try {
      return await invoke<Record<string, string[]>>("get_sources");
    } catch (error) {
      serviceLogger.marketError("Native get sources failed");
      return {};
    }
  }

  async healthCheckAll(): Promise<Record<string, boolean>> {
    try {
      return await invoke<Record<string, boolean>>("health_check_all");
    } catch (error) {
      serviceLogger.marketError("Native health check failed");
      return {};
    }
  }

  async healthCheckSource(sourceName: string): Promise<boolean> {
    try {
      return await invoke<boolean>("health_check_source", {
        sourceName,
      });
    } catch (error) {
      serviceLogger.marketError(`Native health check failed for ${sourceName}`);
      return false;
    }
  }
}
