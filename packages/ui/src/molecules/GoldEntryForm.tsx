import React from "react";
import { CurrencyCode, getUnitLabel } from "@fin-catch/shared";
import { formatCurrency } from "../utils/currency";
import { Input, Label, SimpleSelect as Select } from "../atoms";

export interface GoldEntryFormProps {
  goldType: string;
  setGoldType: (value: string) => void;
  goldUnit: "gram" | "mace" | "tael" | "ounce" | "kg";
  setGoldUnit: (value: "gram" | "mace" | "tael" | "ounce" | "kg") => void;
  quantity: string;
  setQuantity: (value: string) => void;
  purchasePrice: string;
  setPurchasePrice: (value: string) => void;
  source: string;
  setSource: (value: string) => void;
  currency: CurrencyCode;
  isSubmitting: boolean;
  handleGoldTypeChange: (newGoldType: string) => void;
  handleSourceChange: (newSource: string) => void;
}

export const GoldEntryForm: React.FC<GoldEntryFormProps> = ({
  goldType,
  goldUnit,
  setGoldUnit,
  quantity,
  setQuantity,
  purchasePrice,
  setPurchasePrice,
  source,
  currency,
  isSubmitting,
  handleGoldTypeChange,
  handleSourceChange,
}) => {
  const totalCost =
    quantity && purchasePrice
      ? parseFloat(purchasePrice) * parseFloat(quantity)
      : 0;

  return (
    <>
      <div>
        <Label required>Gold Price ID</Label>
        <Select
          value={goldType}
          onValueChange={handleGoldTypeChange}
          placeholder="Select gold price ID"
          options={[
            {
              value: "1",
              label: "SJC 1L, 10L, 1KG - Ho Chi Minh (tael/lượng)",
            },
            { value: "2", label: "SJC 1L, 10L, 1KG - Ha Noi (tael/lượng)" },
            {
              value: "49",
              label: "SJC Nhẫn 99.99% (1 chỉ, 2 chỉ, 5 chỉ) (mace/chỉ)",
            },
          ]}
        />
        <p
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--cube-gray-500)",
            marginTop: "var(--space-1)",
          }}
        >
          Select the gold price source to track
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label required>Unit</Label>
          <Select
            value={goldUnit}
            onValueChange={(value) => setGoldUnit(value as any)}
            options={[
              { value: "mace", label: "Mace/Chỉ (3.75g) - Default for VN" },
              { value: "tael", label: "Tael/Lượng (37.5g)" },
              { value: "gram", label: "Gram (g)" },
              { value: "ounce", label: "Troy Ounce (31.1g)" },
              { value: "kg", label: "Kilogram (kg)" },
            ]}
          />
          <p
            style={{
              fontSize: "var(--text-xs)",
              color: "#6366f1",
              marginTop: "var(--space-1)",
            }}
          >
            💡 You can enter in any unit - prices will be auto-converted for
            comparison
          </p>
          <p
            style={{
              fontSize: "var(--text-xs)",
              color: "#10b981",
              marginTop: "var(--space-1)",
            }}
          >
            ℹ️ {source ? source.toUpperCase() : "API"} returns prices per tael,
            conversion handled automatically
          </p>
        </div>
        <div>
          <Label required>Quantity</Label>
          <Input
            type="number"
            step="0.01"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder={`Number of ${goldUnit}s`}
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div>
        <Label required>Purchase Price per {getUnitLabel(goldUnit)}</Label>
        <Input
          type="number"
          step="0.01"
          value={purchasePrice}
          onChange={(e) => setPurchasePrice(e.target.value)}
          placeholder="Price per unit"
          disabled={isSubmitting}
        />
        {totalCost > 0 && (
          <p
            style={{
              fontSize: "var(--text-xs)",
              color: "var(--cube-gray-600)",
              marginTop: "var(--space-1)",
            }}
          >
            Total: {formatCurrency(totalCost, currency)}
          </p>
        )}
        <p
          style={{
            fontSize: "var(--text-xs)",
            color: "#10b981",
            marginTop: "var(--space-1)",
          }}
        >
          ✓ Enter your purchase price in your preferred unit - system handles
          conversion
        </p>
      </div>

      <div>
        <Label required>Source</Label>
        <Select
          value={source}
          onValueChange={handleSourceChange}
          placeholder="Select source"
          options={[{ value: "sjc", label: "SJC Gold" }]}
        />
        <p
          style={{
            fontSize: "var(--text-xs)",
            color: "#2563eb",
            marginTop: "var(--space-1)",
          }}
        >
          💡 Source determines which API to use for current prices
        </p>
      </div>
    </>
  );
};
