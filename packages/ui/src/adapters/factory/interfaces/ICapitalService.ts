import type { CapitalTransaction } from "@fin-catch/shared";

export interface ICapitalService {
  createCapitalTransaction(tx: CapitalTransaction): Promise<string>;
  listCapitalTransactions(): Promise<CapitalTransaction[]>;
  deleteCapitalTransaction(id: string): Promise<void>;
}
