import { invoke } from "@tauri-apps/api/core";
import {
  BondCouponPayment,
  ExchangeRateRequest,
  ExchangeRateResponse,
  GoldPremiumRequest,
  GoldPremiumResponse,
  GoldPriceRequest,
  GoldPriceResponse,
  Portfolio,
  PortfolioEntry,
  StockHistoryRequest,
  StockHistoryResponse,
} from "@/types";

class FinCatchAPI {
  /**
   * Fetch stock history data via Tauri IPC
   */
  async fetchStockHistory(
    request: StockHistoryRequest,
  ): Promise<StockHistoryResponse> {
    try {
      console.log("[Tauri IPC] fetch_stock_history", request);
      const response = await invoke<StockHistoryResponse>(
        "fetch_stock_history",
        { request },
      );
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
      const response = await invoke<GoldPriceResponse>("fetch_gold_price", {
        request,
      });
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
  async fetchExchangeRate(
    request: ExchangeRateRequest,
  ): Promise<ExchangeRateResponse> {
    try {
      console.log("[Tauri IPC] fetch_exchange_rate", request);
      const response = await invoke<ExchangeRateResponse>(
        "fetch_exchange_rate",
        { request },
      );
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
  async fetchGoldPremium(
    request: GoldPremiumRequest,
    _signal?: AbortSignal,
  ): Promise<GoldPremiumResponse> {
    try {
      console.log("[Tauri IPC] fetch_gold_premium", request);
      const response = await invoke<GoldPremiumResponse>("fetch_gold_premium", {
        request,
      });
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
      const response =
        await invoke<Record<string, boolean>>("health_check_all");
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
      const response = await invoke<boolean>("health_check_source", {
        sourceName,
      });
      console.log("[Tauri IPC Response]", response);
      return response;
    } catch (error) {
      console.error(`Error checking health for ${sourceName}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Portfolio operations
   */
  async createPortfolio(portfolio: Portfolio): Promise<number> {
    try {
      console.log("[Tauri IPC] create_portfolio", portfolio);
      const id = await invoke<number>("create_portfolio", { portfolio });
      console.log("[Tauri IPC Response]", id);
      return id;
    } catch (error) {
      console.error("Error creating portfolio:", error);
      throw this.handleError(error);
    }
  }

  async getPortfolio(id: number): Promise<Portfolio> {
    try {
      console.log("[Tauri IPC] get_portfolio", id);
      const portfolio = await invoke<Portfolio>("get_portfolio", { id });
      console.log("[Tauri IPC Response]", portfolio);
      return portfolio;
    } catch (error) {
      console.error("Error getting portfolio:", error);
      throw this.handleError(error);
    }
  }

  async listPortfolios(): Promise<Portfolio[]> {
    try {
      console.log("[Tauri IPC] list_portfolios");
      const portfolios = await invoke<Portfolio[]>("list_portfolios");
      console.log("[Tauri IPC Response]", portfolios);
      return portfolios;
    } catch (error) {
      console.error("Error listing portfolios:", error);
      throw this.handleError(error);
    }
  }

  async updatePortfolio(portfolio: Portfolio): Promise<void> {
    try {
      console.log("[Tauri IPC] update_portfolio", portfolio);
      await invoke<void>("update_portfolio", { portfolio });
      console.log("[Tauri IPC Response] Portfolio updated");
    } catch (error) {
      console.error("Error updating portfolio:", error);
      throw this.handleError(error);
    }
  }

  async deletePortfolio(id: number): Promise<void> {
    try {
      console.log("[Tauri IPC] delete_portfolio", id);
      await invoke<void>("delete_portfolio", { id });
      console.log("[Tauri IPC Response] Portfolio deleted");
    } catch (error) {
      console.error("Error deleting portfolio:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Portfolio Entry operations
   */
  async createEntry(entry: PortfolioEntry): Promise<number> {
    try {
      console.log("[Tauri IPC] create_entry", entry);
      const id = await invoke<number>("create_entry", { entry });
      console.log("[Tauri IPC Response]", id);
      return id;
    } catch (error) {
      console.error("Error creating entry:", error);
      throw this.handleError(error);
    }
  }

  async getEntry(id: number): Promise<PortfolioEntry> {
    try {
      console.log("[Tauri IPC] get_entry", id);
      const entry = await invoke<PortfolioEntry>("get_entry", { id });
      console.log("[Tauri IPC Response]", entry);
      return entry;
    } catch (error) {
      console.error("Error getting entry:", error);
      throw this.handleError(error);
    }
  }

  async listEntries(portfolioId: number): Promise<PortfolioEntry[]> {
    try {
      console.log("[Tauri IPC] list_entries", portfolioId);
      const entries = await invoke<PortfolioEntry[]>("list_entries", {
        portfolioId,
      });
      console.log("[Tauri IPC Response]", entries);
      return entries;
    } catch (error) {
      console.error("Error listing entries:", error);
      throw this.handleError(error);
    }
  }

  async updateEntry(entry: PortfolioEntry): Promise<void> {
    try {
      console.log("[Tauri IPC] update_entry", entry);
      await invoke<void>("update_entry", { entry });
      console.log("[Tauri IPC Response] Entry updated");
    } catch (error) {
      console.error("Error updating entry:", error);
      throw this.handleError(error);
    }
  }

  async deleteEntry(id: number): Promise<void> {
    try {
      console.log("[Tauri IPC] delete_entry", id);
      await invoke<void>("delete_entry", { id });
      console.log("[Tauri IPC Response] Entry deleted");
    } catch (error) {
      console.error("Error deleting entry:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Bond Coupon Payment operations
   */
  async createCouponPayment(payment: BondCouponPayment): Promise<number> {
    try {
      console.log("[Tauri IPC] create_coupon_payment", payment);
      const id = await invoke<number>("create_coupon_payment", { payment });
      console.log("[Tauri IPC Response]", id);
      return id;
    } catch (error) {
      console.error("Error creating coupon payment:", error);
      throw this.handleError(error);
    }
  }

  async listCouponPayments(entryId: number): Promise<BondCouponPayment[]> {
    try {
      console.log("[Tauri IPC] list_coupon_payments", entryId);
      const payments = await invoke<BondCouponPayment[]>("list_coupon_payments", {
        entryId,
      });
      console.log("[Tauri IPC Response]", payments);
      return payments;
    } catch (error) {
      console.error("Error listing coupon payments:", error);
      throw this.handleError(error);
    }
  }

  async updateCouponPayment(payment: BondCouponPayment): Promise<void> {
    try {
      console.log("[Tauri IPC] update_coupon_payment", payment);
      await invoke<void>("update_coupon_payment", { payment });
      console.log("[Tauri IPC Response] Coupon payment updated");
    } catch (error) {
      console.error("Error updating coupon payment:", error);
      throw this.handleError(error);
    }
  }

  async deleteCouponPayment(id: number): Promise<void> {
    try {
      console.log("[Tauri IPC] delete_coupon_payment", id);
      await invoke<void>("delete_coupon_payment", { id });
      console.log("[Tauri IPC Response] Coupon payment deleted");
    } catch (error) {
      console.error("Error deleting coupon payment:", error);
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
