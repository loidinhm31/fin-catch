import type { IPortfolioEntryService } from "@fin-catch/ui/adapters/factory/interfaces";
import type { PortfolioEntry } from "@fin-catch/shared";
import { db } from "./database";
import { withSyncTracking, trackDelete } from "./indexedDbHelpers";

export class IndexedDBPortfolioEntryAdapter implements IPortfolioEntryService {
  async createEntry(entry: PortfolioEntry): Promise<string> {
    const newEntry = withSyncTracking(entry);
    await db.portfolioEntries.add(newEntry);
    return newEntry.id!;
  }

  async getEntry(id: string): Promise<PortfolioEntry> {
    const entry = await db.portfolioEntries.get(id);
    if (!entry) {
      throw new Error(`Entry not found: ${id}`);
    }
    return entry;
  }

  async listEntries(portfolioId: string): Promise<PortfolioEntry[]> {
    return db.portfolioEntries
      .where("portfolioId")
      .equals(portfolioId)
      .toArray();
  }

  async updateEntry(entry: PortfolioEntry): Promise<void> {
    const existing = await db.portfolioEntries.get(entry.id);
    if (!existing) {
      throw new Error(`Entry not found: ${entry.id}`);
    }
    await db.portfolioEntries.put(withSyncTracking(entry, existing));
  }

  async deleteEntry(id: string): Promise<void> {
    await db.transaction(
      "rw",
      [db.portfolioEntries, db.couponPayments, db._pendingChanges],
      async () => {
        const entry = await db.portfolioEntries.get(id);

        const payments = await db.couponPayments
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
        await db.couponPayments.where("entryId").equals(id).delete();

        if (entry) {
          await trackDelete("portfolioEntries", id, entry.syncVersion || 0);
        }

        await db.portfolioEntries.delete(id);
      },
    );
  }
}
