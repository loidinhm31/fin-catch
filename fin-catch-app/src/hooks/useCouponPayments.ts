import { useState, useEffect } from "react";
import { BondCouponPayment } from "@/types";
import { finCatchAPI } from "@/services/api";

export const useCouponPayments = (entryId: string | null) => {
  const [payments, setPayments] = useState<BondCouponPayment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPayments = async () => {
    if (!entryId) {
      setPayments([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await finCatchAPI.listCouponPayments(entryId);
      setPayments(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load coupon payments";
      setError(errorMessage);
      console.error("Error loading coupon payments:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const createPayment = async (payment: BondCouponPayment): Promise<void> => {
    if (!entryId) {
      throw new Error("No entry ID provided");
    }

    setError(null);
    try {
      await finCatchAPI.createCouponPayment(payment);
      await loadPayments(); // Reload to get updated list
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create coupon payment";
      setError(errorMessage);
      throw err;
    }
  };

  const updatePayment = async (payment: BondCouponPayment): Promise<void> => {
    setError(null);
    try {
      await finCatchAPI.updateCouponPayment(payment);
      await loadPayments(); // Reload to get updated list
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update coupon payment";
      setError(errorMessage);
      throw err;
    }
  };

  const deletePayment = async (paymentId: string): Promise<void> => {
    setError(null);
    try {
      await finCatchAPI.deleteCouponPayment(paymentId);
      await loadPayments(); // Reload to get updated list
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete coupon payment";
      setError(errorMessage);
      throw err;
    }
  };

  useEffect(() => {
    loadPayments();
  }, [entryId]);

  return {
    payments,
    isLoading,
    error,
    loadPayments,
    createPayment,
    updatePayment,
    deletePayment,
  };
};
