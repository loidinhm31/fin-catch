import { useState } from "react";
import { CurrencyCode } from "@repo/shared";
import { getPreference, setPreference } from "@repo/ui/utils";

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
