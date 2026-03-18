import React, { useEffect, useState } from "react";
import { CurrencyCode } from "@fin-catch/shared";
import {
  Button,
  CurrencySelect,
  DatePicker,
  ErrorAlert,
  Input,
  Label,
  Modal,
  Textarea,
} from "@fin-catch/ui/components/atoms";

export interface PayInWithdrawModalProps {
  type: "pay-in" | "withdraw";
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    amount: number,
    currency: CurrencyCode,
    date: number,
    notes?: string,
  ) => Promise<void>;
  availableCapital?: number;
  baseCurrency: CurrencyCode;
}

export const PayInWithdrawModal: React.FC<PayInWithdrawModalProps> = ({
  type,
  isOpen,
  onClose,
  onSubmit,
  availableCapital,
  baseCurrency,
}) => {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<CurrencyCode>(baseCurrency);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPayIn = type === "pay-in";
  const amountVal = parseFloat(amount) || 0;

  // Soft warning: withdraw > available capital
  const showOverdrawWarning =
    !isPayIn &&
    availableCapital !== undefined &&
    amountVal > 0 &&
    amountVal > availableCapital;

  const resetForm = () => {
    setAmount("");
    setCurrency(baseCurrency);
    setDate(new Date());
    setNotes("");
    setError(null);
  };

  useEffect(() => {
    if (isOpen) resetForm();
  }, [isOpen, type]);

  const handleSubmit = async () => {
    setError(null);

    if (!amountVal || amountVal <= 0) {
      setError("Amount must be greater than 0");
      return;
    }
    if (!date) {
      setError("Date is required");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(
        amountVal,
        currency,
        Math.floor(date.getTime() / 1000),
        notes.trim() || undefined,
      );
      resetForm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (isSubmitting) return;
        resetForm();
        onClose();
      }}
      title={isPayIn ? "Pay In Capital" : "Withdraw Capital"}
      size="sm"
    >
      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      <div className="space-y-4">
        <div>
          <Label required>Amount</Label>
          <Input
            type="number"
            step="any"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            disabled={isSubmitting}
          />
        </div>

        <CurrencySelect
          label="Currency"
          value={currency}
          onChange={setCurrency}
          id="capital-currency"
        />

        <div>
          <Label required>Date</Label>
          <DatePicker
            date={date}
            onDateChange={setDate}
            placeholder="Select date"
            disabled={isSubmitting}
            error={!date && !!error}
          />
        </div>

        <div>
          <Label>Notes</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes"
            rows={2}
            disabled={isSubmitting}
          />
        </div>

        {showOverdrawWarning && (
          <div
            className="p-3 rounded-xl border text-sm"
            style={{
              background: "rgba(245, 158, 11, 0.1)",
              borderColor: "rgba(245, 158, 11, 0.3)",
              color: "var(--color-amber-400)",
            }}
          >
            Warning: amount exceeds available capital (
            {availableCapital!.toLocaleString()} {baseCurrency})
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => {
              resetForm();
              onClose();
            }}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={handleSubmit}
            disabled={isSubmitting}
            style={
              isPayIn
                ? { background: "var(--color-green-500)" }
                : { background: "var(--color-red-600)" }
            }
          >
            {isSubmitting
              ? "Submitting..."
              : isPayIn
                ? "Pay In"
                : "Withdraw"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
