import { PortfolioEntry } from "@fin-catch/shared";
import { getPortfolioEntryService } from "@fin-catch/ui/adapters/factory";

export async function createEntry(entry: PortfolioEntry): Promise<string> {
  return getPortfolioEntryService().createEntry(entry);
}

export async function getEntry(id: string): Promise<PortfolioEntry> {
  return getPortfolioEntryService().getEntry(id);
}

export async function listEntries(
  portfolioId: string,
): Promise<PortfolioEntry[]> {
  return getPortfolioEntryService().listEntries(portfolioId);
}

export async function updateEntry(entry: PortfolioEntry): Promise<void> {
  return getPortfolioEntryService().updateEntry(entry);
}

export async function deleteEntry(id: string): Promise<void> {
  return getPortfolioEntryService().deleteEntry(id);
}
