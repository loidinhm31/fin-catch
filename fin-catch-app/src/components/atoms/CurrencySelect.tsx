import type { CurrencyCode } from "../../types";
import { CURRENCY_LABELS, CURRENCY_SYMBOLS } from "../../types";

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

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value as CurrencyCode);
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
      <div style={{ position: "relative" }}>
        <select
          id={id}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className="glass-input w-full"
          style={{
            color: "var(--color-text-primary) !important",
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.6 : 1,
            appearance: "none",
            paddingRight: "2.5rem",
          }}
        >
          {currencies.map((currency) => (
            <option key={currency} value={currency}>
              {CURRENCY_SYMBOLS[currency]} {currency} -{" "}
              {CURRENCY_LABELS[currency]}
            </option>
          ))}
        </select>
        <div
          style={{
            pointerEvents: "none",
            position: "absolute",
            top: "50%",
            right: "0.75rem",
            transform: "translateY(-50%)",
            color: "var(--color-text-primary)",
          }}
        >
          <svg
            style={{ fill: "currentColor", height: "1rem", width: "1rem" }}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
          >
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
      </div>
    </div>
  );
};
