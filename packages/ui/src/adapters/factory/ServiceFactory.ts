import { isTauri, serviceLogger } from "@fin-catch/ui/utils";
import { env } from "@fin-catch/shared";

// Interfaces
import type {
  IAuthService,
  ICouponPaymentService,
  IDataService,
  IPortfolioEntryService,
  IPortfolioService,
  ISyncService,
  ITradingAuthService,
} from "./interfaces";

// Tauri Adapters (for storage via Tauri invoke)
import {
  TauriAuthAdapter,
  TauriCouponPaymentAdapter,
  TauriDataAdapter,
  TauriPortfolioAdapter,
  TauriPortfolioEntryAdapter,
  TauriSyncAdapter,
} from "../tauri";

// HTTP Adapters (for browser debug mode - SQLite access via embedded Axum server)
import {
  HttpCouponPaymentAdapter,
  HttpPortfolioAdapter,
  HttpPortfolioEntryAdapter,
} from "../http";

// Shared adapters (calls qm-center-server directly)
import { QmServerAuthAdapter, QmServerDataAdapter } from "../shared";

// IndexedDB adapters (for web/browser sync with local storage)
import { IndexedDBSyncAdapter } from "../web";

/**
 * Get server URL from environment or default
 */
function getServerUrl(): string {
  return env.serverUrl;
}

/**
 * Get app ID from environment or default
 */
function getAppId(): string {
  return env.appId;
}

/**
 * Get API key from environment or default
 */
function getApiKey(): string {
  return env.apiKey;
}

// Singleton instances (lazy initialized)
let portfolioService: IPortfolioService | null = null;
let portfolioEntryService: IPortfolioEntryService | null = null;
let couponPaymentService: ICouponPaymentService | null = null;
let dataService: IDataService | null = null;
let authService: IAuthService | null = null;
let syncService: ISyncService | null = null;
let tradingAuthService: ITradingAuthService | null = null;

/**
 * Get the Portfolio Service for the current platform
 */
export const getPortfolioService = (): IPortfolioService => {
  if (!portfolioService) {
    portfolioService = isTauri()
      ? new TauriPortfolioAdapter()
      : new HttpPortfolioAdapter();
    serviceLogger.factory(
      `Created PortfolioService for ${isTauri() ? "Tauri" : "HTTP"}`,
    );
  }
  return portfolioService;
};

/**
 * Get the Portfolio Entry Service for the current platform
 */
export const getPortfolioEntryService = (): IPortfolioEntryService => {
  if (!portfolioEntryService) {
    portfolioEntryService = isTauri()
      ? new TauriPortfolioEntryAdapter()
      : new HttpPortfolioEntryAdapter();
    serviceLogger.factory(
      `Created PortfolioEntryService for ${isTauri() ? "Tauri" : "HTTP"}`,
    );
  }
  return portfolioEntryService;
};

/**
 * Get the Coupon Payment Service for the current platform
 */
export const getCouponPaymentService = (): ICouponPaymentService => {
  if (!couponPaymentService) {
    couponPaymentService = isTauri()
      ? new TauriCouponPaymentAdapter()
      : new HttpCouponPaymentAdapter();
    serviceLogger.factory(
      `Created CouponPaymentService for ${isTauri() ? "Tauri" : "HTTP"}`,
    );
  }
  return couponPaymentService;
};

/**
 * Get the Data Service for the current platform
 * Tauri: TauriDataAdapter (IPC to Rust backend)
 * Web/HTTP: QmServerDataAdapter (calls qm-center-server directly)
 */
export const getDataService = (): IDataService => {
  if (!dataService) {
    dataService = isTauri()
      ? new TauriDataAdapter()
      : new QmServerDataAdapter();
    serviceLogger.factory(
      `Created DataService using ${isTauri() ? "TauriDataAdapter" : "QmServerDataAdapter"}`,
    );
  }
  return dataService;
};

/**
 * Get the Auth Service for the current platform
 * Tauri: TauriAuthAdapter (secure encrypted storage)
 * Web/HTTP: QmServerAuthAdapter (localStorage-based, calls qm-center-server)
 */
export const getAuthService = (): IAuthService => {
  if (!authService) {
    authService = isTauri()
      ? new TauriAuthAdapter()
      : new QmServerAuthAdapter();
    serviceLogger.factory(
      `Created AuthService for ${isTauri() ? "Tauri" : "QmSyncServer"}`,
    );
  }
  return authService;
};

/**
 * Get the Sync Service for the current platform
 * Tauri: TauriSyncAdapter (uses Tauri invoke)
 * Web: IndexedDBSyncAdapter (uses IndexedDB for local storage + QmSyncClient for server)
 */
export const getSyncService = (): ISyncService => {
  if (!syncService) {
    if (isTauri()) {
      syncService = new TauriSyncAdapter();
      serviceLogger.factory("Created SyncService for Tauri");
    } else {
      // Get or create auth service for token management
      const auth = getAuthService() as QmServerAuthAdapter;
      syncService = new IndexedDBSyncAdapter({
        serverUrl: getServerUrl(),
        appId: getAppId(),
        apiKey: getApiKey(),
        getTokens: () => auth.getTokens(),
        saveTokens: (accessToken, refreshToken, userId) =>
          auth.saveTokensExternal(accessToken, refreshToken, userId),
      });
      serviceLogger.factory("Created SyncService for IndexedDB");
    }
  }
  return syncService;
};

/**
 * Get all services as an object (useful for context providers)
 */
export const getAllServices = () => ({
  portfolio: getPortfolioService(),
  portfolioEntry: getPortfolioEntryService(),
  couponPayment: getCouponPaymentService(),
  data: getDataService(),
  auth: getAuthService(),
  sync: getSyncService(),
});

/**
 * Reset all service instances (useful for testing)
 */
export const resetServices = (): void => {
  portfolioService = null;
  portfolioEntryService = null;
  couponPaymentService = null;
  dataService = null;
  authService = null;
  syncService = null;
  serviceLogger.factory("Reset all services");
};

/**
 * Set custom Portfolio Service (e.g. for http adapter injection)
 */
export const setPortfolioService = (service: IPortfolioService): void => {
  portfolioService = service;
  serviceLogger.factory("Set custom PortfolioService");
};

/**
 * Set custom Portfolio Entry Service
 */
export const setPortfolioEntryService = (
  service: IPortfolioEntryService,
): void => {
  portfolioEntryService = service;
  serviceLogger.factory("Set custom PortfolioEntryService");
};

/**
 * Set custom Coupon Payment Service
 */
export const setCouponPaymentService = (
  service: ICouponPaymentService,
): void => {
  couponPaymentService = service;
  serviceLogger.factory("Set custom CouponPaymentService");
};

/**
 * Set custom Data Service
 */
export const setDataService = (service: IDataService): void => {
  dataService = service;
  serviceLogger.factory("Set custom DataService");
};

/**
 * Set custom Auth Service
 */
export const setAuthService = (service: IAuthService): void => {
  authService = service;
  serviceLogger.factory("Set custom AuthService");
};

/**
 * Set custom Sync Service
 */
export const setSyncService = (service: ISyncService): void => {
  syncService = service;
  serviceLogger.factory("Set custom SyncService");
};

/**
 * Get the Trading Auth Service
 * Returns null if not initialized (trading is optional)
 */
export const getTradingAuthService = (): ITradingAuthService | null => {
  return tradingAuthService;
};

/**
 * Set custom Trading Auth Service
 */
export const setTradingAuthService = (service: ITradingAuthService): void => {
  tradingAuthService = service;
  serviceLogger.factory("Set custom TradingAuthService");
};
