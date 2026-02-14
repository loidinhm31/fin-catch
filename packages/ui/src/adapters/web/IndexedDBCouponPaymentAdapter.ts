import type { ICouponPaymentService } from "@fin-catch/ui/adapters/factory/interfaces";
import type { BondCouponPayment } from "@fin-catch/shared";
import { db } from "./database";
import { withSyncTracking, trackDelete } from "./indexedDbHelpers";

export class IndexedDBCouponPaymentAdapter implements ICouponPaymentService {
  async createCouponPayment(payment: BondCouponPayment): Promise<string> {
    const newPayment = withSyncTracking(payment);
    await db.couponPayments.add(newPayment);
    return newPayment.id!;
  }

  async listCouponPayments(entryId: string): Promise<BondCouponPayment[]> {
    return db.couponPayments
      .where("entryId")
      .equals(entryId)
      .sortBy("paymentDate");
  }

  async updateCouponPayment(payment: BondCouponPayment): Promise<void> {
    const existing = await db.couponPayments.get(payment.id);
    if (!existing) {
      throw new Error(`Coupon payment not found: ${payment.id}`);
    }
    await db.couponPayments.put(withSyncTracking(payment, existing));
  }

  async deleteCouponPayment(id: string): Promise<void> {
    await db.transaction(
      "rw",
      [db.couponPayments, db._pendingChanges],
      async () => {
        const payment = await db.couponPayments.get(id);
        if (payment) {
          await trackDelete("couponPayments", id, payment.syncVersion || 0);
        }
        await db.couponPayments.delete(id);
      },
    );
  }
}
