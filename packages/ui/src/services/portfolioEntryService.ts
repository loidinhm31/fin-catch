import { PortfolioEntry } from "@fin-catch/shared";
import { getPortfolioEntryService } from "@fin-catch/ui/adapters/factory";

function handleError(error: unknown): Error {
  if (typeof error === "string") {
    return new Error(error);
  }
  return error instanceof Error ? error : new Error("Unknown error occurred");
}

export async function createEntry(entry: PortfolioEntry): Promise<string> {
  try {
    return await getPortfolioEntryService().createEntry(entry);
  } catch (error) {
    console.error("Error creating entry:", error);
    throw handleError(error);
  }
}

export async function getEntry(id: string): Promise<PortfolioEntry> {
  try {
    return await getPortfolioEntryService().getEntry(id);
  } catch (error) {
    console.error("Error getting entry:", error);
    throw handleError(error);
  }
}

export async function listEntries(
  portfolioId: string,
): Promise<PortfolioEntry[]> {
  try {
    return await getPortfolioEntryService().listEntries(portfolioId);
  } catch (error) {
    console.error("Error listing entries:", error);
    throw handleError(error);
  }
}

export async function updateEntry(entry: PortfolioEntry): Promise<void> {
  try {
    return await getPortfolioEntryService().updateEntry(entry);
  } catch (error) {
    console.error("Error updating entry:", error);
    throw handleError(error);
  }
}

export async function deleteEntry(id: string): Promise<void> {
  try {
    return await getPortfolioEntryService().deleteEntry(id);
  } catch (error) {
    console.error("Error deleting entry:", error);
    throw handleError(error);
  }
}
