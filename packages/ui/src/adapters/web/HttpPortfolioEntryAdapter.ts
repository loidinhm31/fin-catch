import type { PortfolioEntry } from "../../types";
import type { IPortfolioEntryService } from "../interfaces";
import { WEB_SERVER_PORT, getSessionToken } from "../../utils/platform";

/**
 * API response wrapper from embedded server
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * HTTP adapter for portfolio entry operations
 * Calls the embedded Axum server on port 25092
 */
export class HttpPortfolioEntryAdapter implements IPortfolioEntryService {
  private readonly baseUrl = `http://localhost:${WEB_SERVER_PORT}`;

  private getUrlWithToken(endpoint: string): string {
    const token = getSessionToken();
    const separator = endpoint.includes("?") ? "&" : "?";
    return token
      ? `${this.baseUrl}${endpoint}${separator}token=${encodeURIComponent(token)}`
      : `${this.baseUrl}${endpoint}`;
  }

  async createEntry(entry: PortfolioEntry): Promise<string> {
    const url = this.getUrlWithToken("/api/entries");
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(entry),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const result: ApiResponse<string> = await response.json();
    if (!result.success) {
      throw new Error(result.error || "Unknown API error");
    }

    console.log("[HTTP] Created entry:", result.data);
    return result.data!;
  }

  async getEntry(id: string): Promise<PortfolioEntry> {
    const url = this.getUrlWithToken(`/api/entries/${encodeURIComponent(id)}`);
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

    const result: ApiResponse<PortfolioEntry> = await response.json();
    if (!result.success) {
      throw new Error(result.error || "Unknown API error");
    }

    console.log("[HTTP] Got entry:", result.data);
    return result.data!;
  }

  async listEntries(portfolioId: string): Promise<PortfolioEntry[]> {
    const url = this.getUrlWithToken(
      `/api/portfolios/${encodeURIComponent(portfolioId)}/entries`,
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

    const result: ApiResponse<PortfolioEntry[]> = await response.json();
    if (!result.success) {
      throw new Error(result.error || "Unknown API error");
    }

    console.log(
      "[HTTP] Listed entries for portfolio:",
      portfolioId,
      result.data?.length,
    );
    return result.data!;
  }

  async updateEntry(entry: PortfolioEntry): Promise<void> {
    const url = this.getUrlWithToken(
      `/api/entries/${encodeURIComponent(entry.id)}`,
    );
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(entry),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const result: ApiResponse<void> = await response.json();
    if (!result.success) {
      throw new Error(result.error || "Unknown API error");
    }

    console.log("[HTTP] Updated entry:", entry.id);
  }

  async deleteEntry(id: string): Promise<void> {
    const url = this.getUrlWithToken(`/api/entries/${encodeURIComponent(id)}`);
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

    console.log("[HTTP] Deleted entry:", id);
  }
}
