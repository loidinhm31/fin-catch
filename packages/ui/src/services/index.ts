import {
  ExchangeRateRequest,
  ExchangeRateResponse,
  GoldPremiumRequest,
  GoldPremiumResponse,
  GoldPriceRequest,
  GoldPriceResponse,
  StockHistoryRequest,
  StockHistoryResponse,
  Portfolio,
  PortfolioEntry,
  BondCouponPayment,
  SellTransaction,
  CapitalTransaction,
  AuthResponse,
  AuthStatus,
  SyncConfig,
  SyncProgress,
  SyncResult,
  SyncStatus,
} from "@fin-catch/shared";
import {
  getDataService,
  getPortfolioService,
  getPortfolioEntryService,
  getCouponPaymentService,
  getAuthService,
  getSyncService,
  getSellTransactionService,
  getCapitalService,
} from "@fin-catch/ui/adapters/factory";

// Each function calls the factory accessor per invocation — intentional lazy init.
// ServiceFactory returns cached singletons so the lookup cost is O(1).

// Portfolio operations
export async function createPortfolio(portfolio: Portfolio): Promise<string> {
  return getPortfolioService().createPortfolio(portfolio);
}
export async function getPortfolio(id: string): Promise<Portfolio> {
  return getPortfolioService().getPortfolio(id);
}
export async function listPortfolios(): Promise<Portfolio[]> {
  return getPortfolioService().listPortfolios();
}
export async function updatePortfolio(portfolio: Portfolio): Promise<void> {
  return getPortfolioService().updatePortfolio(portfolio);
}
export async function deletePortfolio(id: string): Promise<void> {
  return getPortfolioService().deletePortfolio(id);
}

// Portfolio Entry operations
export async function createEntry(entry: PortfolioEntry): Promise<string> {
  return getPortfolioEntryService().createEntry(entry);
}
export async function getEntry(id: string): Promise<PortfolioEntry> {
  return getPortfolioEntryService().getEntry(id);
}
export async function listEntries(portfolioId: string): Promise<PortfolioEntry[]> {
  return getPortfolioEntryService().listEntries(portfolioId);
}
export async function updateEntry(entry: PortfolioEntry): Promise<void> {
  return getPortfolioEntryService().updateEntry(entry);
}
export async function deleteEntry(id: string): Promise<void> {
  return getPortfolioEntryService().deleteEntry(id);
}

// Coupon Payment operations
export async function createCouponPayment(payment: BondCouponPayment): Promise<string> {
  return getCouponPaymentService().createCouponPayment(payment);
}
export async function listCouponPayments(entryId: string): Promise<BondCouponPayment[]> {
  return getCouponPaymentService().listCouponPayments(entryId);
}
export async function updateCouponPayment(payment: BondCouponPayment): Promise<void> {
  return getCouponPaymentService().updateCouponPayment(payment);
}
export async function deleteCouponPayment(id: string): Promise<void> {
  return getCouponPaymentService().deleteCouponPayment(id);
}

// Market Data operations
export async function fetchStockHistory(request: StockHistoryRequest): Promise<StockHistoryResponse> {
  return getDataService().fetchStockHistory(request);
}
export async function fetchGoldPrice(request: GoldPriceRequest): Promise<GoldPriceResponse> {
  return getDataService().fetchGoldPrice(request);
}
export async function fetchExchangeRate(request: ExchangeRateRequest): Promise<ExchangeRateResponse> {
  return getDataService().fetchExchangeRate(request);
}
export async function fetchGoldPremium(request: GoldPremiumRequest): Promise<GoldPremiumResponse> {
  return getDataService().fetchGoldPremium(request);
}
export async function getSources(): Promise<Record<string, string[]>> {
  return getDataService().getSources();
}
export async function healthCheckAll(): Promise<Record<string, boolean>> {
  return getDataService().healthCheckAll();
}
export async function healthCheckSource(sourceName: string): Promise<boolean> {
  return getDataService().healthCheckSource(sourceName);
}

// Auth operations
export async function configureSync(config: SyncConfig): Promise<void> {
  return getAuthService().configureSync(config);
}
export async function authRegister(
  username: string,
  email: string,
  password: string,
): Promise<AuthResponse> {
  return getAuthService().register(username, email, password);
}
export async function authLogin(email: string, password: string): Promise<AuthResponse> {
  return getAuthService().login(email, password);
}
export async function authLogout(): Promise<void> {
  return getAuthService().logout();
}
export async function authRefreshToken(): Promise<void> {
  return getAuthService().refreshToken();
}
export async function authGetStatus(): Promise<AuthStatus> {
  return getAuthService().getStatus();
}
export async function authIsAuthenticated(): Promise<boolean> {
  return getAuthService().isAuthenticated();
}

// Sync operations
export async function syncNow(): Promise<SyncResult> {
  return getSyncService().syncNow();
}
export async function syncGetStatus(): Promise<SyncStatus> {
  return getSyncService().getStatus();
}
export async function syncWithProgress(
  onProgress: (progress: SyncProgress) => void,
): Promise<SyncResult> {
  const syncService = getSyncService();
  if (syncService.syncWithProgress) {
    return syncService.syncWithProgress(onProgress);
  }
  return syncService.syncNow();
}

// Sell Transaction operations
export async function createSellTransaction(tx: SellTransaction): Promise<string> {
  return getSellTransactionService().createSellTransaction(tx);
}
export async function listSellTransactionsByEntry(entryId: string): Promise<SellTransaction[]> {
  return getSellTransactionService().listByEntry(entryId);
}
export async function listSellTransactionsByPortfolio(portfolioId: string): Promise<SellTransaction[]> {
  return getSellTransactionService().listByPortfolio(portfolioId);
}
export async function deleteSellTransaction(id: string): Promise<void> {
  return getSellTransactionService().deleteSellTransaction(id);
}

// Capital operations
export async function createCapitalTransaction(tx: CapitalTransaction): Promise<string> {
  return getCapitalService().createCapitalTransaction(tx);
}
export async function listCapitalTransactions(): Promise<CapitalTransaction[]> {
  return getCapitalService().listCapitalTransactions();
}
export async function deleteCapitalTransaction(id: string): Promise<void> {
  return getCapitalService().deleteCapitalTransaction(id);
}
