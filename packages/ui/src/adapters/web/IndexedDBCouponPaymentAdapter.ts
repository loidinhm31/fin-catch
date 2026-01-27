import type { ICouponPaymentService } from "@fin-catch/shared/services";
import type { BondCouponPayment } from "@fin-catch/shared/types";
import { db, generateId, getCurrentTimestamp } from "./database";

/**
 * IndexedDB implementation of Coupon Payment Service using Dexie
 *
 * Sync tracking:
 * - Creates/updates: synced_at is cleared (undefined) and sync_version incremented
 * - Deletes: Tracked in _pendingChanges before hard delete
 * - The sync adapter queries records where synced_at is undefined
 */
export class IndexedDBCouponPaymentAdapter implements ICouponPaymentService {
  async createCouponPayment(payment: BondCouponPayment): Promise<string> {
    const id = payment.id || generateId();
    const now = getCurrentTimestamp();

    const newPayment: BondCouponPayment = {
      ...payment,
      id,
      created_at: payment.created_at || now,
      sync_version: 1,
      synced_at: undefined, // Mark as pending sync
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

    // Mark as pending sync by clearing synced_at and incrementing version
    const updatedPayment: BondCouponPayment = {
      ...payment,
      sync_version: (existing.sync_version || 0) + 1,
      synced_at: undefined, // Mark as pending sync
    };

    await db.couponPayments.put(updatedPayment);
  }

  async deleteCouponPayment(id: string): Promise<void> {
    await db.transaction(
      "rw",
      [db.couponPayments, db._pendingChanges],
      async () => {
        // Get the payment before deleting (for sync version)
        const payment = await db.couponPayments.get(id);

        // Track deletion for sync
        if (payment) {
          await db._pendingChanges.add({
            tableName: "couponPayments",
            rowId: id,
            operation: "delete",
            data: {},
            version: (payment.sync_version || 0) + 1,
            createdAt: getCurrentTimestamp(),
          });
        }

        // Delete the payment
        await db.couponPayments.delete(id);
      },
    );
  }
}
