import { CurrencyCode } from "./api";

export type CapitalTransactionType =
  | "pay-in"
  | "withdraw"
  | "buy-deduction"
  | "sell-credit";

export interface CapitalTransaction {
  id: string;
  type: CapitalTransactionType;
  amount: number; // Always positive; sign derived from type
  currency: CurrencyCode;
  baseCurrencyAmount: number; // Converted at transaction time
  referenceId?: string; // entryId for auto-linked transactions
  notes?: string;
  date: number; // Unix timestamp seconds
  createdAt: number;
  syncVersion: number;
  syncedAt?: number;
  deleted?: boolean;
  deletedAt?: number | null;
}

export interface CapitalSummary {
  baseCurrency: CurrencyCode;
  totalPayIn: number;
  totalWithdraw: number;
  totalBuyDeduction: number;
  totalSellCredit: number;
  availableCapital: number; // payIn - withdraw - buyDeduction + sellCredit
  totalInvested: number; // Sum of current positions' totalCost
  netCapitalFlow: number; // payIn - withdraw
}
