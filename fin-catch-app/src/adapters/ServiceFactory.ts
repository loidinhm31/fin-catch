import { isTauri } from "@/utils/platform";

// Interfaces
import type {
  IPortfolioService,
  IPortfolioEntryService,
  ICouponPaymentService,
  IDataService,
} from "./interfaces";

// Tauri Adapters
import {
  TauriPortfolioAdapter,
  TauriPortfolioEntryAdapter,
  TauriCouponPaymentAdapter,
  TauriDataAdapter,
} from "./tauri";

// HTTP Adapters (for browser mode)
import {
  HttpPortfolioAdapter,
  HttpPortfolioEntryAdapter,
  HttpCouponPaymentAdapter,
  HttpDataAdapter,
} from "./web";

// Singleton instances (lazy initialized)
let portfolioService: IPortfolioService | null = null;
let portfolioEntryService: IPortfolioEntryService | null = null;
let couponPaymentService: ICouponPaymentService | null = null;
let dataService: IDataService | null = null;

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
 */
export const getDataService = (): IDataService => {
  if (!dataService) {
    dataService = isTauri() ? new TauriDataAdapter() : new HttpDataAdapter();
    console.log(
      `[ServiceFactory] Created DataService for ${isTauri() ? "Tauri" : "HTTP"}`,
    );
  }
  return dataService;
};

/**
 * Get all services as an object (useful for context providers)
 */
export const getAllServices = () => ({
  portfolio: getPortfolioService(),
  portfolioEntry: getPortfolioEntryService(),
  couponPayment: getCouponPaymentService(),
  data: getDataService(),
});

/**
 * Reset all service instances (useful for testing)
 */
export const resetServices = (): void => {
  portfolioService = null;
  portfolioEntryService = null;
  couponPaymentService = null;
  dataService = null;
  console.log("[ServiceFactory] Reset all services");
};
