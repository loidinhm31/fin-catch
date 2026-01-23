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
  QmSyncServerDataAdapter,
  type QmSyncServerConfig,
  QmSyncServerAuthAdapter,
  type QmSyncServerAuthConfig,
  QmSyncServerSyncAdapter,
  type QmSyncServerSyncConfig,
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
