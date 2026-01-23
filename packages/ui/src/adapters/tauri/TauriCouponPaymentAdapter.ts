import { invoke } from "@tauri-apps/api/core";
import type { BondCouponPayment } from "../../types";
import type { ICouponPaymentService } from "../interfaces";

/**
 * Tauri adapter for coupon payment operations
 * Wraps invoke() calls to Rust backend
 */
export class TauriCouponPaymentAdapter implements ICouponPaymentService {
  async createCouponPayment(payment: BondCouponPayment): Promise<string> {
    console.log("[Tauri IPC] create_coupon_payment", payment);
    const id = await invoke<string>("create_coupon_payment", { payment });
    console.log("[Tauri IPC Response]", id);
    return id;
  }

  async listCouponPayments(entryId: string): Promise<BondCouponPayment[]> {
    console.log("[Tauri IPC] list_coupon_payments", entryId);
    const payments = await invoke<BondCouponPayment[]>("list_coupon_payments", {
      entryId,
    });
    console.log("[Tauri IPC Response]", payments);
    return payments;
  }

  async updateCouponPayment(payment: BondCouponPayment): Promise<void> {
    console.log("[Tauri IPC] update_coupon_payment", payment);
    await invoke<void>("update_coupon_payment", { payment });
    console.log("[Tauri IPC Response] Coupon payment updated");
  }

  async deleteCouponPayment(id: string): Promise<void> {
    console.log("[Tauri IPC] delete_coupon_payment", id);
    await invoke<void>("delete_coupon_payment", { id });
    console.log("[Tauri IPC Response] Coupon payment deleted");
  }
}
