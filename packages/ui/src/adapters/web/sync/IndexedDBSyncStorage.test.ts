/**
 * Tests for validatePullRecord (Issue D — pull validation).
 * Accesses private method via type cast since it is implementation-only logic
 * not worth exposing on the public interface.
 */

import { describe, it, expect, vi } from "vitest";

// Mock the db singleton — validatePullRecord doesn't use db but the module-level
// import would fail in jsdom (no IndexedDB).
vi.mock("@fin-catch/ui/adapters/web", () => ({
  db: {},
  getCurrentTimestamp: () => Math.floor(Date.now() / 1000),
  SYNC_META_KEYS: { CHECKPOINT: "checkpoint", LAST_SYNC_AT: "lastSyncAt" },
}));

import { IndexedDBSyncStorage } from "./IndexedDBSyncStorage";
import type { PullRecord } from "@fin-catch/shared";

// Access private method for white-box testing
function validate(storage: IndexedDBSyncStorage, record: PullRecord): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (storage as any).validatePullRecord(record);
}

const storage = new IndexedDBSyncStorage();

function makeRecord(
  tableName: string,
  data: Record<string, unknown>,
  rowId = "uuid-1",
): PullRecord {
  return { tableName, rowId, data, version: 1, syncedAt: "2026-01-01T00:00:00Z", deleted: false };
}

describe("IndexedDBSyncStorage.validatePullRecord", () => {
  // Unknown table
  it("rejects unknown table name", () => {
    expect(validate(storage, makeRecord("hackedTable", { name: "x" }))).toBe(false);
  });

  it("rejects missing rowId", () => {
    expect(
      validate(storage, { tableName: "portfolios", rowId: "", data: { name: "P" }, version: 1, syncedAt: "2026-01-01T00:00:00Z", deleted: false }),
    ).toBe(false);
  });

  it("rejects null data", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(validate(storage, { tableName: "portfolios", rowId: "id", data: null as any, version: 1, syncedAt: "2026-01-01T00:00:00Z", deleted: false })).toBe(false);
  });

  // portfolios
  describe("portfolios", () => {
    it("accepts valid portfolio record", () => {
      expect(validate(storage, makeRecord("portfolios", { name: "My Portfolio", createdAt: 1000 }))).toBe(true);
    });

    it("accepts portfolio without createdAt (optional)", () => {
      expect(validate(storage, makeRecord("portfolios", { name: "P" }))).toBe(true);
    });

    it("rejects portfolio without name", () => {
      expect(validate(storage, makeRecord("portfolios", { createdAt: 1000 }))).toBe(false);
    });

    it("rejects portfolio with non-string name", () => {
      expect(validate(storage, makeRecord("portfolios", { name: 42, createdAt: 1000 }))).toBe(false);
    });

    it("rejects portfolio with non-number createdAt", () => {
      expect(validate(storage, makeRecord("portfolios", { name: "P", createdAt: "2026-01-01" }))).toBe(false);
    });
  });

  // portfolioEntries
  describe("portfolioEntries", () => {
    it("accepts valid entry with known assetType", () => {
      for (const t of ["stock", "bond", "gold", "cash", "crypto"]) {
        expect(
          validate(storage, makeRecord("portfolioEntries", { assetType: t, symbol: "VNM" })),
        ).toBe(true);
      }
    });

    it("rejects entry with unknown assetType", () => {
      expect(validate(storage, makeRecord("portfolioEntries", { assetType: "nft" }))).toBe(false);
    });

    it("rejects entry with missing assetType", () => {
      expect(validate(storage, makeRecord("portfolioEntries", { symbol: "VNM" }))).toBe(false);
    });
  });

  // bondCouponPayments
  describe("bondCouponPayments", () => {
    it("accepts valid coupon payment record", () => {
      expect(
        validate(storage, makeRecord("bondCouponPayments", { amount: 500000, paymentDate: 1700000000 })),
      ).toBe(true);
    });

    it("rejects missing amount", () => {
      expect(validate(storage, makeRecord("bondCouponPayments", { paymentDate: 1700000000 }))).toBe(false);
    });

    it("rejects non-number amount", () => {
      expect(validate(storage, makeRecord("bondCouponPayments", { amount: "500k", paymentDate: 1700000000 }))).toBe(false);
    });

    it("rejects missing paymentDate", () => {
      expect(validate(storage, makeRecord("bondCouponPayments", { amount: 100 }))).toBe(false);
    });
  });

  // sellTransactions
  describe("sellTransactions", () => {
    const validSell = {
      sellPrice: 50000,
      quantity: 100,
      sellDate: 1700000000,
      fees: 150,
      currency: "VND",
      realizedGainLoss: 200000,
      costBasisPerUnit: 48000,
    };

    it("accepts valid sell transaction", () => {
      expect(validate(storage, makeRecord("sellTransactions", validSell))).toBe(true);
    });

    it("accepts sell transaction with optional notes", () => {
      expect(validate(storage, makeRecord("sellTransactions", { ...validSell, notes: "partial exit" }))).toBe(true);
    });

    it.each(["sellPrice", "quantity", "sellDate", "fees", "realizedGainLoss", "costBasisPerUnit"])(
      "rejects missing required number field: %s",
      (field) => {
        const data = { ...validSell, [field]: undefined };
        expect(validate(storage, makeRecord("sellTransactions", data))).toBe(false);
      },
    );

    it("rejects non-number sellPrice", () => {
      expect(validate(storage, makeRecord("sellTransactions", { ...validSell, sellPrice: "50k" }))).toBe(false);
    });

    it("rejects missing currency", () => {
      const { currency: _, ...withoutCurrency } = validSell;
      expect(validate(storage, makeRecord("sellTransactions", withoutCurrency))).toBe(false);
    });
  });

  // capitalTransactions
  describe("capitalTransactions", () => {
    const validCapital = {
      type: "pay-in",
      amount: 10000000,
      date: 1700000000,
      currency: "VND",
      baseCurrencyAmount: 10000000,
    };

    it("accepts all valid capital transaction types", () => {
      for (const type of ["pay-in", "withdraw", "buy-deduction", "sell-credit"]) {
        expect(validate(storage, makeRecord("capitalTransactions", { ...validCapital, type }))).toBe(true);
      }
    });

    it("accepts capital transaction with optional referenceId", () => {
      expect(validate(storage, makeRecord("capitalTransactions", { ...validCapital, referenceId: "entry-uuid" }))).toBe(true);
    });

    it("rejects unknown type", () => {
      expect(validate(storage, makeRecord("capitalTransactions", { ...validCapital, type: "transfer" }))).toBe(false);
    });

    it("rejects missing type", () => {
      const { type: _, ...withoutType } = validCapital;
      expect(validate(storage, makeRecord("capitalTransactions", withoutType))).toBe(false);
    });

    it.each(["amount", "date", "baseCurrencyAmount"])(
      "rejects missing required number field: %s",
      (field) => {
        const data = { ...validCapital, [field]: undefined };
        expect(validate(storage, makeRecord("capitalTransactions", data))).toBe(false);
      },
    );

    it("rejects non-number amount", () => {
      expect(validate(storage, makeRecord("capitalTransactions", { ...validCapital, amount: "10M" }))).toBe(false);
    });

    it("rejects missing currency", () => {
      const { currency: _, ...withoutCurrency } = validCapital;
      expect(validate(storage, makeRecord("capitalTransactions", withoutCurrency))).toBe(false);
    });
  });
});
