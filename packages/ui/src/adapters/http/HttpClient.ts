import { getSessionToken, WEB_SERVER_PORT } from "@fin-catch/ui/utils";
import { serviceLogger } from "@fin-catch/ui/utils";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class HttpClient {
  protected readonly baseUrl = `http://localhost:${WEB_SERVER_PORT}`;

  protected getUrlWithToken(endpoint: string): string {
    const token = getSessionToken();
    const separator = endpoint.includes("?") ? "&" : "?";
    return token
      ? `${this.baseUrl}${endpoint}${separator}token=${encodeURIComponent(token)}`
      : `${this.baseUrl}${endpoint}`;
  }

  protected async post<TReq, TRes>(
    endpoint: string,
    body: TReq,
  ): Promise<TRes> {
    serviceLogger.http(`POST ${endpoint}`);
    const url = this.getUrlWithToken(endpoint);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });
    return this.handleResponse<TRes>(response);
  }

  protected async get<TRes>(endpoint: string): Promise<TRes> {
    serviceLogger.http(`GET ${endpoint}`);
    const url = this.getUrlWithToken(endpoint);
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    return this.handleResponse<TRes>(response);
  }

  protected async put<TReq, TRes>(endpoint: string, body: TReq): Promise<TRes> {
    serviceLogger.http(`PUT ${endpoint}`);
    const url = this.getUrlWithToken(endpoint);
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });
    return this.handleResponse<TRes>(response);
  }

  protected async del<TRes>(endpoint: string): Promise<TRes> {
    serviceLogger.http(`DELETE ${endpoint}`);
    const url = this.getUrlWithToken(endpoint);
    const response = await fetch(url, {
      method: "DELETE",
      headers: { Accept: "application/json" },
    });
    return this.handleResponse<TRes>(response);
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const result: ApiResponse<T> = await response.json();
    if (!result.success) {
      throw new Error(result.error || "Unknown API error");
    }

    serviceLogger.httpDebug("Response", result.data);
    return result.data!;
  }
}
