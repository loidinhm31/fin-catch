// Re-export interfaces
export type {
  IPortfolioService,
  IPortfolioEntryService,
  ICouponPaymentService,
  IDataService,
  IAuthService,
  ISyncService,
} from "./interfaces";

// Re-export shared adapters (used by both Tauri and Web for APIs)
export {
  QmServerDataAdapter,
  type QmServerConfig,
  QmServerAuthAdapter,
  type QmServerAuthConfig,
  QmServerSyncAdapter,
  type QmServerSyncConfig,
} from "./shared";

// Re-export factory functions
export {
  getPortfolioService,
  getPortfolioEntryService,
  getCouponPaymentService,
  getDataService,
  getAuthService,
  getSyncService,
  getAllServices,
  resetServices,
  setPortfolioService,
  setPortfolioEntryService,
  setCouponPaymentService,
  setDataService,
  setAuthService,
  setSyncService,
} from "./ServiceFactory";
