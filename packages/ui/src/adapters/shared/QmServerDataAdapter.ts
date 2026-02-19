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
import { env } from "@fin-catch/shared";
import { serviceLogger } from "@fin-catch/ui/utils";
import { IDataService } from "@fin-catch/ui/adapters/factory/interfaces";

/**
 * Configuration for QmServerDataAdapter
 */
export interface QmServerConfig {
  baseUrl?: string;
  apiBasePath?: string;
}

/**
 * API response wrapper from qm-hub-server
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Get the base URL from env utility
 */
function getDefaultBaseUrl(): string {
  return env.serverUrl;
}

/**
 * Shared adapter for financial data APIs
 * Calls qm-hub-server directly - works in both Tauri webview and browser
 */
export class QmServerDataAdapter implements IDataService {
  private readonly baseUrl: string;
  private readonly apiBasePath: string;

  constructor(config?: QmServerConfig) {
    this.baseUrl = config?.baseUrl || getDefaultBaseUrl();
    this.apiBasePath = config?.apiBasePath ?? "/api/v1";
    serviceLogger.market(`Initialized with baseUrl: ${this.baseUrl}`);
  }

  private async post<TReq, TRes>(
    endpoint: string,
    request: TReq,
  ): Promise<TRes> {
    const url = `${this.baseUrl}${endpoint}`;
    serviceLogger.market(`POST ${endpoint}`);

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
    serviceLogger.marketDebug("Response received");

    if (!result.success) {
      throw new Error(result.error || "Unknown API error");
    }

    return result.data!;
  }

  private async get<TRes>(endpoint: string): Promise<TRes> {
    const url = `${this.baseUrl}${endpoint}`;
    serviceLogger.market(`GET ${endpoint}`);

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
    serviceLogger.marketDebug("Response received");

    if (!result.success) {
      throw new Error(result.error || "Unknown API error");
    }

    return result.data!;
  }

  async fetchStockHistory(
    request: StockHistoryRequest,
  ): Promise<StockHistoryResponse> {
    try {
      return await this.post<StockHistoryRequest, StockHistoryResponse>(
        `${this.apiBasePath}/fin-catch/stock-history`,
        request,
      );
    } catch (error) {
      serviceLogger.marketError("Stock history fetch failed");
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
        `${this.apiBasePath}/fin-catch/gold-prices`,
        request,
      );
    } catch (error) {
      serviceLogger.marketError("Gold price fetch failed");
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
        `${this.apiBasePath}/fin-catch/exchange-rates`,
        request,
      );
    } catch (error) {
      serviceLogger.marketError("Exchange rate fetch failed");
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
        `${this.apiBasePath}/fin-catch/gold-premium`,
        request,
      );
    } catch (error) {
      serviceLogger.marketError("Gold premium fetch failed");
      return {
        status: "error",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async getSources(): Promise<Record<string, string[]>> {
    try {
      return await this.get<Record<string, string[]>>(
        `${this.apiBasePath}/fin-catch/sources`,
      );
    } catch (error) {
      serviceLogger.marketError("Get sources failed");
      return {};
    }
  }

  async healthCheckAll(): Promise<Record<string, boolean>> {
    try {
      return await this.get<Record<string, boolean>>(
        `${this.apiBasePath}/fin-catch/health`,
      );
    } catch (error) {
      serviceLogger.marketError("Health check failed");
      return {};
    }
  }

  async healthCheckSource(sourceName: string): Promise<boolean> {
    const results = await this.healthCheckAll();
    return results[sourceName] ?? false;
  }
}
