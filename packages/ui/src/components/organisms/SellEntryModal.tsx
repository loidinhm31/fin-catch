import React, { useEffect, useState } from "react";
import { CurrencyCode, PortfolioEntry } from "@fin-catch/shared";
import {
  Button,
  DatePicker,
  ErrorAlert,
  Input,
  Label,
  Modal,
  Textarea,
} from "@fin-catch/ui/components/atoms";
import { useSellTransactions } from "@fin-catch/ui/hooks";

export interface SellEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  entry: PortfolioEntry | null;
  baseCurrency: CurrencyCode;
}

export const SellEntryModal: React.FC<SellEntryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  entry,
  baseCurrency,
}) => {
  const [quantity, setQuantity] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [sellDate, setSellDate] = useState<Date | undefined>(new Date());
  const [fees, setFees] = useState("0");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { recordSell } = useSellTransactions(
    entry?.id ?? null,
    entry,
    baseCurrency,
  );

  // Live P&L preview
  const qty = parseFloat(quantity) || 0;
  const price = parseFloat(sellPrice) || 0;
  const fee = parseFloat(fees) || 0;
  const costBasis = entry?.purchasePrice ?? 0;
  const previewPnl =
    qty > 0 && price > 0
      ? price * qty - costBasis * qty - fee
      : null;

  const resetForm = () => {
    setQuantity("");
    setSellPrice("");
    setSellDate(new Date());
    setFees("0");
    setNotes("");
    setError(null);
  };

  useEffect(() => {
    if (isOpen) resetForm();
  }, [isOpen, entry?.id]);

  const handleSubmit = async () => {
    setError(null);

    if (!entry) return;
    const qtyVal = parseFloat(quantity);
    const priceVal = parseFloat(sellPrice);
    const feesVal = parseFloat(fees) || 0;

    if (!qtyVal || qtyVal <= 0) {
      setError("Quantity must be greater than 0");
      return;
    }
    // Stock and bond lots must be whole units
    if (
      (entry.assetType === "stock" || entry.assetType === "bond") &&
      !Number.isInteger(qtyVal)
    ) {
      setError("Quantity must be a whole number for stock/bond");
      return;
    }
    if (qtyVal > entry.quantity) {
      setError(`Cannot sell ${qtyVal} — only ${entry.quantity} available`);
      return;
    }
    if (!priceVal || priceVal <= 0) {
      setError("Sell price must be greater than 0");
      return;
    }
    if (!sellDate) {
      setError("Sell date is required");
      return;
    }

    setIsSubmitting(true);
    try {
      await recordSell({
        sellPrice: priceVal,
        quantity: qtyVal,
        sellDate: Math.floor(sellDate.getTime() / 1000),
        fees: feesVal,
        currency: entry.currency ?? baseCurrency,
        notes: notes.trim() || undefined,
      });
      resetForm();
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record sell");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!entry) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSubmitting ? () => {} : handleClose}
      title="Sell Position"
      size="md"
    >
      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {/* Entry summary */}
      <div
        className="mb-4 p-3 rounded-xl border text-sm"
        style={{
          background: "var(--glass-bg-input)",
          borderColor: "var(--glass-border-medium)",
        }}
      >
        <div className="flex justify-between mb-1">
          <span style={{ color: "var(--color-text-secondary)" }}>Asset</span>
          <span
            className="font-semibold"
            style={{ color: "var(--color-text-primary)" }}
          >
            {entry.symbol}
          </span>
        </div>
        <div className="flex justify-between mb-1">
          <span style={{ color: "var(--color-text-secondary)" }}>Available</span>
          <span style={{ color: "var(--color-text-primary)" }}>
            {entry.quantity}
          </span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: "var(--color-text-secondary)" }}>
            Cost Basis / Unit
          </span>
          <span style={{ color: "var(--color-text-primary)" }}>
            {entry.purchasePrice.toLocaleString()} {entry.currency}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label required>Quantity</Label>
            <Input
              type="number"
              step="any"
              min="0"
              max={entry.quantity}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={`Max: ${entry.quantity}`}
              disabled={isSubmitting}
            />
          </div>
          <div>
            <Label required>Sell Price</Label>
            <Input
              type="number"
              step="any"
              min="0"
              value={sellPrice}
              onChange={(e) => setSellPrice(e.target.value)}
              placeholder="0.00"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label required>Sell Date</Label>
            <DatePicker
              date={sellDate}
              onDateChange={setSellDate}
              placeholder="Select date"
              disabled={isSubmitting}
              error={!sellDate && !!error}
            />
          </div>
          <div>
            <Label>Fees</Label>
            <Input
              type="number"
              step="any"
              min="0"
              value={fees}
              onChange={(e) => setFees(e.target.value)}
              placeholder="0.00"
              disabled={isSubmitting}
            />
          </div>
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

        {/* Live P&L preview */}
        {previewPnl !== null && (
          <div
            className="p-3 rounded-xl border text-sm"
            style={{
              background:
                previewPnl >= 0
                  ? "var(--color-alert-success-bg)"
                  : "var(--color-alert-error-bg)",
              borderColor:
                previewPnl >= 0
                  ? "var(--color-alert-success-border)"
                  : "var(--color-alert-error-border)",
            }}
          >
            <div className="flex justify-between">
              <span style={{ color: "var(--color-text-secondary)" }}>
                Realized P&L Preview
              </span>
              <span
                className="font-bold"
                style={{
                  color:
                    previewPnl >= 0
                      ? "var(--color-green-500)"
                      : "var(--color-red-500)",
                }}
              >
                {previewPnl >= 0 ? "+" : ""}
                {previewPnl.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}{" "}
                {entry.currency}
              </span>
            </div>
            {qty > 0 && price > 0 && (
              <div className="flex justify-between mt-1">
                <span style={{ color: "var(--color-text-secondary)" }}>
                  Net proceeds
                </span>
                <span style={{ color: "var(--color-text-primary)" }}>
                  {(price * qty - fee).toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}{" "}
                  {entry.currency}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
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
            {isSubmitting ? "Recording..." : "Confirm Sell"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
