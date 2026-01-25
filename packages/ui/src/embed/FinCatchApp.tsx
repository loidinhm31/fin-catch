/**
 * FinCatchApp - Embeddable wrapper component for fin-catch
 *
 * This component can be used to embed fin-catch into other applications
 * like qm-center-app. It sets up all necessary services and providers.
 */

import { useEffect, useMemo } from "react";
import { HashRouter } from "react-router-dom";
import type { IPlatformServices } from "../platform";
import { PlatformProvider } from "../platform";
import { AppShell } from "../templates";
import {
  QmServerAuthAdapter,
  QmServerDataAdapter,
  IndexedDBPortfolioAdapter,
  IndexedDBPortfolioEntryAdapter,
  IndexedDBCouponPaymentAdapter,
  IndexedDBSyncAdapter,
  TradingAuthAdapter,
  MarketDataAdapter,
  setAuthService,
  setCouponPaymentService,
  setDataService,
  setPortfolioEntryService,
  setPortfolioService,
  setSyncService,
  setTradingAuthService,
} from "../adapters";
import type { FinCatchEmbedProps } from "./types";

/**
 * Get server URL from environment or default
 */
function getServerUrl(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const env = (import.meta as any).env;
    if (env?.VITE_QM_SYNC_SERVER_URL) {
      return env.VITE_QM_SYNC_SERVER_URL;
    }
  } catch {
    // Not in a Vite environment
  }
  return "http://localhost:3000";
}

/**
 * Get app ID from environment or default
 */
function getAppId(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const env = (import.meta as any).env;
    if (env?.VITE_APP_ID) {
      return env.VITE_APP_ID;
    }
  } catch {
    // Not in a Vite environment
  }
  return "fin-catch";
}

/**
 * Get API key from environment or default
 */
function getApiKey(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const env = (import.meta as any).env;
    if (env?.VITE_API_KEY) {
      return env.VITE_API_KEY;
    }
  } catch {
    // Not in a Vite environment
  }
  return "";
}

/**
 * FinCatchApp - Main embeddable component
 *
 * When embedded in another app (like qm-center-app), this component:
 * 1. Uses shared localStorage tokens for SSO
 * 2. Hides outer navigation (sidebar, header) in embedded mode
 * 3. Notifies parent app on logout request
 */
export function FinCatchApp({
  authTokens,
  embedded = false,
  useRouter = true,
  onLogoutRequest,
  className,
  basePath,
}: FinCatchEmbedProps) {
  // Create services - memoized to prevent recreation on every render
  const services = useMemo<IPlatformServices>(() => {
    // Create auth adapter first (single source of truth for tokens)
    const authAdapter = new QmServerAuthAdapter();

    // Create sync adapter with token provider from auth service
    const syncAdapter = new IndexedDBSyncAdapter({
      serverUrl: getServerUrl(),
      appId: getAppId(),
      apiKey: getApiKey(),
      getTokens: () => authAdapter.getTokens(),
      saveTokens: (accessToken, refreshToken, userId) =>
        authAdapter.saveTokensExternal(accessToken, refreshToken, userId),
    });

    return {
      portfolio: new IndexedDBPortfolioAdapter(),
      portfolioEntry: new IndexedDBPortfolioEntryAdapter(),
      couponPayment: new IndexedDBCouponPaymentAdapter(),
      data: new QmServerDataAdapter(),
      auth: authAdapter,
      sync: syncAdapter,
      trading: new TradingAuthAdapter(),
      marketData: new MarketDataAdapter(),
    };
  }, []);

  // Inject services into the singleton factory
  useEffect(() => {
    setPortfolioService(services.portfolio);
    setPortfolioEntryService(services.portfolioEntry);
    setCouponPaymentService(services.couponPayment);
    setDataService(services.data);
    setAuthService(services.auth);
    setSyncService(services.sync);
    if (services.trading) {
      setTradingAuthService(services.trading);
    }
  }, [services]);

  // If external auth tokens are provided, save them to the auth service
  useEffect(() => {
    if (authTokens?.accessToken && authTokens?.refreshToken) {
      services.auth
        .saveTokensExternal?.(
          authTokens.accessToken,
          authTokens.refreshToken,
          authTokens.userId || "",
        )
        .catch(console.error);
    }
  }, [authTokens, services.auth]);

  // Determine if we should skip auth (tokens provided externally)
  const skipAuth = !!(authTokens?.accessToken && authTokens?.refreshToken);

  const content = (
    <AppShell
      skipAuth={skipAuth}
      embedded={embedded}
      onLogoutRequest={onLogoutRequest}
      basePath={basePath}
    />
  );

  return (
    <div className={className}>
      <PlatformProvider services={services}>
        {useRouter ? <HashRouter>{content}</HashRouter> : content}
      </PlatformProvider>
    </div>
  );
}
