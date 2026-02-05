import type { IPortfolioService } from "@fin-catch/ui/adapters/factory/interfaces";
import type { Portfolio } from "@fin-catch/shared/types";
import { db } from "./database";
import { withSyncTracking, trackDelete } from "./indexedDbHelpers";

export class IndexedDBPortfolioAdapter implements IPortfolioService {
  async createPortfolio(portfolio: Portfolio): Promise<string> {
    const newPortfolio = withSyncTracking(portfolio);
    await db.portfolios.add(newPortfolio);
    return newPortfolio.id!;
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
    portfolios.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
    return portfolios;
  }

  async updatePortfolio(portfolio: Portfolio): Promise<void> {
    const existing = await db.portfolios.get(portfolio.id);
    if (!existing) {
      throw new Error(`Portfolio not found: ${portfolio.id}`);
    }
    await db.portfolios.put(withSyncTracking(portfolio, existing));
  }

  async deletePortfolio(id: string): Promise<void> {
    await db.transaction(
      "rw",
      [
        db.portfolios,
        db.portfolioEntries,
        db.couponPayments,
        db._pendingChanges,
      ],
      async () => {
        const portfolio = await db.portfolios.get(id);
        const entries = await db.portfolioEntries
          .where("portfolio_id")
          .equals(id)
          .toArray();

        for (const entry of entries) {
          const payments = await db.couponPayments
            .where("entry_id")
            .equals(entry.id)
            .toArray();
          for (const payment of payments) {
            await trackDelete(
              "couponPayments",
              payment.id,
              payment.sync_version || 0,
            );
          }
          await db.couponPayments.where("entry_id").equals(entry.id).delete();
          await trackDelete(
            "portfolioEntries",
            entry.id,
            entry.sync_version || 0,
          );
        }

        await db.portfolioEntries.where("portfolio_id").equals(id).delete();

        if (portfolio) {
          await trackDelete("portfolios", id, portfolio.sync_version || 0);
        }

        await db.portfolios.delete(id);
      },
    );
  }
}
