import React from "react";
import { Input, Label } from "../atoms";

export interface StockEntryFormProps {
  symbol: string;
  setSymbol: (value: string) => void;
  quantity: string;
  setQuantity: (value: string) => void;
  purchasePrice: string;
  setPurchasePrice: (value: string) => void;
  isSubmitting: boolean;
}

export const StockEntryForm: React.FC<StockEntryFormProps> = ({
  symbol,
  setSymbol,
  quantity,
  setQuantity,
  purchasePrice,
  setPurchasePrice,
  isSubmitting,
}) => {
  return (
    <>
      <div>
        <Label required>Symbol</Label>
        <Input
          type="text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          placeholder="e.g., AAPL, MSFT"
          disabled={isSubmitting}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label required>Quantity</Label>
          <Input
            type="number"
            step="0.01"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Number of shares"
            disabled={isSubmitting}
          />
        </div>
        <div>
          <Label required>Purchase Price per Share</Label>
          <Input
            type="number"
            step="0.01"
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(e.target.value)}
            placeholder="0.00"
            disabled={isSubmitting}
          />
        </div>
      </div>
    </>
  );
};
