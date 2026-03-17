import type { ICapitalService } from "@fin-catch/ui/adapters/factory/interfaces";
import type { CapitalTransaction } from "@fin-catch/shared";
import { getDb } from "./database";
import { withSyncTracking, trackDelete } from "./indexedDbHelpers";

export class IndexedDBCapitalAdapter implements ICapitalService {
  async createCapitalTransaction(tx: CapitalTransaction): Promise<string> {
    const newTx = withSyncTracking(tx);
    await getDb().capitalTransactions.add(newTx);
    return newTx.id!;
  }

  async listCapitalTransactions(): Promise<CapitalTransaction[]> {
    const txs = await getDb().capitalTransactions
      .filter((t) => !t.deleted)
      .toArray();
    return txs.sort((a, b) => a.date - b.date);
  }

  async deleteCapitalTransaction(id: string): Promise<void> {
    await getDb().transaction(
      "rw",
      [getDb().capitalTransactions, getDb()._pendingChanges],
      async () => {
        const tx = await getDb().capitalTransactions.get(id);
        if (tx) {
          await trackDelete("capitalTransactions", id, tx.syncVersion || 0);
        }
        await getDb().capitalTransactions.delete(id);
      },
    );
  }
}
