import {
  PlatformProvider,
  type IPlatformServices,
} from "@fin-catch/ui/platform";
import {
  setPortfolioService,
  setPortfolioEntryService,
  setCouponPaymentService,
  setDataService,
  setAuthService,
  setSyncService,
  QmSyncServerDataAdapter,
  QmSyncServerAuthAdapter,
} from "@fin-catch/ui/adapters";
import { AppShell } from "@fin-catch/ui/templates";
import {
  IndexedDBPortfolioAdapter,
  IndexedDBPortfolioEntryAdapter,
  IndexedDBCouponPaymentAdapter,
} from "./adapters/indexeddb";
import { IndexedDBSyncAdapter } from "./sync";
import "@fin-catch/ui/styles";
import { useEffect } from "react";

// Create auth adapter first (single source of truth for tokens)
const authAdapter = new QmSyncServerAuthAdapter();

// Create sync adapter with token provider from auth service
// This ensures unified token management - auth owns tokens, sync gets them via provider
const syncAdapter = new IndexedDBSyncAdapter({
  serverUrl: import.meta.env.VITE_QM_SYNC_SERVER_URL || "http://localhost:3000",
  appId: import.meta.env.VITE_APP_ID || "fin-catch",
  apiKey: import.meta.env.VITE_API_KEY || "",
  getTokens: () => authAdapter.getTokens(),
  saveTokens: (accessToken, refreshToken, userId) =>
    authAdapter.saveTokensExternal(accessToken, refreshToken, userId),
});

// Create services for web platform
// Storage uses IndexedDB, financial data and auth use qm-sync-server
const webServices: IPlatformServices = {
  portfolio: new IndexedDBPortfolioAdapter(),
  portfolioEntry: new IndexedDBPortfolioEntryAdapter(),
  couponPayment: new IndexedDBCouponPaymentAdapter(),
  data: new QmSyncServerDataAdapter(),
  auth: authAdapter,
  sync: syncAdapter,
};

// Inject services into the singleton factory
// This ensures that hooks using getPortfolioService() will use these adapters
setPortfolioService(webServices.portfolio);
setPortfolioEntryService(webServices.portfolioEntry);
setCouponPaymentService(webServices.couponPayment);
setDataService(webServices.data);
setAuthService(webServices.auth);
setSyncService(webServices.sync);

function App() {
  // Ensure services are set on mount as well, just in case
  useEffect(() => {
    setPortfolioService(webServices.portfolio);
    setPortfolioEntryService(webServices.portfolioEntry);
    setCouponPaymentService(webServices.couponPayment);
    setDataService(webServices.data);
    setAuthService(webServices.auth);
    setSyncService(webServices.sync);
  }, []);

  return (
    <PlatformProvider services={webServices}>
      <AppShell />
    </PlatformProvider>
  );
}

export default App;
