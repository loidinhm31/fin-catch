import { useState } from "react";
import {
  FinancialDataPage,
  PortfolioPage,
  LoginPage,
  SettingsPage,
} from "@/components/pages";
import { LineChart, Wallet, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/atoms";
import { SyncStatusIndicator } from "@/components/molecules/SyncStatusIndicator";
import { BrowserSyncInitializer } from "@/components/organisms/BrowserSyncInitializer";
import { PriceAlertToast } from "@/components/organisms/PriceAlertToast";
import "./styles/global.css";

type Page = "financial-data" | "portfolio" | "settings";

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("portfolio");
  const [skipAuth, setSkipAuth] = useState(false);
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
        {/* Header with Sync Status */}
        {(isAuthenticated || skipAuth) && (
          <div
            className="fixed top-0 left-0 right-0 z-40 flex justify-end px-4 py-3"
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

        {/* Page Content */}
        <div
          style={{
            paddingBottom: "calc(80px + env(safe-area-inset-bottom, 0px))",
            paddingTop: isAuthenticated || skipAuth ? "76px" : "20px",
          }}
        >
          {currentPage === "financial-data" ? (
            <FinancialDataPage />
          ) : currentPage === "portfolio" ? (
            <PortfolioPage />
          ) : (
            <SettingsPage onLogout={handleLogout} />
          )}
        </div>

        {/* Bottom Navigation Bar - Glassmorphism Dark Mode */}
        <nav
          className="fixed bottom-0 left-0 right-0 z-50 border-t"
          style={{
            background: "rgba(15, 23, 42, 0.85)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderTopColor: "rgba(255, 255, 255, 0.1)",
            boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.4)",
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
          }}
        >
          <div className="max-w-lg mx-auto px-4">
            <div className="flex justify-around items-center py-2">
              <button
                onClick={() => setCurrentPage("financial-data")}
                className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all min-w-[70px] min-h-[56px]`}
                style={{
                  color:
                    currentPage === "financial-data" ? "#22D3EE" : "#64748B",
                  background:
                    currentPage === "financial-data"
                      ? "rgba(34, 211, 238, 0.15)"
                      : "transparent",
                  fontFamily: "var(--font-heading)",
                }}
              >
                <LineChart
                  className={`w-6 h-6 ${currentPage === "financial-data" ? "stroke-[2.5]" : "stroke-2"}`}
                />
                <span
                  className={`text-xs ${currentPage === "financial-data" ? "font-bold" : "font-medium"}`}
                >
                  Market
                </span>
              </button>
              <button
                onClick={() => setCurrentPage("portfolio")}
                className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all min-w-[70px] min-h-[56px]`}
                style={{
                  color: currentPage === "portfolio" ? "#8B5CF6" : "#64748B",
                  background:
                    currentPage === "portfolio"
                      ? "rgba(139, 92, 246, 0.15)"
                      : "transparent",
                  fontFamily: "var(--font-heading)",
                }}
              >
                <Wallet
                  className={`w-6 h-6 ${currentPage === "portfolio" ? "stroke-[2.5]" : "stroke-2"}`}
                />
                <span
                  className={`text-xs ${currentPage === "portfolio" ? "font-bold" : "font-medium"}`}
                >
                  Portfolio
                </span>
              </button>
              <button
                onClick={() => setCurrentPage("settings")}
                className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all min-w-[70px] min-h-[56px]`}
                style={{
                  color: currentPage === "settings" ? "#00D4FF" : "#64748B",
                  background:
                    currentPage === "settings"
                      ? "rgba(0, 212, 255, 0.15)"
                      : "transparent",
                  fontFamily: "var(--font-heading)",
                }}
              >
                <Settings
                  className={`w-6 h-6 ${currentPage === "settings" ? "stroke-[2.5]" : "stroke-2"}`}
                />
                <span
                  className={`text-xs ${currentPage === "settings" ? "font-bold" : "font-medium"}`}
                >
                  Settings
                </span>
              </button>
            </div>
          </div>
        </nav>

        {/* Price Alert Toast Notifications */}
        <PriceAlertToast />
      </div>
    </BrowserSyncInitializer>
  );
}
