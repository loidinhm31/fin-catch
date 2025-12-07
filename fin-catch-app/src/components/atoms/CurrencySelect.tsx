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
  const currencies: CurrencyCode[] = ["USD", "VND", "EUR", "GBP", "JPY", "CNY", "KRW", "THB", "SGD"];

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value as CurrencyCode);
  };

  return (
    <div className={`currency-select-wrapper ${className}`}>
      {label && <label htmlFor={id}>{label}</label>}
      <select id={id} value={value} onChange={handleChange} disabled={disabled}>
        {currencies.map((currency) => (
          <option key={currency} value={currency}>
            {CURRENCY_SYMBOLS[currency]} {currency} - {CURRENCY_LABELS[currency]}
          </option>
        ))}
      </select>

      <style>{`
        .currency-select-wrapper {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .currency-select-wrapper label {
          font-size: 14px;
          font-weight: 500;
          color: #555;
        }

        .currency-select-wrapper select {
          padding: 8px 12px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 14px;
          background: white;
          color: #111827;
          cursor: pointer;
        }

        .currency-select-wrapper select:focus {
          outline: none;
          border-color: #007bff;
        }

        .currency-select-wrapper select:disabled {
          background: #f5f5f5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};
