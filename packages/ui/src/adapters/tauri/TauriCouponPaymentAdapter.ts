import type { BondCouponPayment } from "@fin-catch/shared";
import { tauriInvoke } from "./tauriInvoke";
import { ICouponPaymentService } from "@fin-catch/ui/adapters/factory/interfaces";

export class TauriCouponPaymentAdapter implements ICouponPaymentService {
  async createCouponPayment(payment: BondCouponPayment): Promise<string> {
    return tauriInvoke<string>("create_coupon_payment", { payment });
  }

  async listCouponPayments(entryId: string): Promise<BondCouponPayment[]> {
    return tauriInvoke<BondCouponPayment[]>("list_coupon_payments", {
      entryId,
    });
  }

  async updateCouponPayment(payment: BondCouponPayment): Promise<void> {
    await tauriInvoke<void>("update_coupon_payment", { payment });
  }

  async deleteCouponPayment(id: string): Promise<void> {
    await tauriInvoke<void>("delete_coupon_payment", { id });
  }
}
