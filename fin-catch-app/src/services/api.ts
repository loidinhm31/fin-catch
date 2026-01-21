import { invoke } from "@tauri-apps/api/core";
import {
  isTauri,
  hasAuthSupport,
  isOpenedFromDesktop,
  getSessionToken,
  WEB_SERVER_PORT,
} from "@/utils/platform";
import {
  getPortfolioService,
  getPortfolioEntryService,
  getCouponPaymentService,
  getDataService,
} from "@/adapters";
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
} from "@/types";

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
   * Note: Auth is only available in Tauri mode
   */
  async authConfigureSync(config: SyncConfig): Promise<void> {
    if (!hasAuthSupport()) {
      throw new Error("Authentication is only available in the desktop app.");
    }
    try {
      console.log("[Tauri IPC] auth_configure_sync", config);
      await invoke<void>("auth_configure_sync", {
        serverUrl: config.serverUrl ?? null,
        appId: config.appId ?? null,
        apiKey: config.apiKey ?? null,
      });
      console.log("[Tauri IPC Response] Sync configured");
    } catch (error) {
      console.error("Error configuring sync:", error);
      throw this.handleError(error);
    }
  }

  async authRegister(
    username: string,
    email: string,
    password: string,
    appId?: string,
    apiKey?: string,
  ): Promise<AuthResponse> {
    if (!hasAuthSupport()) {
      throw new Error("Authentication is only available in the desktop app.");
    }
    try {
      console.log("[Tauri IPC] auth_register", { username, email, appId });
      const response = await invoke<AuthResponse>("auth_register", {
        username,
        email,
        password,
        appId: appId ?? null,
        apiKey: apiKey ?? null,
      });
      console.log("[Tauri IPC Response]", response);
      return response;
    } catch (error) {
      console.error("Error registering user:", error);
      throw this.handleError(error);
    }
  }

  async authLogin(email: string, password: string): Promise<AuthResponse> {
    if (!hasAuthSupport()) {
      throw new Error("Authentication is only available in the desktop app.");
    }
    try {
      console.log("[Tauri IPC] auth_login", { email });
      const response = await invoke<AuthResponse>("auth_login", {
        email,
        password,
      });
      console.log("[Tauri IPC Response]", response);
      return response;
    } catch (error) {
      console.error("Error logging in:", error);
      throw this.handleError(error);
    }
  }

  async authLogout(): Promise<void> {
    if (!hasAuthSupport()) {
      throw new Error("Authentication is only available in the desktop app.");
    }
    try {
      console.log("[Tauri IPC] auth_logout");
      await invoke<void>("auth_logout");
      console.log("[Tauri IPC Response] Logged out");
    } catch (error) {
      console.error("Error logging out:", error);
      throw this.handleError(error);
    }
  }

  async authRefreshToken(): Promise<void> {
    if (!hasAuthSupport()) {
      throw new Error("Authentication is only available in the desktop app.");
    }
    try {
      console.log("[Tauri IPC] auth_refresh_token");
      await invoke<void>("auth_refresh_token");
      console.log("[Tauri IPC Response] Token refreshed");
    } catch (error) {
      console.error("Error refreshing token:", error);
      throw this.handleError(error);
    }
  }

  async authGetStatus(): Promise<AuthStatus> {
    // In Tauri mode, use invoke
    if (isTauri()) {
      try {
        console.log("[Tauri IPC] auth_get_status");
        const status = await invoke<AuthStatus>("auth_get_status");
        console.log("[Tauri IPC Response]", status);
        return status;
      } catch (error) {
        console.error("Error getting auth status:", error);
        return { isAuthenticated: false };
      }
    }

    // In browser mode opened from desktop, try to call web server API
    if (isOpenedFromDesktop()) {
      try {
        const token = getSessionToken();
        if (!token) {
          // No token means the session expired or URL was manually modified
          return { isAuthenticated: false };
        }

        const url = `http://localhost:${WEB_SERVER_PORT}/api/auth/status?token=${encodeURIComponent(token)}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
          // Server responded but with error - return unauthenticated
          return { isAuthenticated: false };
        }

        const result = await response.json();
        if (!result.success) {
          return { isAuthenticated: false };
        }

        console.log("[Web API] Auth status:", result.data);
        return result.data;
      } catch (error) {
        // Connection refused or timeout - server not running, silently return unauthenticated
        // This is expected when browser was opened but desktop closed the server
        if ((error as Error).name !== "AbortError") {
          console.log("[Web API] Server not available, using offline mode");
        }
        return { isAuthenticated: false };
      }
    }

    // Pure web mode without desktop connection
    return { isAuthenticated: false };
  }

  async authIsAuthenticated(): Promise<boolean> {
    if (!hasAuthSupport()) {
      return false;
    }
    try {
      console.log("[Tauri IPC] auth_is_authenticated");
      const isAuth = await invoke<boolean>("auth_is_authenticated");
      console.log("[Tauri IPC Response]", isAuth);
      return isAuth;
    } catch (error) {
      console.error("Error checking authentication:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Sync operations
   * Works in both Tauri and browser mode (when opened from desktop)
   */
  async syncNow(): Promise<SyncResult> {
    // In Tauri mode, use invoke
    if (isTauri()) {
      try {
        console.log("[Tauri IPC] sync_now");
        const result = await invoke<SyncResult>("sync_now");
        console.log("[Tauri IPC Response]", result);
        return result;
      } catch (error) {
        console.error("Error syncing:", error);
        throw this.handleError(error);
      }
    }

    // In browser mode opened from desktop, call web server API
    if (isOpenedFromDesktop()) {
      try {
        const token = getSessionToken();
        if (!token) {
          throw new Error(
            "Session expired. Please reopen from the desktop app.",
          );
        }

        const url = `http://localhost:${WEB_SERVER_PORT}/api/sync/now?token=${encodeURIComponent(token)}`;
        console.log("[Web API] POST /api/sync/now");

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Sync failed: ${response.status}`);
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || "Sync failed");
        }

        console.log("[Web API Response]", result.data);
        return result.data;
      } catch (error) {
        console.error("Error syncing via web server:", error);
        throw this.handleError(error);
      }
    }

    // Pure web mode
    throw new Error(
      "Sync requires the desktop app. Please open this page from the desktop app using 'Open in Browser'.",
    );
  }

  async syncGetStatus(): Promise<SyncStatus> {
    // In Tauri mode, use invoke
    if (isTauri()) {
      try {
        console.log("[Tauri IPC] sync_get_status");
        const status = await invoke<SyncStatus>("sync_get_status");
        console.log("[Tauri IPC Response]", status);
        return status;
      } catch (error) {
        console.error("Error getting sync status:", error);
        return {
          configured: false,
          authenticated: false,
          pendingChanges: 0,
        };
      }
    }

    // In browser mode opened from desktop, try to call web server API
    if (isOpenedFromDesktop()) {
      try {
        const token = getSessionToken();
        if (!token) {
          return { configured: false, authenticated: false, pendingChanges: 0 };
        }

        const url = `http://localhost:${WEB_SERVER_PORT}/api/sync/status?token=${encodeURIComponent(token)}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
          return { configured: false, authenticated: false, pendingChanges: 0 };
        }

        const result = await response.json();
        if (!result.success) {
          return { configured: false, authenticated: false, pendingChanges: 0 };
        }

        console.log("[Web API] Sync status:", result.data);
        return result.data;
      } catch (error) {
        // Connection refused or timeout - server not running
        if ((error as Error).name !== "AbortError") {
          console.log("[Web API] Server not available for sync status");
        }
        return { configured: false, authenticated: false, pendingChanges: 0 };
      }
    }

    // Pure web mode without desktop connection
    return { configured: false, authenticated: false, pendingChanges: 0 };
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
