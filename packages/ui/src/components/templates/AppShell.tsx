import { lazy, Suspense, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "@fin-catch/ui/components/pages";
import { ErrorBoundary, LoadingSpinner } from "@fin-catch/ui/components/atoms";
import { SyncStatusIndicator } from "@fin-catch/ui/components/molecules";
import {
  PriceAlertToast,
  Sidebar,
  BottomNavigation,
} from "@fin-catch/ui/components/organisms";
import "@fin-catch/ui/styles";
import { useAuth, useNav } from "@fin-catch/ui/hooks";

// Lazy-loaded page components for code-splitting
// Import directly from individual files for optimal chunk splitting
const FinancialDataPage = lazy(() =>
  import("@fin-catch/ui/components/pages").then((m) => ({
    default: m.FinancialDataPage,
  })),
);
const PortfolioPage = lazy(() =>
  import("@fin-catch/ui/components/pages").then((m) => ({
    default: m.PortfolioPage,
  })),
);
const SettingsPage = lazy(() =>
  import("@fin-catch/ui/components/pages").then((m) => ({
    default: m.SettingsPage,
  })),
);
const TradingPage = lazy(() =>
  import("@fin-catch/ui/components/pages").then((m) => ({
    default: m.TradingPage,
  })),
);
const TradingOperationsPage = lazy(() =>
  import("@fin-catch/ui/components/pages").then((m) => ({
    default: m.TradingOperationsPage,
  })),
);

/**
 * Props for AppShell component
 */
export interface AppShellProps {
  /**
   * Skip auth check - use when tokens are provided externally (e.g., embedded mode)
   */
  skipAuth?: boolean;

  /**
   * Embedded mode - hides outer navigation (sidebar, header) for embedding in parent apps
   */
  embedded?: boolean;

  /**
   * Callback when user requests logout - allows parent app to handle logout
   */
  onLogoutRequest?: () => void;
}

export function AppShell({
  skipAuth: skipAuthProp = false,
  embedded = false,
  onLogoutRequest,
}: AppShellProps = {}) {
  const { to, navigate } = useNav();

  const [localSkipAuth, setLocalSkipAuth] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Skip initial auth check if tokens are provided externally (embedded mode)
  // This prevents unnecessary /api/v1/auth/me calls when already authenticated
  const { isLoading: isAuthLoading, checkAuthStatus } = useAuth({
    skipInitialCheck: skipAuthProp,
  });

  // Use either the prop or local state for skip auth
  const skipAuth = skipAuthProp || localSkipAuth;

  // Show loading spinner while checking auth status
  // But skip loading state if we're in skipAuth mode (embedded with external tokens)
  if (isAuthLoading && !skipAuth) {
    return (
      <div
        className="min-h-screen flex items-center justify-center cyber-grid-pattern"
        style={{
          background: "var(--color-bg-app)",
        }}
      >
        <LoadingSpinner />
      </div>
    );
  }

  const handleLogout = () => {
    // If embedded with external logout handler, call it
    if (onLogoutRequest) {
      onLogoutRequest();
    }
    setLocalSkipAuth(false);
    checkAuthStatus();
  };

  return (
    <div
      className="min-h-screen cyber-grid-pattern"
      style={{
        background: "var(--color-bg-app)",
      }}
    >
      {/* Desktop Sidebar - Hidden on mobile */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Header with Sync Status - Mobile only, desktop has sidebar */}
      <div
        className="fixed top-0 left-0 right-0 z-40 flex justify-end px-4 py-3 md:hidden"
        style={{
          background: "var(--glass-bg-dark-strong)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid var(--glass-border-light)",
          boxShadow: "var(--shadow-md)",
        }}
      >
        <SyncStatusIndicator onTap={() => navigate("/settings")} />
      </div>

      {/* Page Content - Adjust margins for sidebar on desktop */}
      <div
        className={`transition-all duration-300 pt-15 md:pt-6 pb-24 md:pb-6 ${
          isSidebarCollapsed ? "md:ml-16" : "md:ml-64"
        }`}
      >
        <ErrorBoundary>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="market" element={<FinancialDataPage />} />
              <Route path="portfolio" element={<PortfolioPage />} />
              {/* More specific route must come before less specific */}
              <Route
                path="trading/operations"
                element={<TradingOperationsPage />}
              />
              <Route path="trading" element={<TradingPage />} />
              <Route
                path="settings"
                element={<SettingsPage onLogout={handleLogout} />}
              />
              <Route
                path="login"
                element={
                  <LoginPage
                    onLoginSuccess={() => {
                      checkAuthStatus();
                      navigate("/portfolio");
                    }}
                    onSkip={() => {
                      setLocalSkipAuth(true);
                      navigate("/portfolio");
                    }}
                  />
                }
              />
              <Route
                path="/"
                element={<Navigate to={to("/portfolio")} replace />}
              />
              <Route
                path="*"
                element={<Navigate to={to("/portfolio")} replace />}
              />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </div>

      {/* Mobile Bottom Navigation - Hidden on desktop */}
      <BottomNavigation />

      {/* Price Alert Toast Notifications */}
      <PriceAlertToast />
    </div>
  );
}
