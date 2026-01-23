import React from "react";
import { Bell } from "lucide-react";
import {
  Input,
  Label,
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../atoms";

export interface StockEntryFormProps {
  symbol: string;
  setSymbol: (value: string) => void;
  quantity: string;
  setQuantity: (value: string) => void;
  purchasePrice: string;
  setPurchasePrice: (value: string) => void;
  isSubmitting: boolean;
  // Alert fields
  targetPrice?: string;
  setTargetPrice?: (value: string) => void;
  stopLoss?: string;
  setStopLoss?: (value: string) => void;
  alertEnabled?: boolean;
  setAlertEnabled?: (value: boolean) => void;
}

export const StockEntryForm: React.FC<StockEntryFormProps> = ({
  symbol,
  setSymbol,
  quantity,
  setQuantity,
  purchasePrice,
  setPurchasePrice,
  isSubmitting,
  targetPrice = "",
  setTargetPrice,
  stopLoss = "",
  setStopLoss,
  alertEnabled = true,
  setAlertEnabled,
}) => {
  const hasAlertInputs = setTargetPrice && setStopLoss && setAlertEnabled;

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

      {/* Price Alerts Section */}
      {hasAlertInputs && (
        <Accordion
          type="single"
          collapsible
          defaultValue={targetPrice || stopLoss ? "price-alerts" : undefined}
        >
          <AccordionItem value="price-alerts">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <Bell
                  className="w-4 h-4"
                  style={{ color: "var(--cube-gray-600)" }}
                />
                <span
                  style={{
                    fontSize: "var(--text-sm)",
                    fontWeight: "var(--font-medium)",
                    color: "var(--cube-gray-700)",
                  }}
                >
                  Price Alerts
                </span>
                {(targetPrice || stopLoss) && (
                  <span
                    className="px-2 py-0.5 rounded-full text-xs"
                    style={{
                      backgroundColor: alertEnabled ? "#d1fae5" : "#f3f4f6",
                      color: alertEnabled ? "#065f46" : "#6b7280",
                    }}
                  >
                    {alertEnabled ? "Active" : "Disabled"}
                  </span>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>
                    <span className="flex items-center gap-1">
                      🎯 Target Price
                    </span>
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    placeholder="Take profit price"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label>
                    <span className="flex items-center gap-1">
                      🛑 Stop Loss
                    </span>
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(e.target.value)}
                    placeholder="Stop loss price"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {(targetPrice || stopLoss) && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="alertEnabled"
                    checked={alertEnabled}
                    onChange={(e) => setAlertEnabled(e.target.checked)}
                    disabled={isSubmitting}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <label
                    htmlFor="alertEnabled"
                    style={{
                      fontSize: "var(--text-sm)",
                      color: "var(--cube-gray-700)",
                    }}
                  >
                    Enable price alerts
                  </label>
                </div>
              )}

              <p
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--cube-gray-500)",
                }}
              >
                You'll receive notifications when the price crosses these
                thresholds.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </>
  );
};
