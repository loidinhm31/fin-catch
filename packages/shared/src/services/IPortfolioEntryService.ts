import type { PortfolioEntry } from "../types/portfolio";

/**
 * Portfolio entry service interface
 * Implemented by TauriPortfolioEntryAdapter (SQLite) and WebPortfolioEntryAdapter (IndexedDB)
 */
export interface IPortfolioEntryService {
  createEntry(entry: PortfolioEntry): Promise<string>;
  getEntry(id: string): Promise<PortfolioEntry>;
  listEntries(portfolioId: string): Promise<PortfolioEntry[]>;
  updateEntry(entry: PortfolioEntry): Promise<void>;
  deleteEntry(id: string): Promise<void>;
}
