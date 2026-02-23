import { BondCouponPayment } from "@fin-catch/shared";
import { getCouponPaymentService } from "@fin-catch/ui/adapters/factory";

export async function createCouponPayment(
  payment: BondCouponPayment,
): Promise<string> {
  return getCouponPaymentService().createCouponPayment(payment);
}

export async function listCouponPayments(
  entryId: string,
): Promise<BondCouponPayment[]> {
  return getCouponPaymentService().listCouponPayments(entryId);
}

export async function updateCouponPayment(
  payment: BondCouponPayment,
): Promise<void> {
  return getCouponPaymentService().updateCouponPayment(payment);
}

export async function deleteCouponPayment(id: string): Promise<void> {
  return getCouponPaymentService().deleteCouponPayment(id);
}
