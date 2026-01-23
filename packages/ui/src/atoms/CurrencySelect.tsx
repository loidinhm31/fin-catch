import * as React from "react";
import type { CurrencyCode } from "../types";
import { CURRENCY_LABELS, CURRENCY_SYMBOLS } from "../types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./Select";

interface CurrencySelectProps {
  /**
   * Selected currency code
   */
  value: CurrencyCode;
  /**
   * Callback when currency is changed
   */
  onChange: (currency: CurrencyCode) => void;
  /**
   * Optional label for the select
   */
  label?: string;
  /**
   * Optional CSS class name
   */
  className?: string;
  /**
   * Whether the select is disabled
   */
  disabled?: boolean;
  /**
   * ID for the select element
   */
  id?: string;
}

export const CurrencySelect: React.FC<CurrencySelectProps> = ({
  value,
  onChange,
  label,
  className = "",
  disabled = false,
  id = "currency-select",
}) => {
  const currencies: CurrencyCode[] = [
    "USD",
    "VND",
    "EUR",
    "GBP",
    "JPY",
    "CNY",
    "KRW",
    "THB",
    "SGD",
  ];

  const handleChange = (newValue: string) => {
    onChange(newValue as CurrencyCode);
  };

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={id}
          style={{
            display: "block",
            fontSize: "var(--text-sm)",
            fontWeight: "var(--font-bold)",
            marginBottom: "var(--space-2)",
            color: "var(--color-text-primary)",
          }}
        >
          {label}
        </label>
      )}
      <Select
        value={value}
        onValueChange={handleChange}
        disabled={disabled}
        name={id}
      >
        <SelectTrigger id={id}>
          <SelectValue placeholder="Select currency" />
        </SelectTrigger>
        <SelectContent>
          {currencies.map((currency) => (
            <SelectItem key={currency} value={currency}>
              {CURRENCY_SYMBOLS[currency]} {currency} -{" "}
              {CURRENCY_LABELS[currency]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
