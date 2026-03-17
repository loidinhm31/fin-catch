import type { ISellTransactionService } from "@fin-catch/ui/adapters/factory/interfaces";
import type { SellTransaction } from "@fin-catch/shared";
import { getDb } from "./database";
import { withSyncTracking, trackDelete } from "./indexedDbHelpers";

export class IndexedDBSellTransactionAdapter implements ISellTransactionService {
  async createSellTransaction(tx: SellTransaction): Promise<string> {
    const newTx = withSyncTracking(tx);
    await getDb().sellTransactions.add(newTx);
    return newTx.id!;
  }

  async listByEntry(entryId: string): Promise<SellTransaction[]> {
    const txs = await getDb().sellTransactions
      .where("entryId")
      .equals(entryId)
      .filter((t) => !t.deleted)
      .toArray();
    return txs.sort((a, b) => a.sellDate - b.sellDate);
  }

  async listByPortfolio(portfolioId: string): Promise<SellTransaction[]> {
    const txs = await getDb().sellTransactions
      .where("portfolioId")
      .equals(portfolioId)
      .filter((t) => !t.deleted)
      .toArray();
    return txs.sort((a, b) => a.sellDate - b.sellDate);
  }

  async deleteSellTransaction(id: string): Promise<void> {
    await getDb().transaction(
      "rw",
      [getDb().sellTransactions, getDb()._pendingChanges],
      async () => {
        const tx = await getDb().sellTransactions.get(id);
        if (tx) {
          await trackDelete("sellTransactions", id, tx.syncVersion || 0);
        }
        await getDb().sellTransactions.delete(id);
      },
    );
  }
}
