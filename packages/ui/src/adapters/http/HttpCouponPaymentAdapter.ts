import type { BondCouponPayment, ICouponPaymentService } from "@repo/shared";
import { getSessionToken, WEB_SERVER_PORT } from "@repo/ui/utils";

/**
 * API response wrapper from embedded server
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * HTTP adapter for coupon payment operations
 * Calls the embedded Axum server on port 25092
 */
export class HttpCouponPaymentAdapter implements ICouponPaymentService {
  private readonly baseUrl = `http://localhost:${WEB_SERVER_PORT}`;

  private getUrlWithToken(endpoint: string): string {
    const token = getSessionToken();
    const separator = endpoint.includes("?") ? "&" : "?";
    return token
      ? `${this.baseUrl}${endpoint}${separator}token=${encodeURIComponent(token)}`
      : `${this.baseUrl}${endpoint}`;
  }

  async createCouponPayment(payment: BondCouponPayment): Promise<string> {
    const url = this.getUrlWithToken("/api/coupon-payments");
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payment),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const result: ApiResponse<string> = await response.json();
    if (!result.success) {
      throw new Error(result.error || "Unknown API error");
    }

    console.log("[HTTP] Created coupon payment:", result.data);
    return result.data!;
  }

  async listCouponPayments(entryId: string): Promise<BondCouponPayment[]> {
    const url = this.getUrlWithToken(
      `/api/entries/${encodeURIComponent(entryId)}/coupon-payments`,
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

    const result: ApiResponse<BondCouponPayment[]> = await response.json();
    if (!result.success) {
      throw new Error(result.error || "Unknown API error");
    }

    console.log(
      "[HTTP] Listed coupon payments for entry:",
      entryId,
      result.data?.length,
    );
    return result.data!;
  }

  async updateCouponPayment(payment: BondCouponPayment): Promise<void> {
    const url = this.getUrlWithToken(
      `/api/coupon-payments/${encodeURIComponent(payment.id)}`,
    );
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payment),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const result: ApiResponse<void> = await response.json();
    if (!result.success) {
      throw new Error(result.error || "Unknown API error");
    }

    console.log("[HTTP] Updated coupon payment:", payment.id);
  }

  async deleteCouponPayment(id: string): Promise<void> {
    const url = this.getUrlWithToken(
      `/api/coupon-payments/${encodeURIComponent(id)}`,
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

    console.log("[HTTP] Deleted coupon payment:", id);
  }
}
