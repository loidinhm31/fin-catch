import { useState } from "react";
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

export function AppShell() {
  const [currentPage, setCurrentPage] = useState<Page>("portfolio");
  const [skipAuth, setSkipAuth] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const {
    isAuthenticated,
    isLoading: isAuthLoading,
    checkAuthStatus,
  } = useAuth();

  // Show loading spinner while checking auth status
  if (isAuthLoading) {
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
        onSkip={() => setSkipAuth(true)}
      />
    );
  }

  const handleLogout = () => {
    setSkipAuth(false);
    checkAuthStatus();
  };

  return (
    <BrowserSyncInitializer>
      <div
        className="min-h-screen"
        style={{
          background:
            "linear-gradient(135deg, #0F172A 0%, #0A0E27 50%, #1E1B4B 100%)",
        }}
      >
        {/* Desktop Sidebar - Hidden on mobile */}
        {(isAuthenticated || skipAuth) && (
          <Sidebar
            currentPage={currentPage}
            onNavigate={setCurrentPage}
            onSyncTap={() => setCurrentPage("settings")}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />
        )}

        {/* Header with Sync Status - Mobile only, desktop has sidebar */}
        {(isAuthenticated || skipAuth) && (
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

        {/* Page Content - Adjust margins for sidebar on desktop */}
        <div
          className={`pt-[60px] md:pt-6 pb-24 md:pb-6 transition-all duration-300 ${
            isSidebarCollapsed ? "md:ml-16" : "md:ml-64"
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

        {/* Mobile Bottom Navigation - Hidden on desktop */}
        {(isAuthenticated || skipAuth) && (
          <BottomNav currentPage={currentPage} onNavigate={setCurrentPage} />
        )}

        {/* Price Alert Toast Notifications */}
        <PriceAlertToast />
      </div>
    </BrowserSyncInitializer>
  );
}
