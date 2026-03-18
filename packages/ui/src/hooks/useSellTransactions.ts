import { useCallback, useEffect, useState } from "react";
import type {
  CapitalTransaction,
  CurrencyCode,
  PortfolioEntry,
  SellTransaction,
} from "@fin-catch/shared";
import {
  createCapitalTransaction,
  createSellTransaction,
  listSellTransactionsByEntry,
  updateEntry as updateEntryService,
} from "@fin-catch/ui/services";
import { getDb } from "../adapters/web/database";
import { trackDelete, withSyncTracking } from "../adapters/web/indexedDbHelpers";
import { convertCurrency } from "../utils/currency";

export interface RecordSellData {
  sellPrice: number;
  quantity: number;
  sellDate: number;
  fees: number;
  currency: CurrencyCode;
  notes?: string;
}

export const useSellTransactions = (
  entryId: string | null,
  entry: PortfolioEntry | null,
  baseCurrency: CurrencyCode,
) => {
  const [sellTransactions, setSellTransactions] = useState<SellTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const txs = await listSellTransactionsByEntry(id);
      setSellTransactions(txs);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sell transactions");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const recordSell = useCallback(async (data: RecordSellData) => {
    if (!entry) throw new Error("Entry not loaded");
    if (data.quantity > entry.quantity) {
      throw new Error(`Cannot sell ${data.quantity} — only ${entry.quantity} available`);
    }

    const costBasisPerUnit = entry.purchasePrice;
    const realizedGainLoss =
      data.sellPrice * data.quantity - costBasisPerUnit * data.quantity - data.fees;
    const now = Math.floor(Date.now() / 1000);

    const sellTx: SellTransaction = {
      id: crypto.randomUUID(),
      entryId: entry.id,
      portfolioId: entry.portfolioId,
      sellPrice: data.sellPrice,
      quantity: data.quantity,
      sellDate: data.sellDate,
      fees: data.fees,
      currency: data.currency,
      realizedGainLoss,
      costBasisPerUnit,
      notes: data.notes,
      createdAt: now,
      syncVersion: 0,
    };

    await createSellTransaction(sellTx);

    const updatedEntry: PortfolioEntry = {
      ...entry,
      quantity: entry.quantity - data.quantity,
    };
    await updateEntryService(updatedEntry);

    const netSellAmount = data.sellPrice * data.quantity - data.fees;
    const baseCurrencyAmount = await convertCurrency(netSellAmount, data.currency, baseCurrency);
    const capitalTx: CapitalTransaction = {
      id: crypto.randomUUID(),
      type: "sell-credit",
      amount: netSellAmount,
      currency: data.currency,
      baseCurrencyAmount,
      referenceId: sellTx.id,
      date: data.sellDate,
      createdAt: now,
      syncVersion: 0,
    };
    await createCapitalTransaction(capitalTx);

    if (entryId) await load(entryId);
  }, [entry, baseCurrency, entryId, load]);

  const deleteSell = useCallback(async (id: string) => {
    const db = getDb();
    await db.transaction(
      "rw",
      [db.sellTransactions, db.portfolioEntries, db.capitalTransactions, db._pendingChanges],
      async () => {
        const sellTx = await db.sellTransactions.get(id);
        if (!sellTx) throw new Error(`Sell transaction not found: ${id}`);

        const entryRecord = await db.portfolioEntries.get(sellTx.entryId);
        if (entryRecord) {
          const restored = withSyncTracking(
            { ...entryRecord, quantity: entryRecord.quantity + sellTx.quantity },
            entryRecord,
          );
          await db.portfolioEntries.put(restored);
        }

        const capitalTx = await db.capitalTransactions
          .where("referenceId")
          .equals(id)
          .filter((t) => t.type === "sell-credit" && !t.deleted)
          .first();
        if (capitalTx) {
          await trackDelete("capitalTransactions", capitalTx.id, capitalTx.syncVersion || 0);
          await db.capitalTransactions.delete(capitalTx.id);
        }

        await trackDelete("sellTransactions", id, sellTx.syncVersion || 0);
        await db.sellTransactions.delete(id);
      },
    );

    if (entryId) await load(entryId);
  }, [entryId, load]);

  const totalRealized = sellTransactions.reduce((sum, tx) => sum + tx.realizedGainLoss, 0);

  useEffect(() => {
    if (entryId) {
      load(entryId);
    } else {
      setSellTransactions([]);
    }
  }, [entryId]);

  return {
    sellTransactions,
    isLoading,
    error,
    totalRealized,
    recordSell,
    deleteSell,
  };
};
