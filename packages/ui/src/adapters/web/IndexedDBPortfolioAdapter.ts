import type { IPortfolioService } from "@repo/shared/services";
import type { Portfolio } from "@repo/shared/types";
import { db, generateId, getCurrentTimestamp } from "./database";

/**
 * IndexedDB implementation of Portfolio Service using Dexie
 */
export class IndexedDBPortfolioAdapter implements IPortfolioService {
  async createPortfolio(portfolio: Portfolio): Promise<string> {
    const id = portfolio.id || generateId();
    const now = getCurrentTimestamp();

    const newPortfolio: Portfolio = {
      ...portfolio,
      id,
      created_at: portfolio.created_at || now,
      sync_version: portfolio.sync_version || 0,
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

    await db.portfolios.put(portfolio);
  }

  async deletePortfolio(id: string): Promise<void> {
    // Use transaction for cascading delete
    await db.transaction(
      "rw",
      [db.portfolios, db.portfolioEntries, db.couponPayments],
      async () => {
        // Get all entries for this portfolio
        const entries = await db.portfolioEntries
          .where("portfolio_id")
          .equals(id)
          .toArray();

        // Delete coupon payments for each entry
        for (const entry of entries) {
          await db.couponPayments.where("entry_id").equals(entry.id).delete();
        }

        // Delete all entries for this portfolio
        await db.portfolioEntries.where("portfolio_id").equals(id).delete();

        // Delete the portfolio
        await db.portfolios.delete(id);
      },
    );
  }
}
