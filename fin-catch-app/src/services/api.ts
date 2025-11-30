import { invoke } from "@tauri-apps/api/core";
import {
  StockHistoryRequest,
  StockHistoryResponse,
  GoldPriceRequest,
  GoldPriceResponse,
  GoldPremiumRequest,
  GoldPremiumResponse,
} from "../types";

class FinCatchAPI {
  /**
   * Fetch stock history data via Tauri IPC
   */
  async fetchStockHistory(request: StockHistoryRequest): Promise<StockHistoryResponse> {
    try {
      console.log("[Tauri IPC] fetch_stock_history", request);
      const response = await invoke<StockHistoryResponse>("fetch_stock_history", { request });
      console.log("[Tauri IPC Response]", response);
      return response;
    } catch (error) {
      console.error("Error fetching stock history:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Fetch gold price data via Tauri IPC
   */
  async fetchGoldPrice(request: GoldPriceRequest): Promise<GoldPriceResponse> {
    try {
      console.log("[Tauri IPC] fetch_gold_price", request);
      const response = await invoke<GoldPriceResponse>("fetch_gold_price", { request });
      console.log("[Tauri IPC Response]", response);
      return response;
    } catch (error) {
      console.error("Error fetching gold price:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Fetch exchange rate data via Tauri IPC
   */
  async fetchExchangeRate(request: any): Promise<any> {
    try {
      console.log("[Tauri IPC] fetch_exchange_rate", request);
      const response = await invoke<any>("fetch_exchange_rate", { request });
      console.log("[Tauri IPC Response]", response);
      return response;
    } catch (error) {
      console.error("Error fetching exchange rate:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Fetch gold premium data via Tauri IPC
   */
  async fetchGoldPremium(request: GoldPremiumRequest, _signal?: AbortSignal): Promise<GoldPremiumResponse> {
    try {
      console.log("[Tauri IPC] fetch_gold_premium", request);
      const response = await invoke<GoldPremiumResponse>("fetch_gold_premium", { request });
      console.log("[Tauri IPC Response]", response);
      return response;
    } catch (error) {
      console.error("Error fetching gold premium:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Get list of available sources via Tauri IPC
   */
  async getSources(): Promise<Record<string, string[]>> {
    try {
      console.log("[Tauri IPC] get_sources");
      const response = await invoke<Record<string, string[]>>("get_sources");
      console.log("[Tauri IPC Response]", response);
      return response;
    } catch (error) {
      console.error("Error fetching sources:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Health check for all sources via Tauri IPC
   */
  async healthCheckAll(): Promise<Record<string, boolean>> {
    try {
      console.log("[Tauri IPC] health_check_all");
      const response = await invoke<Record<string, boolean>>("health_check_all");
      console.log("[Tauri IPC Response]", response);
      return response;
    } catch (error) {
      console.error("Error checking health:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Health check for a specific source via Tauri IPC
   */
  async healthCheckSource(sourceName: string): Promise<boolean> {
    try {
      console.log("[Tauri IPC] health_check_source", sourceName);
      const response = await invoke<boolean>("health_check_source", { sourceName });
      console.log("[Tauri IPC Response]", response);
      return response;
    } catch (error) {
      console.error(`Error checking health for ${sourceName}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Handle API errors
   */
  private handleError(error: any): Error {
    if (typeof error === "string") {
      return new Error(error);
    }
    return error instanceof Error ? error : new Error("Unknown error occurred");
  }
}

// Create and export a singleton instance
export const finCatchAPI = new FinCatchAPI();

// Export the class for testing purposes
export { FinCatchAPI };
