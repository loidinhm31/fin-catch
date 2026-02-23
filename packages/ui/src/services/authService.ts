import { AuthResponse, AuthStatus, SyncConfig } from "@fin-catch/shared";
import { getAuthService } from "@fin-catch/ui/adapters/factory";

export async function configureSync(config: SyncConfig): Promise<void> {
  return getAuthService().configureSync(config);
}

export async function authRegister(
  username: string,
  email: string,
  password: string,
): Promise<AuthResponse> {
  return getAuthService().register(username, email, password);
}

export async function authLogin(
  email: string,
  password: string,
): Promise<AuthResponse> {
  return getAuthService().login(email, password);
}

export async function authLogout(): Promise<void> {
  return getAuthService().logout();
}

export async function authRefreshToken(): Promise<void> {
  return getAuthService().refreshToken();
}

export async function authGetStatus(): Promise<AuthStatus> {
  return getAuthService().getStatus();
}

export async function authIsAuthenticated(): Promise<boolean> {
  return getAuthService().isAuthenticated();
}
