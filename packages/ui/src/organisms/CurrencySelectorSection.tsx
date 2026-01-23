import React from "react";
import { CURRENCY_SYMBOLS, CurrencyCode } from "@repo/shared";

export interface CurrencySelectorSectionProps {
  selectedCurrency: CurrencyCode;
  onSelectCurrency: (currency: CurrencyCode) => void;
  currencies?: CurrencyCode[];
}

export const CurrencySelectorSection: React.FC<
  CurrencySelectorSectionProps
> = ({
  selectedCurrency,
  onSelectCurrency,
  currencies = ["USD", "VND", "EUR", "GBP", "JPY"],
}) => {
  return (
    <div>
      <h3
        style={{
          fontSize: "var(--text-sm)",
          fontWeight: "var(--font-medium)",
          color: "var(--cube-gray-900)",
          opacity: 0.7,
          marginBottom: "var(--space-2)",
        }}
      >
        Display Currency
      </h3>
      <div className="flex flex-wrap gap-2">
        {currencies.map((currency) => (
          <button
            key={currency}
            onClick={() => onSelectCurrency(currency)}
            className={`px-3 py-2 rounded-lg font-bold transition-all ${
              selectedCurrency === currency
                ? "bg-gradient-to-r from-cyan-400 to-blue-600 text-white shadow-md"
                : "glass-button"
            }`}
            style={{ fontSize: "var(--text-xs)" }}
          >
            {CURRENCY_SYMBOLS[currency]} {currency}
          </button>
        ))}
      </div>
    </div>
  );
};
