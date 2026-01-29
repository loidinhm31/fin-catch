import type { IPortfolioService, Portfolio } from "@fin-catch/shared";
import { tauriInvoke } from "./tauriInvoke";

export class TauriPortfolioAdapter implements IPortfolioService {
  async createPortfolio(portfolio: Portfolio): Promise<string> {
    return tauriInvoke<string>("create_portfolio", { portfolio });
  }

  async getPortfolio(id: string): Promise<Portfolio> {
    return tauriInvoke<Portfolio>("get_portfolio", { id });
  }

  async listPortfolios(): Promise<Portfolio[]> {
    return tauriInvoke<Portfolio[]>("list_portfolios");
  }

  async updatePortfolio(portfolio: Portfolio): Promise<void> {
    await tauriInvoke<void>("update_portfolio", { portfolio });
  }

  async deletePortfolio(id: string): Promise<void> {
    await tauriInvoke<void>("delete_portfolio", { id });
  }
}
