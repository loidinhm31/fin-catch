import type { IPortfolioEntryService } from "@fin-catch/shared/services";
import type { PortfolioEntry } from "@fin-catch/shared/types";
import { db, generateId, getCurrentTimestamp } from "./database";

/**
 * IndexedDB implementation of Portfolio Entry Service using Dexie
 *
 * Sync tracking:
 * - Creates/updates: synced_at is cleared (undefined) and sync_version incremented
 * - Deletes: Tracked in _pendingChanges before hard delete
 * - The sync adapter queries records where synced_at is undefined
 */
export class IndexedDBPortfolioEntryAdapter implements IPortfolioEntryService {
  async createEntry(entry: PortfolioEntry): Promise<string> {
    const id = entry.id || generateId();
    const now = getCurrentTimestamp();

    const newEntry: PortfolioEntry = {
      ...entry,
      id,
      created_at: entry.created_at || now,
      sync_version: 1,
      synced_at: undefined, // Mark as pending sync
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

    // Mark as pending sync by clearing synced_at and incrementing version
    const updatedEntry: PortfolioEntry = {
      ...entry,
      sync_version: (existing.sync_version || 0) + 1,
      synced_at: undefined, // Mark as pending sync
    };

    await db.portfolioEntries.put(updatedEntry);
  }

  async deleteEntry(id: string): Promise<void> {
    // Use transaction for cascading delete and sync tracking
    await db.transaction(
      "rw",
      [db.portfolioEntries, db.couponPayments, db._pendingChanges],
      async () => {
        // Get the entry before deleting (for sync version)
        const entry = await db.portfolioEntries.get(id);

        // Delete all coupon payments for this entry
        // Track each payment deletion for sync
        const payments = await db.couponPayments
          .where("entry_id")
          .equals(id)
          .toArray();
        for (const payment of payments) {
          await db._pendingChanges.add({
            tableName: "couponPayments",
            rowId: payment.id,
            operation: "delete",
            data: {},
            version: (payment.sync_version || 0) + 1,
            createdAt: getCurrentTimestamp(),
          });
        }
        await db.couponPayments.where("entry_id").equals(id).delete();

        // Track entry deletion for sync
        if (entry) {
          await db._pendingChanges.add({
            tableName: "portfolioEntries",
            rowId: id,
            operation: "delete",
            data: {},
            version: (entry.sync_version || 0) + 1,
            createdAt: getCurrentTimestamp(),
          });
        }

        // Delete the entry
        await db.portfolioEntries.delete(id);
      },
    );
  }
}
