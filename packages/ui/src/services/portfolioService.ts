import { Portfolio } from "@fin-catch/shared";
import { getPortfolioService } from "@fin-catch/ui/adapters/factory";

function handleError(error: unknown): Error {
  if (typeof error === "string") {
    return new Error(error);
  }
  return error instanceof Error ? error : new Error("Unknown error occurred");
}

export async function createPortfolio(portfolio: Portfolio): Promise<string> {
  try {
    return await getPortfolioService().createPortfolio(portfolio);
  } catch (error) {
    console.error("Error creating portfolio:", error);
    throw handleError(error);
  }
}

export async function getPortfolio(id: string): Promise<Portfolio> {
  try {
    return await getPortfolioService().getPortfolio(id);
  } catch (error) {
    console.error("Error getting portfolio:", error);
    throw handleError(error);
  }
}

export async function listPortfolios(): Promise<Portfolio[]> {
  try {
    return await getPortfolioService().listPortfolios();
  } catch (error) {
    console.error("Error listing portfolios:", error);
    throw handleError(error);
  }
}

export async function updatePortfolio(portfolio: Portfolio): Promise<void> {
  try {
    return await getPortfolioService().updatePortfolio(portfolio);
  } catch (error) {
    console.error("Error updating portfolio:", error);
    throw handleError(error);
  }
}

export async function deletePortfolio(id: string): Promise<void> {
  try {
    return await getPortfolioService().deletePortfolio(id);
  } catch (error) {
    console.error("Error deleting portfolio:", error);
    throw handleError(error);
  }
}
