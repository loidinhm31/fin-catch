import { useEffect, useState } from "react";
import { AuthStatus } from "@repo/shared";
import { finCatchAPI } from "@repo/ui/services";

export const useAuth = () => {
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkAuthStatus = async () => {
    setIsLoading(true);
    try {
      const status = await finCatchAPI.authGetStatus();
      setAuthStatus(status);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to check auth status",
      );
      setAuthStatus({ isAuthenticated: false });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await finCatchAPI.authLogout();
      setAuthStatus({ isAuthenticated: false });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to logout");
    }
  };

  const refreshToken = async () => {
    try {
      await finCatchAPI.authRefreshToken();
      await checkAuthStatus();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh token");
      // If refresh fails, user might need to re-authenticate
      setAuthStatus({ isAuthenticated: false });
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  return {
    authStatus,
    isAuthenticated: authStatus?.isAuthenticated ?? false,
    isLoading,
    error,
    checkAuthStatus,
    logout,
    refreshToken,
  };
};
