/**
 * FinCatchApp - Embeddable wrapper component for fin-catch
 *
 * This component can be used to embed fin-catch into other applications
 * like qm-center-app. It sets up all necessary services and providers.
 */

import {
  IndexedDBCouponPaymentAdapter,
  IndexedDBPortfolioAdapter,
  IndexedDBPortfolioEntryAdapter,
  IndexedDBSyncAdapter,
} from "@fin-catch/ui/adapters/web";
import {
  MarketDataAdapter,
  QmServerAuthAdapter,
  QmServerDataAdapter,
  TradingAuthAdapter,
} from "@fin-catch/ui/adapters/shared";
import { TauriDataAdapter } from "@fin-catch/ui/adapters/tauri";
import type { FinCatchEmbedProps } from "./types";
import { useEffect, useMemo, useRef, useState } from "react";
import { IPlatformServices, PlatformProvider } from "@fin-catch/ui/platform";
import { AppShell } from "@fin-catch/ui/components/templates";
import { BrowserRouter } from "react-router-dom";
import { BasePathContext, PortalContainerContext } from "../hooks/useNav";
import { DialogProvider, ThemeProvider } from "@fin-catch/ui/contexts";
import { isTauri } from "@fin-catch/ui/utils";
import {
  getAllServices,
  setAuthService,
  setCouponPaymentService,
  setDataService,
  setMarketDataService,
  setPortfolioEntryService,
  setPortfolioService,
  setSyncService,
  setTradingAuthService,
} from "@fin-catch/ui/adapters";

/**
 * FinCatchApp - Main embeddable component
 */
export function FinCatchApp({
  authTokens,
  embedded = false,
  useRouter = true,
  onLogoutRequest,
  className,
  basePath,
}: FinCatchEmbedProps) {
  // Initialize services synchronously before first render
  const platform = useMemo<IPlatformServices>(() => {
    // Data storage services - all platforms use IndexedDB
    setPortfolioService(new IndexedDBPortfolioAdapter());
    setPortfolioEntryService(new IndexedDBPortfolioEntryAdapter());
    setCouponPaymentService(new IndexedDBCouponPaymentAdapter());

    // Data service - platform-specific for performance
    if (isTauri()) {
      setDataService(new TauriDataAdapter());
    } else {
      setDataService(new QmServerDataAdapter());
    }

    // Auth service - single source of truth for tokens
    const auth = new QmServerAuthAdapter();
    setAuthService(auth);

    // Sync service - configured with auth token provider and dynamic config
    const syncAdapter = new IndexedDBSyncAdapter({
      getConfig: () => auth.getSyncConfig(),
      getTokens: () => auth.getTokens(),
      saveTokens: (accessToken, refreshToken, userId) =>
        auth.saveTokensExternal(accessToken, refreshToken, userId),
    });
    setSyncService(syncAdapter);

    // Trading services (optional)
    setTradingAuthService(new TradingAuthAdapter());
    setMarketDataService(new MarketDataAdapter());

    return getAllServices();
  }, []);

  // If external auth tokens are provided, save them to the auth service
  useEffect(() => {
    if (authTokens?.accessToken && authTokens?.refreshToken) {
      platform.auth
        .saveTokensExternal?.(
          authTokens.accessToken,
          authTokens.refreshToken,
          authTokens.userId || "",
        )
        .catch(console.error);
    }
  }, [authTokens, platform.auth]);

  // Determine if we should skip auth (tokens provided externally)
  const skipAuth = !!(authTokens?.accessToken && authTokens?.refreshToken);

  const containerRef = useRef<HTMLDivElement>(null);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(
    null,
  );

  useEffect(() => {
    setPortalContainer(containerRef.current);
  }, []);

  const content = (
    <AppShell
      skipAuth={skipAuth}
      embedded={embedded}
      onLogoutRequest={onLogoutRequest}
    />
  );

  return (
    <div ref={containerRef} className={className}>
      <PlatformProvider services={platform}>
        <ThemeProvider embedded={embedded}>
          <DialogProvider>
            <BasePathContext.Provider value={basePath || ""}>
              <PortalContainerContext.Provider value={portalContainer}>
                {useRouter ? <BrowserRouter>{content}</BrowserRouter> : content}
              </PortalContainerContext.Provider>
            </BasePathContext.Provider>
          </DialogProvider>
        </ThemeProvider>
      </PlatformProvider>
    </div>
  );
}
