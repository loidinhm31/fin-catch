import { BondCouponPayment } from "@fin-catch/shared/types";

/**
 * Coupon payment service interface
 * Implemented by TauriCouponPaymentAdapter (SQLite) and WebCouponPaymentAdapter (IndexedDB)
 */
export interface ICouponPaymentService {
  createCouponPayment(payment: BondCouponPayment): Promise<string>;
  listCouponPayments(entryId: string): Promise<BondCouponPayment[]>;
  updateCouponPayment(payment: BondCouponPayment): Promise<void>;
  deleteCouponPayment(id: string): Promise<void>;
}
