import { useState, useEffect } from "react";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  FinancialDataPage,
  PortfolioPage,
  LoginPage,
  SettingsPage,
  TradingPage,
  TradingOperationsPage,
} from "@fin-catch/ui/pages";
import { LoadingSpinner } from "@fin-catch/ui/atoms";
import { SyncStatusIndicator, BottomNav } from "@fin-catch/ui/molecules";
import {
  BrowserSyncInitializer,
  PriceAlertToast,
  Sidebar,
} from "@fin-catch/ui/organisms";
import "@fin-catch/ui/styles";
import { useAuth } from "@fin-catch/ui/hooks";

type Page = "financial-data" | "portfolio" | "trading" | "settings";

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

  /**
   * Base path for navigation when embedded (e.g., "/fin-catch")
   * If not provided, navigation uses relative paths (for standalone mode with HashRouter)
   */
  basePath?: string;
}

export function AppShell({
  skipAuth: skipAuthProp = false,
  embedded = false,
  onLogoutRequest,
  basePath,
}: AppShellProps = {}) {
  // Navigation hooks
  const location = useLocation();
  const navigate = useNavigate();

  const [localSkipAuth, setLocalSkipAuth] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const {
    isAuthenticated,
    isLoading: isAuthLoading,
    checkAuthStatus,
  } = useAuth();

  // Derive current page from path
  const getCurrentPage = (): Page => {
    // Check path to support root-level and embedded routing
    const path = location.pathname;
    if (path.endsWith("/market") || path === "/market") return "financial-data";
    // Match both /trading and /trading/operations
    if (path.includes("/trading") || path === "/trading") return "trading";
    if (path.endsWith("/settings") || path === "/settings") return "settings";
    return "portfolio"; // default
  };

  const currentPage = getCurrentPage();

  const handleNavigate = (page: Page) => {
    // Build the target path
    let pagePath;
    switch (page) {
      case "financial-data":
        pagePath = "market";
        break;
      case "trading":
        pagePath = "trading";
        break;
      case "settings":
        pagePath = "settings";
        break;
      case "portfolio":
      default:
        pagePath = "portfolio";
        break;
    }
    // Use absolute paths when basePath is provided (embedded mode), otherwise relative (standalone)
    const targetPath = basePath ? `${basePath}/${pagePath}` : pagePath;
    navigate(targetPath);
  };

  // Use either the prop or local state for skip auth
  const skipAuth = skipAuthProp || localSkipAuth;

  // Re-check auth status when skipAuthProp changes (for embedded mode with external tokens)
  // But only if not already skipping auth
  useEffect(() => {
    if (skipAuthProp && !isAuthLoading) {
      checkAuthStatus();
    }
  }, [skipAuthProp]); // eslint-disable-line react-hooks/exhaustive-deps

  // Show loading spinner while checking auth status
  // But skip loading state if we're in skipAuth mode (embedded with external tokens)
  if (isAuthLoading && !skipAuth) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background:
            "linear-gradient(135deg, #0F172A 0%, #0A0E27 50%, #1E1B4B 100%)",
        }}
      >
        <LoadingSpinner />
      </div>
    );
  }

  // Show login page if not authenticated and not skipped
  if (!isAuthenticated && !skipAuth) {
    return (
      <LoginPage
        onLoginSuccess={() => {
          checkAuthStatus();
        }}
        onSkip={() => setLocalSkipAuth(true)}
      />
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

  // In embedded mode, show a simplified layout without outer navigation
  const showNavigation = !embedded;

  return (
    <BrowserSyncInitializer>
      <div
        className="min-h-screen"
        style={{
          background:
            "linear-gradient(135deg, #0F172A 0%, #0A0E27 50%, #1E1B4B 100%)",
        }}
      >
        {/* Desktop Sidebar - Hidden on mobile and in embedded mode */}
        {showNavigation && (isAuthenticated || skipAuth) && (
          <Sidebar
            currentPage={currentPage}
            onNavigate={handleNavigate}
            onSyncTap={() => handleNavigate("settings")}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />
        )}

        {/* Header with Sync Status - Mobile only, desktop has sidebar, hidden in embedded mode */}
        {showNavigation && (isAuthenticated || skipAuth) && (
          <div
            className="fixed top-0 left-0 right-0 z-40 flex justify-end px-4 py-3 md:hidden"
            style={{
              background: "rgba(15, 23, 42, 0.85)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.4)",
            }}
          >
            <SyncStatusIndicator onTap={() => handleNavigate("settings")} />
          </div>
        )}

        {/* Page Content - Adjust margins for sidebar on desktop (no margins in embedded mode) */}
        <div
          className={`transition-all duration-300 ${
            embedded
              ? "pt-4 pb-4"
              : `pt-[60px] md:pt-6 pb-24 md:pb-6 ${
                  isSidebarCollapsed ? "md:ml-16" : "md:ml-64"
                }`
          }`}
        >
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
            <Route path="/" element={<Navigate to="portfolio" replace />} />
            <Route path="*" element={<Navigate to="portfolio" replace />} />
          </Routes>
        </div>

        {/* Mobile Bottom Navigation - Hidden on desktop and in embedded mode */}
        {showNavigation && (isAuthenticated || skipAuth) && (
          <BottomNav currentPage={currentPage} onNavigate={handleNavigate} />
        )}

        {/* Price Alert Toast Notifications */}
        <PriceAlertToast />
      </div>
    </BrowserSyncInitializer>
  );
}
