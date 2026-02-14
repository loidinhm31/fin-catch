import { Portfolio } from "@fin-catch/shared";

/**
 * Portfolio service interface
 * Implemented by TauriPortfolioAdapter (SQLite) and WebPortfolioAdapter (IndexedDB)
 */
export interface IPortfolioService {
  createPortfolio(portfolio: Portfolio): Promise<string>;
  getPortfolio(id: string): Promise<Portfolio>;
  listPortfolios(): Promise<Portfolio[]>;
  updatePortfolio(portfolio: Portfolio): Promise<void>;
  deletePortfolio(id: string): Promise<void>;
}
