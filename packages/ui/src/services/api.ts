import { invoke } from "@tauri-apps/api/core";

import {
  AuthResponse,
  AuthStatus,
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
  SyncConfig,
  SyncResult,
  SyncStatus,
} from "@repo/shared";
import {
  getAuthService,
  getCouponPaymentService,
  getDataService,
  getPortfolioEntryService,
  getPortfolioService,
  getSyncService,
} from "@repo/ui/adapters";
import { isTauri } from "@repo/ui/utils";

class FinCatchAPI {
  /**
   * Fetch stock history data
   */
  async fetchStockHistory(
    request: StockHistoryRequest,
  ): Promise<StockHistoryResponse> {
    try {
      return await getDataService().fetchStockHistory(request);
    } catch (error) {
      console.error("Error fetching stock history:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Fetch gold price data
   */
  async fetchGoldPrice(request: GoldPriceRequest): Promise<GoldPriceResponse> {
    try {
      return await getDataService().fetchGoldPrice(request);
    } catch (error) {
      console.error("Error fetching gold price:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Fetch exchange rate data
   */
  async fetchExchangeRate(
    request: ExchangeRateRequest,
  ): Promise<ExchangeRateResponse> {
    try {
      return await getDataService().fetchExchangeRate(request);
    } catch (error) {
      console.error("Error fetching exchange rate:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Fetch gold premium data
   */
  async fetchGoldPremium(
    request: GoldPremiumRequest,
    _signal?: AbortSignal,
  ): Promise<GoldPremiumResponse> {
    try {
      return await getDataService().fetchGoldPremium(request);
    } catch (error) {
      console.error("Error fetching gold premium:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Get list of available sources
   */
  async getSources(): Promise<Record<string, string[]>> {
    try {
      return await getDataService().getSources();
    } catch (error) {
      console.error("Error fetching sources:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Health check for all sources
   */
  async healthCheckAll(): Promise<Record<string, boolean>> {
    try {
      return await getDataService().healthCheckAll();
    } catch (error) {
      console.error("Error checking health:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Health check for a specific source
   */
  async healthCheckSource(sourceName: string): Promise<boolean> {
    try {
      return await getDataService().healthCheckSource(sourceName);
    } catch (error) {
      console.error(`Error checking health for ${sourceName}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Portfolio operations
   */
  async createPortfolio(portfolio: Portfolio): Promise<string> {
    try {
      return await getPortfolioService().createPortfolio(portfolio);
    } catch (error) {
      console.error("Error creating portfolio:", error);
      throw this.handleError(error);
    }
  }

  async getPortfolio(id: string): Promise<Portfolio> {
    try {
      return await getPortfolioService().getPortfolio(id);
    } catch (error) {
      console.error("Error getting portfolio:", error);
      throw this.handleError(error);
    }
  }

  async listPortfolios(): Promise<Portfolio[]> {
    try {
      return await getPortfolioService().listPortfolios();
    } catch (error) {
      console.error("Error listing portfolios:", error);
      throw this.handleError(error);
    }
  }

  async updatePortfolio(portfolio: Portfolio): Promise<void> {
    try {
      return await getPortfolioService().updatePortfolio(portfolio);
    } catch (error) {
      console.error("Error updating portfolio:", error);
      throw this.handleError(error);
    }
  }

  async deletePortfolio(id: string): Promise<void> {
    try {
      return await getPortfolioService().deletePortfolio(id);
    } catch (error) {
      console.error("Error deleting portfolio:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Portfolio Entry operations
   */
  async createEntry(entry: PortfolioEntry): Promise<string> {
    try {
      return await getPortfolioEntryService().createEntry(entry);
    } catch (error) {
      console.error("Error creating entry:", error);
      throw this.handleError(error);
    }
  }

  async getEntry(id: string): Promise<PortfolioEntry> {
    try {
      return await getPortfolioEntryService().getEntry(id);
    } catch (error) {
      console.error("Error getting entry:", error);
      throw this.handleError(error);
    }
  }

  async listEntries(portfolioId: string): Promise<PortfolioEntry[]> {
    try {
      return await getPortfolioEntryService().listEntries(portfolioId);
    } catch (error) {
      console.error("Error listing entries:", error);
      throw this.handleError(error);
    }
  }

  async updateEntry(entry: PortfolioEntry): Promise<void> {
    try {
      return await getPortfolioEntryService().updateEntry(entry);
    } catch (error) {
      console.error("Error updating entry:", error);
      throw this.handleError(error);
    }
  }

  async deleteEntry(id: string): Promise<void> {
    try {
      return await getPortfolioEntryService().deleteEntry(id);
    } catch (error) {
      console.error("Error deleting entry:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Bond Coupon Payment operations
   */
  async createCouponPayment(payment: BondCouponPayment): Promise<string> {
    try {
      return await getCouponPaymentService().createCouponPayment(payment);
    } catch (error) {
      console.error("Error creating coupon payment:", error);
      throw this.handleError(error);
    }
  }

  async listCouponPayments(entryId: string): Promise<BondCouponPayment[]> {
    try {
      return await getCouponPaymentService().listCouponPayments(entryId);
    } catch (error) {
      console.error("Error listing coupon payments:", error);
      throw this.handleError(error);
    }
  }

  async updateCouponPayment(payment: BondCouponPayment): Promise<void> {
    try {
      return await getCouponPaymentService().updateCouponPayment(payment);
    } catch (error) {
      console.error("Error updating coupon payment:", error);
      throw this.handleError(error);
    }
  }

  async deleteCouponPayment(id: string): Promise<void> {
    try {
      return await getCouponPaymentService().deleteCouponPayment(id);
    } catch (error) {
      console.error("Error deleting coupon payment:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Authentication operations
   * Uses platform-appropriate auth adapter:
   * - Tauri: TauriAuthAdapter (secure encrypted storage)
   * - Web: QmServerAuthAdapter (localStorage-based, calls qm-center-server)
   */
  async authConfigureSync(config: SyncConfig): Promise<void> {
    try {
      await getAuthService().configureSync(config);
    } catch (error) {
      console.error("Error configuring sync:", error);
      throw this.handleError(error);
    }
  }

  async authRegister(
    username: string,
    email: string,
    password: string,
  ): Promise<AuthResponse> {
    try {
      return await getAuthService().register(username, email, password);
    } catch (error) {
      console.error("Error registering user:", error);
      throw this.handleError(error);
    }
  }

  async authLogin(email: string, password: string): Promise<AuthResponse> {
    try {
      return await getAuthService().login(email, password);
    } catch (error) {
      console.error("Error logging in:", error);
      throw this.handleError(error);
    }
  }

  async authLogout(): Promise<void> {
    try {
      await getAuthService().logout();
    } catch (error) {
      console.error("Error logging out:", error);
      throw this.handleError(error);
    }
  }

  async authRefreshToken(): Promise<void> {
    try {
      await getAuthService().refreshToken();
    } catch (error) {
      console.error("Error refreshing token:", error);
      throw this.handleError(error);
    }
  }

  async authGetStatus(): Promise<AuthStatus> {
    try {
      return await getAuthService().getStatus();
    } catch (error) {
      console.error("Error getting auth status:", error);
      return { isAuthenticated: false };
    }
  }

  async authIsAuthenticated(): Promise<boolean> {
    try {
      return await getAuthService().isAuthenticated();
    } catch (error) {
      console.error("Error checking authentication:", error);
      return false;
    }
  }

  /**
   * Sync operations
   * Uses platform-specific adapters:
   * - Tauri: TauriSyncAdapter (uses Tauri invoke)
   * - Web: QmServerSyncAdapter (calls qm-center-server directly)
   */
  async syncNow(): Promise<SyncResult> {
    try {
      return await getSyncService().syncNow();
    } catch (error) {
      console.error("Error syncing:", error);
      throw this.handleError(error);
    }
  }

  async syncGetStatus(): Promise<SyncStatus> {
    try {
      return await getSyncService().getStatus();
    } catch (error) {
      console.error("Error getting sync status:", error);
      return {
        configured: false,
        authenticated: false,
        pendingChanges: 0,
      };
    }
  }

  //==========================================================================
  // Price Alert Operations
  // Note: Only available in Tauri mode (desktop app)
  //==========================================================================

  /**
   * Set alerts for a portfolio entry
   */
  async setEntryAlerts(
    entryId: string,
    targetPrice: number | null,
    stopLoss: number | null,
    alertEnabled: boolean | null,
  ): Promise<void> {
    if (!isTauri()) {
      throw new Error(
        "Price alerts can only be configured in the desktop app.",
      );
    }
    try {
      console.log("[Tauri IPC] set_entry_alerts", {
        entryId,
        targetPrice,
        stopLoss,
        alertEnabled,
      });
      await invoke<void>("set_entry_alerts", {
        entryId,
        targetPrice,
        stopLoss,
        alertEnabled,
      });
      console.log("[Tauri IPC Response] Entry alerts set");
    } catch (error) {
      console.error("Error setting entry alerts:", error);
      throw this.handleError(error);
    }
  }

  // Note: Alert monitoring methods removed - now handled by qm-sync server
  // - resetEntryAlert: Server tracks alert state
  // - getTriggeredAlerts: Server provides triggered alerts via notifications
  // - getAlertSettings: Server manages check interval and cooldown
  // - setAlertSettings: Server manages check interval and cooldown

  /**
   * Handle API errors
   */
  private handleError(error: unknown): Error {
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
