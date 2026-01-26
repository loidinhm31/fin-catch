import { useEffect, useState, useCallback, useRef } from "react";
import { AuthStatus } from "@fin-catch/shared";
import { finCatchAPI } from "@fin-catch/ui/services";

export interface UseAuthOptions {
  /**
   * Skip initial auth check on mount.
   * Use this when tokens are provided externally (e.g., in embedded mode).
   * When true, the hook will assume authenticated state without calling the server.
   */
  skipInitialCheck?: boolean;
}

export const useAuth = (options: UseAuthOptions = {}) => {
  const { skipInitialCheck = false } = options;

  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(
    skipInitialCheck ? { isAuthenticated: true } : null,
  );
  const [isLoading, setIsLoading] = useState(!skipInitialCheck);
  const [error, setError] = useState<string | null>(null);

  // Track if auth check is already in progress to prevent duplicate calls
  const isCheckingRef = useRef(false);
  // Track if initial check has been done to prevent duplicate initial calls
  const initialCheckDoneRef = useRef(skipInitialCheck);

  const checkAuthStatus = useCallback(async () => {
    // Prevent concurrent auth status checks
    if (isCheckingRef.current) {
      return;
    }

    isCheckingRef.current = true;
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
      isCheckingRef.current = false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await finCatchAPI.authLogout();
      setAuthStatus({ isAuthenticated: false });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to logout");
    }
  }, []);

  const refreshToken = useCallback(async () => {
    try {
      await finCatchAPI.authRefreshToken();
      await checkAuthStatus();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh token");
      // If refresh fails, user might need to re-authenticate
      setAuthStatus({ isAuthenticated: false });
    }
  }, [checkAuthStatus]);

  useEffect(() => {
    // Skip initial check if already done or skipInitialCheck is true
    if (initialCheckDoneRef.current) {
      return;
    }
    initialCheckDoneRef.current = true;
    checkAuthStatus();
  }, [checkAuthStatus]);

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
