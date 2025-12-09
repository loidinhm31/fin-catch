import { useState } from "react";
import { CurrencyCode } from "../types";
import { getPreference, setPreference } from "../utils/preferences";

export const useCurrencyPreference = () => {
  const [displayCurrency, setDisplayCurrency] = useState<CurrencyCode>(
    () => getPreference("displayCurrency") || "USD"
  );

  const handleCurrencyChange = (currency: CurrencyCode) => {
    setDisplayCurrency(currency);
    setPreference("displayCurrency", currency);
  };

  return {
    displayCurrency,
    setDisplayCurrency: handleCurrencyChange,
  };
};
