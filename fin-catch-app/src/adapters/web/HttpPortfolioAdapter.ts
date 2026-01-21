import type { Portfolio } from "@/types/portfolio";
import type { IPortfolioService } from "@/adapters/interfaces";
import { WEB_SERVER_PORT, getSessionToken } from "@/utils/platform";

/**
 * API response wrapper from embedded server
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * HTTP adapter for portfolio operations
 * Calls the embedded Axum server on port 25092
 */
export class HttpPortfolioAdapter implements IPortfolioService {
  private readonly baseUrl = `http://localhost:${WEB_SERVER_PORT}`;

  private getUrlWithToken(endpoint: string): string {
    const token = getSessionToken();
    const separator = endpoint.includes("?") ? "&" : "?";
    return token
      ? `${this.baseUrl}${endpoint}${separator}token=${encodeURIComponent(token)}`
      : `${this.baseUrl}${endpoint}`;
  }

  async createPortfolio(portfolio: Portfolio): Promise<string> {
    const url = this.getUrlWithToken("/api/portfolios");
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(portfolio),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const result: ApiResponse<string> = await response.json();
    if (!result.success) {
      throw new Error(result.error || "Unknown API error");
    }

    console.log("[HTTP] Created portfolio:", result.data);
    return result.data!;
  }

  async getPortfolio(id: string): Promise<Portfolio> {
    const url = this.getUrlWithToken(
      `/api/portfolios/${encodeURIComponent(id)}`,
    );
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const result: ApiResponse<Portfolio> = await response.json();
    if (!result.success) {
      throw new Error(result.error || "Unknown API error");
    }

    console.log("[HTTP] Got portfolio:", result.data);
    return result.data!;
  }

  async listPortfolios(): Promise<Portfolio[]> {
    const url = this.getUrlWithToken("/api/portfolios");
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const result: ApiResponse<Portfolio[]> = await response.json();
    if (!result.success) {
      throw new Error(result.error || "Unknown API error");
    }

    console.log("[HTTP] Listed portfolios:", result.data?.length);
    return result.data!;
  }

  async updatePortfolio(portfolio: Portfolio): Promise<void> {
    const url = this.getUrlWithToken(
      `/api/portfolios/${encodeURIComponent(portfolio.id)}`,
    );
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(portfolio),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const result: ApiResponse<void> = await response.json();
    if (!result.success) {
      throw new Error(result.error || "Unknown API error");
    }

    console.log("[HTTP] Updated portfolio:", portfolio.id);
  }

  async deletePortfolio(id: string): Promise<void> {
    const url = this.getUrlWithToken(
      `/api/portfolios/${encodeURIComponent(id)}`,
    );
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const result: ApiResponse<void> = await response.json();
    if (!result.success) {
      throw new Error(result.error || "Unknown API error");
    }

    console.log("[HTTP] Deleted portfolio:", id);
  }
}
