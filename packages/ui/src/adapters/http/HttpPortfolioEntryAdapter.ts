import type { IPortfolioEntryService, PortfolioEntry } from "@fin-catch/shared";
import { HttpClient } from "./HttpClient";

export class HttpPortfolioEntryAdapter
  extends HttpClient
  implements IPortfolioEntryService
{
  async createEntry(entry: PortfolioEntry): Promise<string> {
    return this.post<PortfolioEntry, string>("/api/entries", entry);
  }

  async getEntry(id: string): Promise<PortfolioEntry> {
    return this.get<PortfolioEntry>(`/api/entries/${encodeURIComponent(id)}`);
  }

  async listEntries(portfolioId: string): Promise<PortfolioEntry[]> {
    return this.get<PortfolioEntry[]>(
      `/api/portfolios/${encodeURIComponent(portfolioId)}/entries`,
    );
  }

  async updateEntry(entry: PortfolioEntry): Promise<void> {
    await this.put<PortfolioEntry, void>(
      `/api/entries/${encodeURIComponent(entry.id)}`,
      entry,
    );
  }

  async deleteEntry(id: string): Promise<void> {
    await this.del<void>(`/api/entries/${encodeURIComponent(id)}`);
  }
}
