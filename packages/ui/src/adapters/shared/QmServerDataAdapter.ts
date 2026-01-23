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
} from "@repo/shared";

/**
 * Configuration for QmServerDataAdapter
 */
export interface QmServerConfig {
  baseUrl?: string;
}

/**
 * API response wrapper from qm-center-server
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Get the base URL from Vite env or default
 */
function getDefaultBaseUrl(): string {
  try {
    // Vite injects import.meta.env at build time
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const env = (import.meta as any).env;
    if (env?.VITE_QM_SYNC_SERVER_URL) {
      return env.VITE_QM_SYNC_SERVER_URL;
    }
  } catch {
    // Not in a Vite environment
  }
  return "http://localhost:3000";
}

/**
 * Shared adapter for financial data APIs
 * Calls qm-center-server directly - works in both Tauri webview and browser
 */
export class QmServerDataAdapter implements IDataService {
  private readonly baseUrl: string;

  constructor(config?: QmServerConfig) {
    this.baseUrl = config?.baseUrl || getDefaultBaseUrl();
    console.log(
      `[QmServerDataAdapter] Initialized with baseUrl: ${this.baseUrl}`,
    );
  }

  private async post<TReq, TRes>(
    endpoint: string,
    request: TReq,
  ): Promise<TRes> {
    const url = `${this.baseUrl}${endpoint}`;
    console.log(`[QmServerDataAdapter] POST ${endpoint}`, request);

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
    console.log(`[QmServerDataAdapter] Response`, result);

    if (!result.success) {
      throw new Error(result.error || "Unknown API error");
    }

    return result.data!;
  }

  private async get<TRes>(endpoint: string): Promise<TRes> {
    const url = `${this.baseUrl}${endpoint}`;
    console.log(`[QmServerDataAdapter] GET ${endpoint}`);

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
    console.log(`[QmServerDataAdapter] Response`, result);

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
        "/api/v1/fin-catch/stock-history",
        request,
      );
    } catch (error) {
      console.error("[QmServerDataAdapter] Stock history error:", error);
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
        "/api/v1/fin-catch/gold-prices",
        request,
      );
    } catch (error) {
      console.error("[QmServerDataAdapter] Gold price error:", error);
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
        "/api/v1/fin-catch/exchange-rates",
        request,
      );
    } catch (error) {
      console.error("[QmServerDataAdapter] Exchange rate error:", error);
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
        "/api/v1/fin-catch/gold-premium",
        request,
      );
    } catch (error) {
      console.error("[QmServerDataAdapter] Gold premium error:", error);
      return {
        status: "error",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async getSources(): Promise<Record<string, string[]>> {
    try {
      return await this.get<Record<string, string[]>>(
        "/api/v1/fin-catch/sources",
      );
    } catch (error) {
      console.error("[QmServerDataAdapter] Get sources error:", error);
      return {};
    }
  }

  async healthCheckAll(): Promise<Record<string, boolean>> {
    try {
      return await this.get<Record<string, boolean>>(
        "/api/v1/fin-catch/health",
      );
    } catch (error) {
      console.error("[QmServerDataAdapter] Health check error:", error);
      return {};
    }
  }

  async healthCheckSource(sourceName: string): Promise<boolean> {
    const results = await this.healthCheckAll();
    return results[sourceName] ?? false;
  }
}
