import { invoke } from "@tauri-apps/api/core";
import type { PortfolioEntry } from "@repo/shared";
import type { IPortfolioEntryService } from "../interfaces";

/**
 * Tauri adapter for portfolio entry operations
 * Wraps invoke() calls to Rust backend
 */
export class TauriPortfolioEntryAdapter implements IPortfolioEntryService {
  async createEntry(entry: PortfolioEntry): Promise<string> {
    console.log("[Tauri IPC] create_entry", entry);
    const id = await invoke<string>("create_entry", { entry });
    console.log("[Tauri IPC Response]", id);
    return id;
  }

  async getEntry(id: string): Promise<PortfolioEntry> {
    console.log("[Tauri IPC] get_entry", id);
    const entry = await invoke<PortfolioEntry>("get_entry", { id });
    console.log("[Tauri IPC Response]", entry);
    return entry;
  }

  async listEntries(portfolioId: string): Promise<PortfolioEntry[]> {
    console.log("[Tauri IPC] list_entries", portfolioId);
    const entries = await invoke<PortfolioEntry[]>("list_entries", {
      portfolioId,
    });
    console.log("[Tauri IPC Response]", entries);
    return entries;
  }

  async updateEntry(entry: PortfolioEntry): Promise<void> {
    console.log("[Tauri IPC] update_entry", entry);
    await invoke<void>("update_entry", { entry });
    console.log("[Tauri IPC Response] Entry updated");
  }

  async deleteEntry(id: string): Promise<void> {
    console.log("[Tauri IPC] delete_entry", id);
    await invoke<void>("delete_entry", { id });
    console.log("[Tauri IPC Response] Entry deleted");
  }
}
