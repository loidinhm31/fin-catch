/**
 * Service Factory
 * Uses setter/getter pattern for service initialization
 *
 * ARCHITECTURE:
 * - Services are set externally via setters (e.g., in FinCatchApp.tsx)
 * - Getters throw if service not initialized (enforces explicit setup)
 * - All data storage uses IndexedDB adapters
 * - Platform-specific: DataService uses TauriDataAdapter (native) or QmServerDataAdapter (HTTP)
 */

import { serviceLogger } from "@fin-catch/ui/utils";

// Interfaces
import type {
  IAuthService,
  ICouponPaymentService,
  IDataService,
  IMarketDataService,
  IPortfolioEntryService,
  IPortfolioService,
  ISyncService,
  ITradingAuthService,
} from "./interfaces";

// Singleton instances (set via setters)
let portfolioService: IPortfolioService | null = null;
let portfolioEntryService: IPortfolioEntryService | null = null;
let couponPaymentService: ICouponPaymentService | null = null;
let dataService: IDataService | null = null;
let authService: IAuthService | null = null;
let syncService: ISyncService | null = null;
let tradingAuthService: ITradingAuthService | null = null;
let marketDataService: IMarketDataService | null = null;

// ============= Setters =============

/**
 * Set custom Portfolio Service
 */
export const setPortfolioService = (service: IPortfolioService): void => {
  portfolioService = service;
  serviceLogger.factory("Set PortfolioService");
};

/**
 * Set custom Portfolio Entry Service
 */
export const setPortfolioEntryService = (
  service: IPortfolioEntryService,
): void => {
  portfolioEntryService = service;
  serviceLogger.factory("Set PortfolioEntryService");
};

/**
 * Set custom Coupon Payment Service
 */
export const setCouponPaymentService = (
  service: ICouponPaymentService,
): void => {
  couponPaymentService = service;
  serviceLogger.factory("Set CouponPaymentService");
};

/**
 * Set custom Data Service
 */
export const setDataService = (service: IDataService): void => {
  dataService = service;
  serviceLogger.factory("Set DataService");
};

/**
 * Set custom Auth Service
 */
export const setAuthService = (service: IAuthService): void => {
  authService = service;
  serviceLogger.factory("Set AuthService");
};

/**
 * Set custom Sync Service
 */
export const setSyncService = (service: ISyncService): void => {
  syncService = service;
  serviceLogger.factory("Set SyncService");
};

/**
 * Set custom Trading Auth Service
 */
export const setTradingAuthService = (service: ITradingAuthService): void => {
  tradingAuthService = service;
  serviceLogger.factory("Set TradingAuthService");
};

/**
 * Set custom Market Data Service
 */
export const setMarketDataService = (service: IMarketDataService): void => {
  marketDataService = service;
  serviceLogger.factory("Set MarketDataService");
};

// ============= Getters =============

/**
 * Get the Portfolio Service
 * @throws Error if service not initialized
 */
export const getPortfolioService = (): IPortfolioService => {
  if (!portfolioService) {
    throw new Error(
      "PortfolioService not initialized. Call setPortfolioService first.",
    );
  }
  return portfolioService;
};

/**
 * Get the Portfolio Entry Service
 * @throws Error if service not initialized
 */
export const getPortfolioEntryService = (): IPortfolioEntryService => {
  if (!portfolioEntryService) {
    throw new Error(
      "PortfolioEntryService not initialized. Call setPortfolioEntryService first.",
    );
  }
  return portfolioEntryService;
};

/**
 * Get the Coupon Payment Service
 * @throws Error if service not initialized
 */
export const getCouponPaymentService = (): ICouponPaymentService => {
  if (!couponPaymentService) {
    throw new Error(
      "CouponPaymentService not initialized. Call setCouponPaymentService first.",
    );
  }
  return couponPaymentService;
};

/**
 * Get the Data Service
 * @throws Error if service not initialized
 */
export const getDataService = (): IDataService => {
  if (!dataService) {
    throw new Error("DataService not initialized. Call setDataService first.");
  }
  return dataService;
};

/**
 * Get the Auth Service
 * @throws Error if service not initialized
 */
export const getAuthService = (): IAuthService => {
  if (!authService) {
    throw new Error("AuthService not initialized. Call setAuthService first.");
  }
  return authService;
};

/**
 * Get the Sync Service
 * @throws Error if service not initialized
 */
export const getSyncService = (): ISyncService => {
  if (!syncService) {
    throw new Error("SyncService not initialized. Call setSyncService first.");
  }
  return syncService;
};

/**
 * Get the Trading Auth Service
 * Returns null if not initialized (trading is optional)
 */
export const getTradingAuthService = (): ITradingAuthService | null => {
  return tradingAuthService;
};

/**
 * Get the Market Data Service
 * Returns null if not initialized (market data is optional)
 */
export const getMarketDataService = (): IMarketDataService | null => {
  return marketDataService;
};

// ============= Optional Getters =============

export const getSyncServiceOptional = (): ISyncService | null => {
  return syncService;
};

export const getAuthServiceOptional = (): IAuthService | null => {
  return authService;
};

// ============= Utilities =============

/**
 * Get all services as an object (useful for context providers)
 * @throws Error if any required service is not initialized
 */
export const getAllServices = () => ({
  portfolio: getPortfolioService(),
  portfolioEntry: getPortfolioEntryService(),
  couponPayment: getCouponPaymentService(),
  data: getDataService(),
  auth: getAuthService(),
  sync: getSyncService(),
  trading: tradingAuthService ?? undefined,
  marketData: marketDataService ?? undefined,
});

/**
 * Reset all service instances (useful for testing or logout)
 */
export const resetServices = (): void => {
  portfolioService = null;
  portfolioEntryService = null;
  couponPaymentService = null;
  dataService = null;
  authService = null;
  syncService = null;
  tradingAuthService = null;
  marketDataService = null;
  serviceLogger.factory("Reset all services");
};
