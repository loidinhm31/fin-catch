import type { SellTransaction } from "@fin-catch/shared";

export interface ISellTransactionService {
  createSellTransaction(tx: SellTransaction): Promise<string>;
  listByEntry(entryId: string): Promise<SellTransaction[]>;
  listByPortfolio(portfolioId: string): Promise<SellTransaction[]>;
  deleteSellTransaction(id: string): Promise<void>;
}
