import { invoke } from "@tauri-apps/api/core";
import type { Portfolio } from "@fin-catch/shared";
import type { IPortfolioService } from "../interfaces";

/**
 * Tauri adapter for portfolio operations
 * Wraps invoke() calls to Rust backend
 */
export class TauriPortfolioAdapter implements IPortfolioService {
  async createPortfolio(portfolio: Portfolio): Promise<string> {
    console.log("[Tauri IPC] create_portfolio", portfolio);
    const id = await invoke<string>("create_portfolio", { portfolio });
    console.log("[Tauri IPC Response]", id);
    return id;
  }

  async getPortfolio(id: string): Promise<Portfolio> {
    console.log("[Tauri IPC] get_portfolio", id);
    const portfolio = await invoke<Portfolio>("get_portfolio", { id });
    console.log("[Tauri IPC Response]", portfolio);
    return portfolio;
  }

  async listPortfolios(): Promise<Portfolio[]> {
    console.log("[Tauri IPC] list_portfolios");
    const portfolios = await invoke<Portfolio[]>("list_portfolios");
    console.log("[Tauri IPC Response]", portfolios);
    return portfolios;
  }

  async updatePortfolio(portfolio: Portfolio): Promise<void> {
    console.log("[Tauri IPC] update_portfolio", portfolio);
    await invoke<void>("update_portfolio", { portfolio });
    console.log("[Tauri IPC Response] Portfolio updated");
  }

  async deletePortfolio(id: string): Promise<void> {
    console.log("[Tauri IPC] delete_portfolio", id);
    await invoke<void>("delete_portfolio", { id });
    console.log("[Tauri IPC Response] Portfolio deleted");
  }
}
