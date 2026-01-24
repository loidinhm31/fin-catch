import { useState } from "react";
import { CurrencyCode } from "@fin-catch/shared";
import { getPreference, setPreference } from "@fin-catch/ui/utils";

export const useCurrencyPreference = () => {
  const [displayCurrency, setDisplayCurrency] = useState<CurrencyCode>(
    () => getPreference("displayCurrency") || "USD",
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
