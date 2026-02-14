// Portfolio operations
export {
  createPortfolio,
  getPortfolio,
  listPortfolios,
  updatePortfolio,
  deletePortfolio,
} from "./portfolioService";

// Portfolio Entry operations
export {
  createEntry,
  getEntry,
  listEntries,
  updateEntry,
  deleteEntry,
} from "./portfolioEntryService";

// Coupon Payment operations
export {
  createCouponPayment,
  listCouponPayments,
  updateCouponPayment,
  deleteCouponPayment,
} from "./couponPaymentService";

// Market Data operations
export {
  fetchStockHistory,
  fetchGoldPrice,
  fetchExchangeRate,
  fetchGoldPremium,
  getSources,
  healthCheckAll,
  healthCheckSource,
} from "./dataService";

// Auth operations
export {
  configureSync,
  authRegister,
  authLogin,
  authLogout,
  authRefreshToken,
  authGetStatus,
  authIsAuthenticated,
} from "./authService";

// Sync operations
export { syncNow, syncGetStatus, syncWithProgress } from "./syncService";
