import type { IPortfolioService, Portfolio } from "@fin-catch/shared";
import { HttpClient } from "./HttpClient";

export class HttpPortfolioAdapter
  extends HttpClient
  implements IPortfolioService
{
  async createPortfolio(portfolio: Portfolio): Promise<string> {
    return this.post<Portfolio, string>("/api/portfolios", portfolio);
  }

  async getPortfolio(id: string): Promise<Portfolio> {
    return this.get<Portfolio>(`/api/portfolios/${encodeURIComponent(id)}`);
  }

  async listPortfolios(): Promise<Portfolio[]> {
    return this.get<Portfolio[]>("/api/portfolios");
  }

  async updatePortfolio(portfolio: Portfolio): Promise<void> {
    await this.put<Portfolio, void>(
      `/api/portfolios/${encodeURIComponent(portfolio.id)}`,
      portfolio,
    );
  }

  async deletePortfolio(id: string): Promise<void> {
    await this.del<void>(`/api/portfolios/${encodeURIComponent(id)}`);
  }
}
