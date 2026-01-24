import { invoke } from "@tauri-apps/api/core";
import type {
  AuthResponse,
  AuthStatus,
  IAuthService,
  SyncConfig,
} from "@fin-catch/shared";

/**
 * Tauri adapter for authentication operations
 * Wraps invoke() calls to Rust backend with secure encrypted token storage
 */
export class TauriAuthAdapter implements IAuthService {
  async configureSync(config: SyncConfig): Promise<void> {
    console.log("[Tauri IPC] auth_configure_sync", config);
    await invoke<void>("auth_configure_sync", {
      serverUrl: config.serverUrl ?? null,
      appId: config.appId ?? null,
      apiKey: config.apiKey ?? null,
    });
    console.log("[Tauri IPC Response] Sync configured");
  }

  async register(
    username: string,
    email: string,
    password: string,
  ): Promise<AuthResponse> {
    console.log("[Tauri IPC] auth_register", { username, email });
    const response = await invoke<AuthResponse>("auth_register", {
      username,
      email,
      password,
      appId: null,
      apiKey: null,
    });
    console.log("[Tauri IPC Response]", response);
    return response;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    console.log("[Tauri IPC] auth_login", { email });
    const response = await invoke<AuthResponse>("auth_login", {
      email,
      password,
    });
    console.log("[Tauri IPC Response]", response);
    return response;
  }

  async logout(): Promise<void> {
    console.log("[Tauri IPC] auth_logout");
    await invoke<void>("auth_logout");
    console.log("[Tauri IPC Response] Logged out");
  }

  async refreshToken(): Promise<void> {
    console.log("[Tauri IPC] auth_refresh_token");
    await invoke<void>("auth_refresh_token");
    console.log("[Tauri IPC Response] Token refreshed");
  }

  async getStatus(): Promise<AuthStatus> {
    console.log("[Tauri IPC] auth_get_status");
    const status = await invoke<AuthStatus>("auth_get_status");
    console.log("[Tauri IPC Response]", status);
    return status;
  }

  async isAuthenticated(): Promise<boolean> {
    console.log("[Tauri IPC] auth_is_authenticated");
    const isAuth = await invoke<boolean>("auth_is_authenticated");
    console.log("[Tauri IPC Response]", isAuth);
    return isAuth;
  }

  async getAccessToken(): Promise<string | null> {
    try {
      console.log("[Tauri IPC] auth_get_access_token");
      const token = await invoke<string>("auth_get_access_token");
      console.log("[Tauri IPC Response] Token retrieved");
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
