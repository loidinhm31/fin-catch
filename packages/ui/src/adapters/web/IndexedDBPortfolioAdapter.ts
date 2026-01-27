import type { IPortfolioService } from "@fin-catch/shared/services";
import type { Portfolio } from "@fin-catch/shared/types";
import { db, generateId, getCurrentTimestamp } from "./database";

/**
 * IndexedDB implementation of Portfolio Service using Dexie
 *
 * Sync tracking:
 * - Creates/updates: synced_at is cleared (undefined) and sync_version incremented
 * - Deletes: Tracked in _pendingChanges before hard delete
 * - The sync adapter queries records where synced_at is undefined
 */
export class IndexedDBPortfolioAdapter implements IPortfolioService {
  async createPortfolio(portfolio: Portfolio): Promise<string> {
    const id = portfolio.id || generateId();
    const now = getCurrentTimestamp();

    const newPortfolio: Portfolio = {
      ...portfolio,
      id,
      created_at: portfolio.created_at || now,
      sync_version: 1,
      synced_at: undefined, // Mark as pending sync
    };

    await db.portfolios.add(newPortfolio);
    return id;
  }

  async getPortfolio(id: string): Promise<Portfolio> {
    const portfolio = await db.portfolios.get(id);

    if (!portfolio) {
      throw new Error(`Portfolio not found: ${id}`);
    }

    return portfolio;
  }

  async listPortfolios(): Promise<Portfolio[]> {
    const portfolios = await db.portfolios.toArray();
    console.log(
      "[IndexedDBPortfolioAdapter] All portfolios in DB:",
      portfolios,
    );

    // Sort by created_at descending (newest first)
    // Handle case where created_at might be missing
    portfolios.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));

    return portfolios;
  }

  async updatePortfolio(portfolio: Portfolio): Promise<void> {
    const existing = await db.portfolios.get(portfolio.id);
    if (!existing) {
      throw new Error(`Portfolio not found: ${portfolio.id}`);
    }

    // Mark as pending sync by clearing synced_at and incrementing version
    const updatedPortfolio: Portfolio = {
      ...portfolio,
      sync_version: (existing.sync_version || 0) + 1,
      synced_at: undefined, // Mark as pending sync
    };

    await db.portfolios.put(updatedPortfolio);
  }

  async deletePortfolio(id: string): Promise<void> {
    // Use transaction for cascading delete and sync tracking
    await db.transaction(
      "rw",
      [
        db.portfolios,
        db.portfolioEntries,
        db.couponPayments,
        db._pendingChanges,
      ],
      async () => {
        // Get the portfolio before deleting (for sync version)
        const portfolio = await db.portfolios.get(id);

        // Get all entries for this portfolio
        const entries = await db.portfolioEntries
          .where("portfolio_id")
          .equals(id)
          .toArray();

        // Track and delete coupon payments for each entry
        for (const entry of entries) {
          const payments = await db.couponPayments
            .where("entry_id")
            .equals(entry.id)
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
          await db.couponPayments.where("entry_id").equals(entry.id).delete();

          // Track entry deletion
          await db._pendingChanges.add({
            tableName: "portfolioEntries",
            rowId: entry.id,
            operation: "delete",
            data: {},
            version: (entry.sync_version || 0) + 1,
            createdAt: getCurrentTimestamp(),
          });
        }

        // Delete all entries for this portfolio
        await db.portfolioEntries.where("portfolio_id").equals(id).delete();

        // Track portfolio deletion
        if (portfolio) {
          await db._pendingChanges.add({
            tableName: "portfolios",
            rowId: id,
            operation: "delete",
            data: {},
            version: (portfolio.sync_version || 0) + 1,
            createdAt: getCurrentTimestamp(),
          });
        }

        // Delete the portfolio
        await db.portfolios.delete(id);
      },
    );
  }
}
