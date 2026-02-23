import { Portfolio } from "@fin-catch/shared";
import { getPortfolioService } from "@fin-catch/ui/adapters/factory";

export async function createPortfolio(portfolio: Portfolio): Promise<string> {
  return getPortfolioService().createPortfolio(portfolio);
}

export async function getPortfolio(id: string): Promise<Portfolio> {
  return getPortfolioService().getPortfolio(id);
}

export async function listPortfolios(): Promise<Portfolio[]> {
  return getPortfolioService().listPortfolios();
}

export async function updatePortfolio(portfolio: Portfolio): Promise<void> {
  return getPortfolioService().updatePortfolio(portfolio);
}

export async function deletePortfolio(id: string): Promise<void> {
  return getPortfolioService().deletePortfolio(id);
}
