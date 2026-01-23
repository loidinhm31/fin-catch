import type { ICouponPaymentService } from "@fin-catch/shared/services";
import type { BondCouponPayment } from "@fin-catch/shared/types";
import { db, generateId, getCurrentTimestamp } from "./database";

/**
 * IndexedDB implementation of Coupon Payment Service using Dexie
 */
export class IndexedDBCouponPaymentAdapter implements ICouponPaymentService {
  async createCouponPayment(payment: BondCouponPayment): Promise<string> {
    const id = payment.id || generateId();
    const now = getCurrentTimestamp();

    const newPayment: BondCouponPayment = {
      ...payment,
      id,
      created_at: payment.created_at || now,
      sync_version: payment.sync_version || 0,
    };

    await db.couponPayments.add(newPayment);
    return id;
  }

  async listCouponPayments(entryId: string): Promise<BondCouponPayment[]> {
    return db.couponPayments
      .where("entry_id")
      .equals(entryId)
      .sortBy("payment_date");
  }

  async updateCouponPayment(payment: BondCouponPayment): Promise<void> {
    const existing = await db.couponPayments.get(payment.id);
    if (!existing) {
      throw new Error(`Coupon payment not found: ${payment.id}`);
    }

    await db.couponPayments.put(payment);
  }

  async deleteCouponPayment(id: string): Promise<void> {
    await db.couponPayments.delete(id);
  }
}
