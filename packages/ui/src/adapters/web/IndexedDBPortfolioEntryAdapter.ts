import type { IPortfolioEntryService } from "@fin-catch/ui/adapters/factory/interfaces";
import type { PortfolioEntry } from "@fin-catch/shared";
import { getDb } from "./database";
import { withSyncTracking, trackDelete } from "./indexedDbHelpers";

export class IndexedDBPortfolioEntryAdapter implements IPortfolioEntryService {
  async createEntry(entry: PortfolioEntry): Promise<string> {
    const newEntry = withSyncTracking(entry);
    await getDb().portfolioEntries.add(newEntry);
    return newEntry.id!;
  }

  async getEntry(id: string): Promise<PortfolioEntry> {
    const entry = await getDb().portfolioEntries.get(id);
    if (!entry) {
      throw new Error(`Entry not found: ${id}`);
    }
    return entry;
  }

  async listEntries(portfolioId: string): Promise<PortfolioEntry[]> {
    return getDb().portfolioEntries
      .where("portfolioId")
      .equals(portfolioId)
      .filter((e) => !e.deleted)
      .toArray();
  }

  async updateEntry(entry: PortfolioEntry): Promise<void> {
    const existing = await getDb().portfolioEntries.get(entry.id);
    if (!existing) {
      throw new Error(`Entry not found: ${entry.id}`);
    }
    await getDb().portfolioEntries.put(withSyncTracking(entry, existing));
  }

  async deleteEntry(id: string): Promise<void> {
    await getDb().transaction(
      "rw",
      [getDb().portfolioEntries, getDb().couponPayments, getDb()._pendingChanges],
      async () => {
        const entry = await getDb().portfolioEntries.get(id);

        const payments = await getDb().couponPayments
          .where("entryId")
          .equals(id)
          .toArray();
        for (const payment of payments) {
          await trackDelete(
            "couponPayments",
            payment.id,
            payment.syncVersion || 0,
          );
        }
        await getDb().couponPayments.where("entryId").equals(id).delete();

        if (entry) {
          await trackDelete("portfolioEntries", id, entry.syncVersion || 0);
        }

        await getDb().portfolioEntries.delete(id);
      },
    );
  }
}
