import type { BondCouponPayment } from "@fin-catch/shared";
import { HttpClient } from "./HttpClient";
import { ICouponPaymentService } from "@fin-catch/ui/adapters/factory/interfaces";

export class HttpCouponPaymentAdapter
  extends HttpClient
  implements ICouponPaymentService
{
  async createCouponPayment(payment: BondCouponPayment): Promise<string> {
    return this.post<BondCouponPayment, string>(
      "/api/coupon-payments",
      payment,
    );
  }

  async listCouponPayments(entryId: string): Promise<BondCouponPayment[]> {
    return this.get<BondCouponPayment[]>(
      `/api/entries/${encodeURIComponent(entryId)}/coupon-payments`,
    );
  }

  async updateCouponPayment(payment: BondCouponPayment): Promise<void> {
    await this.put<BondCouponPayment, void>(
      `/api/coupon-payments/${encodeURIComponent(payment.id)}`,
      payment,
    );
  }

  async deleteCouponPayment(id: string): Promise<void> {
    await this.del<void>(`/api/coupon-payments/${encodeURIComponent(id)}`);
  }
}
