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

// Re-export IndexedDB adapters (for http/browser applications)
export {
  IndexedDBPortfolioAdapter,
  IndexedDBPortfolioEntryAdapter,
  IndexedDBCouponPaymentAdapter,
  IndexedDBSyncAdapter,
  IndexedDBSyncStorage,
  createIndexedDBSyncAdapter,
  db,
  generateId,
  getCurrentTimestamp,
  FinCatchDatabase,
  SYNC_META_KEYS,
  type SyncMeta,
  type PendingChange,
  type IndexedDBSyncAdapterConfig,
  type TokenProvider,
  type TokenSaver,
} from "./web";

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
