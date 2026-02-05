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
import { HttpClient } from "./HttpClient";
import { IDataService } from "@fin-catch/ui/adapters/factory/interfaces";

export class HttpDataAdapter extends HttpClient implements IDataService {
  async fetchStockHistory(
    request: StockHistoryRequest,
  ): Promise<StockHistoryResponse> {
    try {
      return await this.post<StockHistoryRequest, StockHistoryResponse>(
        "/api/stock-history",
        request,
      );
    } catch (error) {
      serviceLogger.httpError("Stock history error:", error);
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
      return await this.post<GoldPriceRequest, GoldPriceResponse>(
        "/api/gold-price",
        request,
      );
    } catch (error) {
      serviceLogger.httpError("Gold price error:", error);
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
      return await this.post<ExchangeRateRequest, ExchangeRateResponse>(
        "/api/exchange-rate",
        request,
      );
    } catch (error) {
      serviceLogger.httpError("Exchange rate error:", error);
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
      return await this.post<GoldPremiumRequest, GoldPremiumResponse>(
        "/api/gold-premium",
        request,
      );
    } catch (error) {
      serviceLogger.httpError("Gold premium error:", error);
      return {
        status: "error",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async getSources(): Promise<Record<string, string[]>> {
    try {
      return await this.get<Record<string, string[]>>("/api/sources");
    } catch (error) {
      serviceLogger.httpError("Get sources error:", error);
      return {};
    }
  }

  async healthCheckAll(): Promise<Record<string, boolean>> {
    try {
      return await this.get<Record<string, boolean>>("/api/health-check-all");
    } catch (error) {
      serviceLogger.httpError("Health check error:", error);
      return {};
    }
  }

  async healthCheckSource(_sourceName: string): Promise<boolean> {
    const results = await this.healthCheckAll();
    return results[_sourceName] ?? false;
  }
}
