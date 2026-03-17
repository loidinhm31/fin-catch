import { CurrencyCode } from "./api";

export interface SellTransaction {
  id: string;
  entryId: string;
  portfolioId: string; // Denormalized for portfolio-level queries
  sellPrice: number;
  quantity: number;
  sellDate: number; // Unix timestamp seconds
  fees: number;
  currency: CurrencyCode;
  realizedGainLoss: number; // (sellPrice × qty) - (costBasis × qty) - fees
  costBasisPerUnit: number; // Snapshot of avg cost at sale time
  notes?: string;
  createdAt: number;
  syncVersion: number;
  syncedAt?: number;
  deleted?: boolean;
  deletedAt?: number | null;
}
