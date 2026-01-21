import type {
  ExchangeRateRequest,
  ExchangeRateResponse,
  GoldPremiumRequest,
  GoldPremiumResponse,
  GoldPriceRequest,
  GoldPriceResponse,
  StockHistoryRequest,
  StockHistoryResponse,
} from "@/types/api";
import type { IDataService } from "@/adapters/interfaces";
import { WEB_SERVER_PORT, getSessionToken } from "@/utils/platform";

/**
 * API response wrapper from embedded server
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * HTTP adapter for external market data operations
 * Calls the embedded Axum server on port 25092
 */
export class HttpDataAdapter implements IDataService {
  private readonly baseUrl = `http://localhost:${WEB_SERVER_PORT}`;

  private getUrlWithToken(endpoint: string): string {
    const token = getSessionToken();
    const separator = endpoint.includes("?") ? "&" : "?";
    return token
      ? `${this.baseUrl}${endpoint}${separator}token=${encodeURIComponent(token)}`
      : `${this.baseUrl}${endpoint}`;
  }

  private async post<TReq, TRes>(
    endpoint: string,
    request: TReq,
  ): Promise<TRes> {
    const url = this.getUrlWithToken(endpoint);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const result: ApiResponse<TRes> = await response.json();
    if (!result.success) {
      throw new Error(result.error || "Unknown API error");
    }

    return result.data!;
  }

  private async get<TRes>(endpoint: string): Promise<TRes> {
    const url = this.getUrlWithToken(endpoint);
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const result: ApiResponse<TRes> = await response.json();
    if (!result.success) {
      throw new Error(result.error || "Unknown API error");
    }

    return result.data!;
  }

  async fetchStockHistory(
    request: StockHistoryRequest,
  ): Promise<StockHistoryResponse> {
    try {
      console.log("[HTTP] POST /api/stock-history", request);
      const response = await this.post<
        StockHistoryRequest,
        StockHistoryResponse
      >("/api/stock-history", request);
      console.log("[HTTP] Response", response);
      return response;
    } catch (error) {
      console.error("[HTTP] Stock history error:", error);
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
      console.log("[HTTP] POST /api/gold-price", request);
      const response = await this.post<GoldPriceRequest, GoldPriceResponse>(
        "/api/gold-price",
        request,
      );
      console.log("[HTTP] Response", response);
      return response;
    } catch (error) {
      console.error("[HTTP] Gold price error:", error);
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
      console.log("[HTTP] POST /api/exchange-rate", request);
      const response = await this.post<
        ExchangeRateRequest,
        ExchangeRateResponse
      >("/api/exchange-rate", request);
      console.log("[HTTP] Response", response);
      return response;
    } catch (error) {
      console.error("[HTTP] Exchange rate error:", error);
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
      console.log("[HTTP] POST /api/gold-premium", request);
      const response = await this.post<GoldPremiumRequest, GoldPremiumResponse>(
        "/api/gold-premium",
        request,
      );
      console.log("[HTTP] Response", response);
      return response;
    } catch (error) {
      console.error("[HTTP] Gold premium error:", error);
      return {
        status: "error",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async getSources(): Promise<Record<string, string[]>> {
    try {
      console.log("[HTTP] GET /api/sources");
      const response = await this.get<Record<string, string[]>>("/api/sources");
      console.log("[HTTP] Response", response);
      return response;
    } catch (error) {
      console.error("[HTTP] Get sources error:", error);
      return {};
    }
  }

  async healthCheckAll(): Promise<Record<string, boolean>> {
    try {
      console.log("[HTTP] GET /api/health-check-all");
      const response = await this.get<Record<string, boolean>>(
        "/api/health-check-all",
      );
      console.log("[HTTP] Response", response);
      return response;
    } catch (error) {
      console.error("[HTTP] Health check error:", error);
      return {};
    }
  }

  async healthCheckSource(_sourceName: string): Promise<boolean> {
    // Health check for individual sources not implemented in web API
    const results = await this.healthCheckAll();
    return results[_sourceName] ?? false;
  }
}
