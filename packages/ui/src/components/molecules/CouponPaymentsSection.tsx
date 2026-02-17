import React, { useState } from "react";
import { Edit, Plus, Trash2 } from "lucide-react";
import { BondCouponPayment, CurrencyCode } from "@fin-catch/shared";
import { useCouponPayments } from "@fin-catch/ui/hooks";
import { AddEditCouponModal } from "@fin-catch/ui/components/organisms";
import { convertCurrency } from "@fin-catch/ui/utils";

export interface CouponPaymentsSectionProps {
  entryId: string;
  entryCurrency: CurrencyCode;
  displayCurrency: CurrencyCode;
  formatCurrency: (value: number, currency?: CurrencyCode) => string;
  formatDate: (timestamp: number) => string;
  onPaymentsChange?: () => void; // Callback to trigger portfolio performance refresh
}

export const CouponPaymentsSection: React.FC<CouponPaymentsSectionProps> = ({
  entryId,
  entryCurrency,
  displayCurrency,
  formatCurrency,
  formatDate,
  onPaymentsChange,
}) => {
  const {
    payments,
    isLoading,
    error,
    createPayment,
    updatePayment,
    deletePayment,
  } = useCouponPayments(entryId);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] =
    useState<BondCouponPayment | null>(null);
  const [totalInDisplayCurrency, setTotalInDisplayCurrency] =
    useState<number>(0);

  // Calculate total coupon income in display currency
  React.useEffect(() => {
    const calculateTotal = async () => {
      let total = 0;
      for (const payment of payments) {
        const converted = await convertCurrency(
          payment.amount,
          payment.currency,
          displayCurrency,
        );
        total += converted;
      }
      setTotalInDisplayCurrency(total);
    };
    calculateTotal();
  }, [payments, displayCurrency]);

  const handleAddCoupon = () => {
    setEditingPayment(null);
    setIsModalOpen(true);
  };

  const handleEditPayment = (payment: BondCouponPayment) => {
    setEditingPayment(payment);
    setIsModalOpen(true);
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (
      !window.confirm("Are you sure you want to delete this coupon payment?")
    ) {
      return;
    }

    try {
      await deletePayment(paymentId);
      onPaymentsChange?.(); // Trigger performance refresh
    } catch (err) {
      console.error("Failed to delete coupon payment:", err);
    }
  };

  const handleSavePayment = async (payment: BondCouponPayment) => {
    if (editingPayment) {
      await updatePayment(payment);
    } else {
      await createPayment(payment);
    }
    onPaymentsChange?.(); // Trigger performance refresh
  };

  if (error) {
    return (
      <div style={{ marginTop: "var(--space-3)" }}>
        <p
          style={{ fontSize: "var(--text-sm)", color: "var(--color-red-500)" }}
        >
          Error loading coupon payments: {error}
        </p>
      </div>
    );
  }

  return (
    <>
      <div
        style={{
          marginTop: "var(--space-4)",
          paddingTop: "var(--space-4)",
          borderTop: "1px solid var(--color-black-10)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "var(--space-3)",
          }}
        >
          <h4
            style={{
              fontSize: "var(--text-sm)",
              fontWeight: "var(--font-semibold)",
              color: "var(--cube-gray-900)",
            }}
          >
            Coupon Payments
          </h4>
          <button
            onClick={handleAddCoupon}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-1)",
              padding: "var(--space-1) var(--space-2)",
              fontSize: "var(--text-xs)",
              fontWeight: "var(--font-medium)",
              color: "#ffffff",
              background: "var(--color-violet-500)",
              boxShadow: "var(--shadow-glow-violet)",
              border: "none",
              borderRadius: "var(--radius-md)",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "var(--shadow-md)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <Plus className="w-3 h-3" />
            ADD COUPON
          </button>
        </div>

        {isLoading ? (
          <p
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--cube-gray-500)",
            }}
          >
            Loading payments...
          </p>
        ) : payments.length === 0 ? (
          <p
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--cube-gray-500)",
              fontStyle: "italic",
            }}
          >
            No coupon payments recorded yet
          </p>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-2)",
            }}
          >
            {payments.map((payment) => (
              <div
                key={payment.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "var(--space-2)",
                  backgroundColor: "var(--color-bg-secondary)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-border-primary)",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      gap: "var(--space-2)",
                      alignItems: "center",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "var(--text-sm)",
                        fontWeight: "var(--font-medium)",
                        color: "var(--cube-gray-900)",
                      }}
                    >
                      {formatDate(payment.paymentDate)}
                    </p>
                    <p
                      style={{
                        fontSize: "var(--text-sm)",
                        fontWeight: "var(--font-semibold)",
                        color: "var(--color-green-500)",
                      }}
                    >
                      {formatCurrency(payment.amount, payment.currency)}
                    </p>
                  </div>
                  {payment.notes && (
                    <p
                      style={{
                        fontSize: "var(--text-xs)",
                        color: "var(--cube-gray-500)",
                        marginTop: "var(--space-1)",
                      }}
                    >
                      {payment.notes}
                    </p>
                  )}
                </div>
                <div style={{ display: "flex", gap: "var(--space-1)" }}>
                  <button
                    onClick={() => handleEditPayment(payment)}
                    className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center hover:bg-blue-200 transition-all"
                    style={{ border: "none", cursor: "pointer" }}
                  >
                    <Edit
                      className="w-3 h-3"
                      style={{ color: "var(--color-action-edit-icon)" }}
                    />
                  </button>
                  <button
                    onClick={() => handleDeletePayment(payment.id!)}
                    className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center hover:bg-red-200 transition-all"
                    style={{ border: "none", cursor: "pointer" }}
                  >
                    <Trash2
                      className="w-3 h-3"
                      style={{ color: "var(--color-action-delete-icon)" }}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {payments.length > 0 && (
          <div
            style={{
              marginTop: "var(--space-3)",
              paddingTop: "var(--space-3)",
              borderTop: "1px solid var(--color-border-primary)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <p
              style={{
                fontSize: "var(--text-sm)",
                fontWeight: "var(--font-medium)",
                color: "var(--cube-gray-900)",
              }}
            >
              Total Coupon Income
            </p>
            <p
              style={{
                fontSize: "var(--text-base)",
                fontWeight: "var(--font-bold)",
                color: "var(--color-green-500)",
              }}
            >
              {formatCurrency(totalInDisplayCurrency, displayCurrency)}
            </p>
          </div>
        )}
      </div>

      <AddEditCouponModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSavePayment}
        entryId={entryId}
        defaultCurrency={entryCurrency}
        editingPayment={editingPayment}
      />
    </>
  );
};
