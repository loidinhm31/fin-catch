import React, { useEffect, useState } from "react";
import {
  BondCouponPayment,
  CurrencyCode,
  dateToUnixTimestamp,
} from "@repo/shared";
import {
  Button,
  CurrencySelect,
  DatePicker,
  ErrorAlert,
  Input,
  Label,
  Modal,
  Textarea,
} from "../atoms";

export interface AddEditCouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payment: BondCouponPayment) => Promise<void>;
  entryId: string;
  defaultCurrency: CurrencyCode;
  editingPayment?: BondCouponPayment | null;
}

export const AddEditCouponModal: React.FC<AddEditCouponModalProps> = ({
  isOpen,
  onClose,
  onSave,
  entryId,
  defaultCurrency,
  editingPayment,
}) => {
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(undefined);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<CurrencyCode>(defaultCurrency);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with editing payment data
  useEffect(() => {
    if (editingPayment) {
      setPaymentDate(
        editingPayment.payment_date
          ? new Date(editingPayment.payment_date * 1000)
          : undefined,
      );
      setAmount(editingPayment.amount?.toString() || "");
      setCurrency(editingPayment.currency || defaultCurrency);
      setNotes(editingPayment.notes || "");
    } else {
      resetForm();
    }
  }, [editingPayment, isOpen, defaultCurrency]);

  const resetForm = () => {
    setPaymentDate(undefined);
    setAmount("");
    setCurrency(defaultCurrency);
    setNotes("");
    setError(null);
  };

  const handleSubmit = async () => {
    setError(null);

    // Validation
    if (!paymentDate) {
      setError("Payment date is required");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError("Amount must be greater than 0");
      return;
    }

    // Warn if payment date is in the future (but don't block)
    const paymentTimestamp = paymentDate ? dateToUnixTimestamp(paymentDate) : 0;
    const now = Math.floor(Date.now() / 1000);
    if (paymentTimestamp > now) {
      console.warn("Payment date is in the future");
    }

    setIsSubmitting(true);
    try {
      const paymentData: BondCouponPayment = {
        id: editingPayment?.id || "", // Backend will generate UUID for new payments
        entry_id: entryId,
        payment_date: paymentTimestamp,
        amount: parseFloat(amount),
        currency,
        notes: notes.trim() || undefined,
        created_at: editingPayment?.created_at || Math.floor(Date.now() / 1000),
        sync_version: editingPayment?.sync_version || 1,
        synced_at: editingPayment?.synced_at,
      };

      await onSave(paymentData);
      resetForm();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save coupon payment",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={editingPayment ? "Edit Coupon Payment" : "Add Coupon Payment"}
      size="md"
    >
      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}
      <div className="space-y-4">
        <div>
          <Label required>Payment Date</Label>
          <DatePicker
            date={paymentDate}
            onDateChange={setPaymentDate}
            placeholder="Select payment date"
            disabled={isSubmitting}
            error={!paymentDate && !!error}
          />
        </div>

        <div>
          <Label required>Amount Received</Label>
          <Input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <CurrencySelect
            label="Currency"
            value={currency}
            onChange={setCurrency}
            id="coupon-currency"
          />
          <p
            style={{
              fontSize: "var(--text-xs)",
              color: "var(--cube-gray-500)",
              marginTop: "var(--space-1)",
            }}
          >
            Defaults to bond currency
          </p>
        </div>

        <div>
          <Label>Notes</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes about this payment"
            rows={3}
            disabled={isSubmitting}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : editingPayment ? "Update" : "Add"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
