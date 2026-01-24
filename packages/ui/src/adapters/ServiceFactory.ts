import { isTauri } from "@repo/ui/utils";

// Interfaces
import type {
  IAuthService,
  ICouponPaymentService,
  IDataService,
  IPortfolioEntryService,
  IPortfolioService,
  ISyncService,
} from "./interfaces";

// Tauri Adapters (for storage via Tauri invoke)
import {
  TauriAuthAdapter,
  TauriCouponPaymentAdapter,
  TauriPortfolioAdapter,
  TauriPortfolioEntryAdapter,
  TauriSyncAdapter,
} from "./tauri";

// HTTP Adapters (for browser debug mode - SQLite access via embedded Axum server)
import {
  HttpCouponPaymentAdapter,
  HttpPortfolioAdapter,
  HttpPortfolioEntryAdapter,
} from "./http";

// Shared adapters (calls qm-center-server directly)
import {
  QmServerAuthAdapter,
  QmServerDataAdapter,
  QmServerSyncAdapter,
} from "./shared";

// Singleton instances (lazy initialized)
let portfolioService: IPortfolioService | null = null;
let portfolioEntryService: IPortfolioEntryService | null = null;
let couponPaymentService: ICouponPaymentService | null = null;
let dataService: IDataService | null = null;
let authService: IAuthService | null = null;
let syncService: ISyncService | null = null;

/**
 * Get the Portfolio Service for the current platform
 */
export const getPortfolioService = (): IPortfolioService => {
  if (!portfolioService) {
    portfolioService = isTauri()
      ? new TauriPortfolioAdapter()
      : new HttpPortfolioAdapter();
    console.log(
      `[ServiceFactory] Created PortfolioService for ${isTauri() ? "Tauri" : "HTTP"}`,
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
    console.log(
      `[ServiceFactory] Created PortfolioEntryService for ${isTauri() ? "Tauri" : "HTTP"}`,
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
    console.log(
      `[ServiceFactory] Created CouponPaymentService for ${isTauri() ? "Tauri" : "HTTP"}`,
    );
  }
  return couponPaymentService;
};

/**
 * Get the Data Service for the current platform
 * All platforms use QmServerDataAdapter to call qm-center-server directly
 */
export const getDataService = (): IDataService => {
  if (!dataService) {
    dataService = new QmServerDataAdapter();
    console.log(
      "[ServiceFactory] Created DataService using QmServerDataAdapter",
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
    console.log(
      `[ServiceFactory] Created AuthService for ${isTauri() ? "Tauri" : "QmSyncServer"}`,
    );
  }
  return authService;
};

/**
 * Get the Sync Service for the current platform
 * Tauri: TauriSyncAdapter (uses Tauri invoke)
 * Web: QmServerSyncAdapter (calls qm-center-server directly)
 */
export const getSyncService = (): ISyncService => {
  if (!syncService) {
    syncService = isTauri()
      ? new TauriSyncAdapter()
      : new QmServerSyncAdapter();
    console.log(
      `[ServiceFactory] Created SyncService for ${isTauri() ? "Tauri" : "QmSyncServer"}`,
    );
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
  console.log("[ServiceFactory] Reset all services");
};

/**
 * Set custom Portfolio Service (e.g. for http adapter injection)
 */
export const setPortfolioService = (service: IPortfolioService): void => {
  portfolioService = service;
  console.log("[ServiceFactory] Set custom PortfolioService");
};

/**
 * Set custom Portfolio Entry Service
 */
export const setPortfolioEntryService = (
  service: IPortfolioEntryService,
): void => {
  portfolioEntryService = service;
  console.log("[ServiceFactory] Set custom PortfolioEntryService");
};

/**
 * Set custom Coupon Payment Service
 */
export const setCouponPaymentService = (
  service: ICouponPaymentService,
): void => {
  couponPaymentService = service;
  console.log("[ServiceFactory] Set custom CouponPaymentService");
};

/**
 * Set custom Data Service
 */
export const setDataService = (service: IDataService): void => {
  dataService = service;
  console.log("[ServiceFactory] Set custom DataService");
};

/**
 * Set custom Auth Service
 */
export const setAuthService = (service: IAuthService): void => {
  authService = service;
  console.log("[ServiceFactory] Set custom AuthService");
};

/**
 * Set custom Sync Service
 */
export const setSyncService = (service: ISyncService): void => {
  syncService = service;
  console.log("[ServiceFactory] Set custom SyncService");
};
