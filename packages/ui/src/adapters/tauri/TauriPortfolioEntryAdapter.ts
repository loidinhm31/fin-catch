import type { IPortfolioEntryService, PortfolioEntry } from "@fin-catch/shared";
import { tauriInvoke } from "./tauriInvoke";

export class TauriPortfolioEntryAdapter implements IPortfolioEntryService {
  async createEntry(entry: PortfolioEntry): Promise<string> {
    return tauriInvoke<string>("create_entry", { entry });
  }

  async getEntry(id: string): Promise<PortfolioEntry> {
    return tauriInvoke<PortfolioEntry>("get_entry", { id });
  }

  async listEntries(portfolioId: string): Promise<PortfolioEntry[]> {
    return tauriInvoke<PortfolioEntry[]>("list_entries", { portfolioId });
  }

  async updateEntry(entry: PortfolioEntry): Promise<void> {
    await tauriInvoke<void>("update_entry", { entry });
  }

  async deleteEntry(id: string): Promise<void> {
    await tauriInvoke<void>("delete_entry", { id });
  }
}
