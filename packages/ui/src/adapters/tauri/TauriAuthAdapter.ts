import { invoke } from "@tauri-apps/api/core";
import type {
  AuthResponse,
  AuthStatus,
  IAuthService,
  SyncConfig,
} from "@fin-catch/shared";
import { serviceLogger } from "@fin-catch/ui/utils";

/**
 * Tauri adapter for authentication operations
 * Wraps invoke() calls to Rust backend with secure encrypted token storage
 */
export class TauriAuthAdapter implements IAuthService {
  async configureSync(config: SyncConfig): Promise<void> {
    serviceLogger.tauri("auth_configure_sync");
    await invoke<void>("auth_configure_sync", {
      serverUrl: config.serverUrl ?? null,
      appId: config.appId ?? null,
      apiKey: config.apiKey ?? null,
    });
    serviceLogger.tauriDebug("Sync configured");
  }

  async register(
    username: string,
    email: string,
    password: string,
  ): Promise<AuthResponse> {
    serviceLogger.tauri("auth_register");
    const response = await invoke<AuthResponse>("auth_register", {
      username,
      email,
      password,
      appId: null,
      apiKey: null,
    });
    serviceLogger.tauriDebug("Response received");
    return response;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    serviceLogger.tauri("auth_login");
    const response = await invoke<AuthResponse>("auth_login", {
      email,
      password,
    });
    serviceLogger.tauriDebug("Response received");
    return response;
  }

  async logout(): Promise<void> {
    serviceLogger.tauri("auth_logout");
    await invoke<void>("auth_logout");
    serviceLogger.tauriDebug("Logged out");
  }

  async refreshToken(): Promise<void> {
    serviceLogger.tauri("auth_refresh_token");
    await invoke<void>("auth_refresh_token");
    serviceLogger.tauriDebug("Token refreshed");
  }

  async getStatus(): Promise<AuthStatus> {
    serviceLogger.tauri("auth_get_status");
    const status = await invoke<AuthStatus>("auth_get_status");
    serviceLogger.tauriDebug("Status received");
    return status;
  }

  async isAuthenticated(): Promise<boolean> {
    serviceLogger.tauri("auth_is_authenticated");
    const isAuth = await invoke<boolean>("auth_is_authenticated");
    serviceLogger.tauriDebug(`Authenticated: ${isAuth}`);
    return isAuth;
  }

  async getAccessToken(): Promise<string | null> {
    try {
      serviceLogger.tauri("auth_get_access_token");
      const token = await invoke<string>("auth_get_access_token");
      serviceLogger.tauriDebug("Token retrieved");
      return token;
    } catch {
      return null;
    }
  }

  /**
   * Get all tokens for sync service integration.
   * In Tauri, the Rust backend manages tokens, so we only expose what's available.
   */
  async getTokens(): Promise<{
    accessToken?: string;
    refreshToken?: string;
    userId?: string;
  }> {
    try {
      const [accessToken, status] = await Promise.all([
        invoke<string>("auth_get_access_token"),
        invoke<AuthStatus>("auth_get_status"),
      ]);
      return {
        accessToken,
        refreshToken: undefined, // Tauri manages refresh internally
        userId: status.userId,
      };
    } catch {
      return {};
    }
  }
}
