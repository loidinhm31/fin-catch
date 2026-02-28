import type { IPortfolioService } from "@fin-catch/ui/adapters/factory/interfaces";
import type { Portfolio } from "@fin-catch/shared";
import { getDb } from "./database";
import { withSyncTracking, trackDelete } from "./indexedDbHelpers";

export class IndexedDBPortfolioAdapter implements IPortfolioService {
  async createPortfolio(portfolio: Portfolio): Promise<string> {
    const newPortfolio = withSyncTracking(portfolio);
    await getDb().portfolios.add(newPortfolio);
    return newPortfolio.id!;
  }

  async getPortfolio(id: string): Promise<Portfolio> {
    const portfolio = await getDb().portfolios.get(id);
    if (!portfolio) {
      throw new Error(`Portfolio not found: ${id}`);
    }
    return portfolio;
  }

  async listPortfolios(): Promise<Portfolio[]> {
    const portfolios = await getDb().portfolios.filter((p) => !p.deleted).toArray();
    portfolios.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return portfolios;
  }

  async updatePortfolio(portfolio: Portfolio): Promise<void> {
    const existing = await getDb().portfolios.get(portfolio.id);
    if (!existing) {
      throw new Error(`Portfolio not found: ${portfolio.id}`);
    }
    await getDb().portfolios.put(withSyncTracking(portfolio, existing));
  }

  async deletePortfolio(id: string): Promise<void> {
    await getDb().transaction(
      "rw",
      [
        getDb().portfolios,
        getDb().portfolioEntries,
        getDb().couponPayments,
        getDb()._pendingChanges,
      ],
      async () => {
        const portfolio = await getDb().portfolios.get(id);
        const entries = await getDb().portfolioEntries
          .where("portfolioId")
          .equals(id)
          .toArray();

        for (const entry of entries) {
          const payments = await getDb().couponPayments
            .where("entryId")
            .equals(entry.id)
            .toArray();
          for (const payment of payments) {
            await trackDelete(
              "couponPayments",
              payment.id,
              payment.syncVersion || 0,
            );
          }
          await getDb().couponPayments.where("entryId").equals(entry.id).delete();
          await trackDelete(
            "portfolioEntries",
            entry.id,
            entry.syncVersion || 0,
          );
        }

        await getDb().portfolioEntries.where("portfolioId").equals(id).delete();

        if (portfolio) {
          await trackDelete("portfolios", id, portfolio.syncVersion || 0);
        }

        await getDb().portfolios.delete(id);
      },
    );
  }
}
