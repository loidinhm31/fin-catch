import React from "react";
import { TradingPlatformConnect } from "@fin-catch/ui/components/organisms";
import { usePlatformServices } from "@fin-catch/ui/platform";

/**
 * TradingPage - Page for connecting to trading platforms
 *
 * Allows users to:
 * - View supported trading platforms
 * - Connect using platform credentials
 * - Verify OTP for platforms that require it
 * - View connection status and disconnect
 */
export const TradingPage: React.FC = () => {
  const { trading, auth } = usePlatformServices();

  // Check if user is authenticated (trading requires qm-center auth)
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean | null>(
    null,
  );

  React.useEffect(() => {
    auth
      .isAuthenticated()
      .then(setIsAuthenticated)
      .catch(() => setIsAuthenticated(false));
  }, [auth]);

  // Loading state
  if (isAuthenticated === null) {
    return (
      <div className="p-4 md:p-6">
        <div className="max-w-2xl mx-auto">
          <div
            className="rounded-2xl p-8 border text-center"
            style={{
              background: "rgba(26, 31, 58, 0.6)",
              backdropFilter: "blur(16px)",
              borderColor: "rgba(123, 97, 255, 0.2)",
            }}
          >
            <div
              className="w-8 h-8 mx-auto mb-4 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "#00d4ff", borderTopColor: "transparent" }}
            />
            <p style={{ color: "var(--color-text-secondary)" }}>
              Checking authentication...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="p-4 md:p-6">
        <div className="max-w-2xl mx-auto">
          <div
            className="rounded-2xl p-8 border text-center"
            style={{
              background: "rgba(26, 31, 58, 0.6)",
              backdropFilter: "blur(16px)",
              borderColor: "rgba(255, 163, 0, 0.3)",
            }}
          >
            <div
              className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255, 163, 0, 0.1)" }}
            >
              <svg
                className="w-8 h-8"
                style={{ color: "#ffa500" }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m0 0v2m0-2h2m-2 0H10m2-10a4 4 0 100 8 4 4 0 000-8z"
                />
              </svg>
            </div>
            <h2
              className="text-xl font-semibold mb-2"
              style={{ color: "var(--color-text-primary)" }}
            >
              Login Required
            </h2>
            <p
              className="text-sm mb-4"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Please login to your FinCatch account to connect trading
              platforms.
            </p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              Go to Settings to login or create an account.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Trading service not available
  if (!trading) {
    return (
      <div className="p-4 md:p-6">
        <div className="max-w-2xl mx-auto">
          <div
            className="rounded-2xl p-8 border text-center"
            style={{
              background: "rgba(26, 31, 58, 0.6)",
              backdropFilter: "blur(16px)",
              borderColor: "rgba(255, 51, 102, 0.3)",
            }}
          >
            <div
              className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255, 51, 102, 0.1)" }}
            >
              <svg
                className="w-8 h-8"
                style={{ color: "#ff3366" }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2
              className="text-xl font-semibold mb-2"
              style={{ color: "var(--color-text-primary)" }}
            >
              Trading Not Available
            </h2>
            <p
              className="text-sm"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Trading platform integration is not available in this environment.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <h1
            className="text-2xl font-bold mb-1"
            style={{
              color: "var(--color-text-primary)",
              fontFamily: "var(--font-heading)",
            }}
          >
            Trading
          </h1>
          <p
            className="text-sm"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Connect to your trading platforms for live order management
          </p>
        </div>

        {/* Trading Platform Connect Component */}
        <TradingPlatformConnect tradingService={trading} />
      </div>
    </div>
  );
};
