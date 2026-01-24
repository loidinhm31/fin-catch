import { useState, useEffect } from "react";
import {
  FinancialDataPage,
  PortfolioPage,
  LoginPage,
  SettingsPage,
} from "@repo/ui/pages";
import { LoadingSpinner } from "@repo/ui/atoms";
import { SyncStatusIndicator, BottomNav } from "@repo/ui/molecules";
import {
  BrowserSyncInitializer,
  PriceAlertToast,
  Sidebar,
} from "@repo/ui/organisms";
import "../styles/global.css";
import { useAuth } from "@repo/ui/hooks";

type Page = "financial-data" | "portfolio" | "settings";

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
  const [currentPage, setCurrentPage] = useState<Page>("portfolio");
  const [localSkipAuth, setLocalSkipAuth] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const {
    isAuthenticated,
    isLoading: isAuthLoading,
    checkAuthStatus,
  } = useAuth();

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
            onNavigate={setCurrentPage}
            onSyncTap={() => setCurrentPage("settings")}
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
            <SyncStatusIndicator onTap={() => setCurrentPage("settings")} />
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
          {currentPage === "financial-data" ? (
            <FinancialDataPage />
          ) : currentPage === "portfolio" ? (
            <PortfolioPage />
          ) : (
            <SettingsPage onLogout={handleLogout} />
          )}
        </div>

        {/* Mobile Bottom Navigation - Hidden on desktop and in embedded mode */}
        {showNavigation && (isAuthenticated || skipAuth) && (
          <BottomNav currentPage={currentPage} onNavigate={setCurrentPage} />
        )}

        {/* Price Alert Toast Notifications */}
        <PriceAlertToast />
      </div>
    </BrowserSyncInitializer>
  );
}
