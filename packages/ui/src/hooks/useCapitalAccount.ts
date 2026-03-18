import { useCallback, useEffect, useState } from "react";
import type { CapitalSummary, CapitalTransaction, CurrencyCode } from "@fin-catch/shared";
import {
  createCapitalTransaction,
  listCapitalTransactions,
} from "@fin-catch/ui/services";
import { convertCurrency } from "../utils/currency";

const computeSummary = (
  txs: CapitalTransaction[],
  baseCurrency: CurrencyCode,
): CapitalSummary => {
  let totalPayIn = 0;
  let totalWithdraw = 0;
  let totalBuyDeduction = 0;
  let totalSellCredit = 0;

  for (const tx of txs) {
    switch (tx.type) {
      case "pay-in":
        totalPayIn += tx.baseCurrencyAmount;
        break;
      case "withdraw":
        totalWithdraw += tx.baseCurrencyAmount;
        break;
      case "buy-deduction":
        totalBuyDeduction += tx.baseCurrencyAmount;
        break;
      case "sell-credit":
        totalSellCredit += tx.baseCurrencyAmount;
        break;
    }
  }

  return {
    baseCurrency,
    totalPayIn,
    totalWithdraw,
    totalBuyDeduction,
    totalSellCredit,
    availableCapital: totalPayIn - totalWithdraw - totalBuyDeduction + totalSellCredit,
    totalInvested: totalBuyDeduction - totalSellCredit,
    netCapitalFlow: totalPayIn - totalWithdraw,
  };
};

export const useCapitalAccount = (baseCurrency: CurrencyCode) => {
  const [transactions, setTransactions] = useState<CapitalTransaction[]>([]);
  const [summary, setSummary] = useState<CapitalSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const txs = await listCapitalTransactions();
      setTransactions(txs);
      setSummary(computeSummary(txs, baseCurrency));
    } catch (err) {
      console.error("Failed to load capital transactions:", err);
    } finally {
      setIsLoading(false);
    }
  }, [baseCurrency]);

  const payIn = useCallback(
    async (amount: number, currency: CurrencyCode, date?: number, notes?: string) => {
      const now = Math.floor(Date.now() / 1000);
      const baseCurrencyAmount = await convertCurrency(amount, currency, baseCurrency);
      const tx: CapitalTransaction = {
        id: crypto.randomUUID(),
        type: "pay-in",
        amount,
        currency,
        baseCurrencyAmount,
        notes,
        date: date ?? now,
        createdAt: now,
        syncVersion: 0,
      };
      await createCapitalTransaction(tx);
      await load();
    },
    [baseCurrency, load],
  );

  const withdraw = useCallback(
    async (amount: number, currency: CurrencyCode, date?: number, notes?: string) => {
      const now = Math.floor(Date.now() / 1000);
      const baseCurrencyAmount = await convertCurrency(amount, currency, baseCurrency);
      const tx: CapitalTransaction = {
        id: crypto.randomUUID(),
        type: "withdraw",
        amount,
        currency,
        baseCurrencyAmount,
        notes,
        date: date ?? now,
        createdAt: now,
        syncVersion: 0,
      };
      await createCapitalTransaction(tx);
      await load();
    },
    [baseCurrency, load],
  );

  useEffect(() => {
    load();
  }, [baseCurrency]);

  return {
    summary,
    transactions,
    isLoading,
    payIn,
    withdraw,
    refresh: load,
  };
};
