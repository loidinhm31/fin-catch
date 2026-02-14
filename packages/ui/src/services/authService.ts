import { AuthResponse, AuthStatus, SyncConfig } from "@fin-catch/shared";
import { getAuthService } from "@fin-catch/ui/adapters/factory";

function handleError(error: unknown): Error {
  if (typeof error === "string") {
    return new Error(error);
  }
  return error instanceof Error ? error : new Error("Unknown error occurred");
}

export async function configureSync(config: SyncConfig): Promise<void> {
  try {
    await getAuthService().configureSync(config);
  } catch (error) {
    console.error("Error configuring sync:", error);
    throw handleError(error);
  }
}

export async function authRegister(
  username: string,
  email: string,
  password: string,
): Promise<AuthResponse> {
  try {
    return await getAuthService().register(username, email, password);
  } catch (error) {
    console.error("Error registering user:", error);
    throw handleError(error);
  }
}

export async function authLogin(
  email: string,
  password: string,
): Promise<AuthResponse> {
  try {
    return await getAuthService().login(email, password);
  } catch (error) {
    console.error("Error logging in:", error);
    throw handleError(error);
  }
}

export async function authLogout(): Promise<void> {
  try {
    await getAuthService().logout();
  } catch (error) {
    console.error("Error logging out:", error);
    throw handleError(error);
  }
}

export async function authRefreshToken(): Promise<void> {
  try {
    await getAuthService().refreshToken();
  } catch (error) {
    console.error("Error refreshing token:", error);
    throw handleError(error);
  }
}

export async function authGetStatus(): Promise<AuthStatus> {
  try {
    return await getAuthService().getStatus();
  } catch (error) {
    console.error("Error getting auth status:", error);
    return { isAuthenticated: false };
  }
}

export async function authIsAuthenticated(): Promise<boolean> {
  try {
    return await getAuthService().isAuthenticated();
  } catch (error) {
    console.error("Error checking authentication:", error);
    return false;
  }
}
