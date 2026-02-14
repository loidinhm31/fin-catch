import { BondCouponPayment } from "@fin-catch/shared";
import { getCouponPaymentService } from "@fin-catch/ui/adapters/factory";

function handleError(error: unknown): Error {
  if (typeof error === "string") {
    return new Error(error);
  }
  return error instanceof Error ? error : new Error("Unknown error occurred");
}

export async function createCouponPayment(
  payment: BondCouponPayment,
): Promise<string> {
  try {
    return await getCouponPaymentService().createCouponPayment(payment);
  } catch (error) {
    console.error("Error creating coupon payment:", error);
    throw handleError(error);
  }
}

export async function listCouponPayments(
  entryId: string,
): Promise<BondCouponPayment[]> {
  try {
    return await getCouponPaymentService().listCouponPayments(entryId);
  } catch (error) {
    console.error("Error listing coupon payments:", error);
    throw handleError(error);
  }
}

export async function updateCouponPayment(
  payment: BondCouponPayment,
): Promise<void> {
  try {
    return await getCouponPaymentService().updateCouponPayment(payment);
  } catch (error) {
    console.error("Error updating coupon payment:", error);
    throw handleError(error);
  }
}

export async function deleteCouponPayment(id: string): Promise<void> {
  try {
    return await getCouponPaymentService().deleteCouponPayment(id);
  } catch (error) {
    console.error("Error deleting coupon payment:", error);
    throw handleError(error);
  }
}
