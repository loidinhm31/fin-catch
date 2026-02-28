import type { ICouponPaymentService } from "@fin-catch/ui/adapters/factory/interfaces";
import type { BondCouponPayment } from "@fin-catch/shared";
import { getDb } from "./database";
import { withSyncTracking, trackDelete } from "./indexedDbHelpers";

export class IndexedDBCouponPaymentAdapter implements ICouponPaymentService {
  async createCouponPayment(payment: BondCouponPayment): Promise<string> {
    const newPayment = withSyncTracking(payment);
    await getDb().couponPayments.add(newPayment);
    return newPayment.id!;
  }

  async listCouponPayments(entryId: string): Promise<BondCouponPayment[]> {
    const payments = await getDb().couponPayments
      .where("entryId")
      .equals(entryId)
      .filter((p) => !p.deleted)
      .toArray();
    return payments.sort((a, b) => a.paymentDate - b.paymentDate);
  }

  async updateCouponPayment(payment: BondCouponPayment): Promise<void> {
    const existing = await getDb().couponPayments.get(payment.id);
    if (!existing) {
      throw new Error(`Coupon payment not found: ${payment.id}`);
    }
    await getDb().couponPayments.put(withSyncTracking(payment, existing));
  }

  async deleteCouponPayment(id: string): Promise<void> {
    await getDb().transaction(
      "rw",
      [getDb().couponPayments, getDb()._pendingChanges],
      async () => {
        const payment = await getDb().couponPayments.get(id);
        if (payment) {
          await trackDelete("couponPayments", id, payment.syncVersion || 0);
        }
        await getDb().couponPayments.delete(id);
      },
    );
  }
}
