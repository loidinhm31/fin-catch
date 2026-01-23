import type { IPortfolioEntryService } from "@repo/shared/services";
import type { PortfolioEntry } from "@repo/shared/types";
import { db, generateId, getCurrentTimestamp } from "./database";

/**
 * IndexedDB implementation of Portfolio Entry Service using Dexie
 */
export class IndexedDBPortfolioEntryAdapter implements IPortfolioEntryService {
  async createEntry(entry: PortfolioEntry): Promise<string> {
    const id = entry.id || generateId();
    const now = getCurrentTimestamp();

    const newEntry: PortfolioEntry = {
      ...entry,
      id,
      created_at: entry.created_at || now,
      sync_version: entry.sync_version || 0,
    };

    await db.portfolioEntries.add(newEntry);
    return id;
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
      .where("portfolio_id")
      .equals(portfolioId)
      .toArray();
  }

  async updateEntry(entry: PortfolioEntry): Promise<void> {
    const existing = await db.portfolioEntries.get(entry.id);
    if (!existing) {
      throw new Error(`Entry not found: ${entry.id}`);
    }

    await db.portfolioEntries.put(entry);
  }

  async deleteEntry(id: string): Promise<void> {
    // Use transaction for cascading delete
    await db.transaction(
      "rw",
      [db.portfolioEntries, db.couponPayments],
      async () => {
        // Delete all coupon payments for this entry
        await db.couponPayments.where("entry_id").equals(id).delete();

        // Delete the entry
        await db.portfolioEntries.delete(id);
      },
    );
  }
}
