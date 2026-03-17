# fin-catch Data Layer

## Overview

fin-catch organizes data into domain entities (portfolios, entries, transactions) synced via qm-sync to qm-hub-server. All client-side storage uses IndexedDB via Dexie.js. Two-phase sync: push pending changes → pull remote updates with checkpoint-based pagination.

## Domain Model

### Core Tables

**Portfolio** — Investment account container.

```typescript
interface Portfolio {
  id: string; // UUID
  name: string;
  description?: string;
  baseCurrency?: CurrencyCode; // Portfolio valuation base (e.g., VND, USD)
  createdAt: number; // Unix timestamp seconds
  syncVersion: number;
  syncedAt?: number;
  deleted?: boolean;
  deletedAt?: number | null;
}
```

**PortfolioEntry** — Holdings within a portfolio (stocks, gold, bonds, cash).

```typescript
interface PortfolioEntry {
  id: string; // UUID
  portfolioId: string; // FK
  assetType: "stock" | "gold" | "bond" | "cash" | "crypto" | "savings";
  symbol: string; // Stock ticker, gold type ID, bond ISIN, etc.
  quantity: number;
  purchasePrice: number; // Cost per unit
  currency?: CurrencyCode;
  purchaseDate: number; // Unix timestamp seconds
  notes?: string;
  // Asset-specific fields
  unit?: string; // Gold: "gram" | "mace" | "tael" | "ounce" | "kg"
  goldType?: string; // Gold: "1" SJC HCMC, "2" SJC Hanoi, "49" SJC rings
  faceValue?: number; // Bond: par value
  couponRate?: number; // Bond: annual % rate
  maturityDate?: number; // Bond: Unix timestamp
  couponFrequency?: "annual" | "semiannual" | "quarterly" | "monthly";
  currentMarketPrice?: number; // Bond: user-entered current price
  lastPriceUpdate?: number; // Bond: Unix timestamp
  ytm?: number; // Bond: yield to maturity %
  interestRate?: number; // Savings: annual %
  demandDepositRate?: number; // Savings: early withdrawal %
  termMonths?: number; // Savings: deposit term
  compoundingType?: "simple" | "compound";
  // Price alerts (synced to server for monitoring)
  targetPrice?: number; // Take-profit alert threshold
  stopLoss?: number; // Stop-loss alert threshold
  alertEnabled?: boolean; // Alerts active (default true when prices set)
  // Alert state (updated by server)
  lastAlertAt?: number; // Unix timestamp of last triggered alert
  alertCount?: number; // Times triggered (max 3, then auto-disable)
  lastAlertType?: "target" | "stop_loss";
  // Sync metadata
  syncVersion: number;
  syncedAt?: number;
  deleted?: boolean;
  deletedAt?: number | null;
}
```

**BondCouponPayment** — Coupon income received on bonds.

```typescript
interface BondCouponPayment {
  id: string; // UUID
  entryId: string; // FK to PortfolioEntry
  paymentDate: number; // Unix timestamp seconds
  amount: number; // Coupon received
  currency: CurrencyCode;
  notes?: string;
  createdAt: number;
  syncVersion: number;
  syncedAt?: number;
  deleted?: boolean;
  deletedAt?: number | null;
}
```

### Phase 01: Realized Gains & Capital Flows

**SellTransaction** — Record of an exit/liquidation event.

```typescript
interface SellTransaction {
  id: string; // UUID
  entryId: string; // FK to PortfolioEntry (entry sold)
  portfolioId: string; // Denormalized for portfolio-level queries
  sellPrice: number; // Price per unit at sale
  quantity: number; // Units sold
  sellDate: number; // Unix timestamp seconds
  fees: number; // Transaction costs (brokerage, etc.)
  currency: CurrencyCode; // Sale currency
  realizedGainLoss: number; // (sellPrice × qty) - (costBasisPerUnit × qty) - fees
  costBasisPerUnit: number; // Snapshot of avg cost at sale time
  notes?: string;
  createdAt: number;
  syncVersion: number;
  syncedAt?: number;
  deleted?: boolean;
  deletedAt?: number | null;
}
```

**CapitalTransaction** — Deposit, withdrawal, or fee flow.

```typescript
export type CapitalTransactionType =
  | "pay-in" // Deposit capital
  | "withdraw" // Withdraw capital
  | "buy-deduction" // Fee deducted on buy
  | "sell-credit"; // Proceeds credited on sell

interface CapitalTransaction {
  id: string; // UUID
  type: CapitalTransactionType;
  amount: number; // Always positive; sign derived from type
  currency: CurrencyCode; // Transaction currency
  baseCurrencyAmount: number; // Server-side FX-converted to portfolio base
  referenceId?: string; // entryId if auto-linked (buy-deduction/sell-credit)
  notes?: string;
  date: number; // Unix timestamp seconds
  createdAt: number;
  syncVersion: number;
  syncedAt?: number;
  deleted?: boolean;
  deletedAt?: number | null;
}
```

**CapitalSummary** — Aggregated capital metrics.

```typescript
interface CapitalSummary {
  baseCurrency: CurrencyCode;
  totalPayIn: number;
  totalWithdraw: number;
  totalBuyDeduction: number;
  totalSellCredit: number;
  // Computed
  availableCapital: number; // payIn - withdraw - buyDeduction + sellCredit
  totalInvested: number; // Sum of current positions' totalCost
  netCapitalFlow: number; // payIn - withdraw
}
```

## Storage Schema

### Dexie.js (IndexedDB v3)

```typescript
class FinCatchDatabase extends Dexie {
  portfolios!: EntityTable<Portfolio, "id">;
  portfolioEntries!: EntityTable<PortfolioEntry, "id">;
  couponPayments!: EntityTable<BondCouponPayment, "id">;
  sellTransactions!: EntityTable<SellTransaction, "id">;
  capitalTransactions!: EntityTable<CapitalTransaction, "id">;
  _syncMeta!: Table<SyncMeta, string>;
  _pendingChanges!: Table<PendingChange, number>;
}
```

**Dexie.js v3 indexes:**

```typescript
this.version(3).stores({
  portfolios: "id, createdAt, syncVersion, syncedAt, deleted",
  portfolioEntries:
    "id, portfolioId, assetType, symbol, createdAt, syncVersion, syncedAt, deleted",
  couponPayments: "id, entryId, paymentDate, syncVersion, syncedAt, deleted",
  sellTransactions:
    "id, entryId, portfolioId, sellDate, syncVersion, syncedAt, deleted",
  capitalTransactions:
    "id, type, date, referenceId, syncVersion, syncedAt, deleted",
  _syncMeta: "key",
  _pendingChanges: "++id, tableName, rowId",
});
```

**Primary keys:** All entity tables use `id` (UUID) as primary key. Auto-increment provided for migration only.

**Soft delete:** Records marked `deleted=true` with `deletedAt` timestamp. Server purges after 60-day TTL. Sync engine propagates deletions to remote.

## Service Layer

### Interfaces

All services defined in `packages/ui/src/adapters/factory/interfaces/`:

**IPortfolioService**
- `createPortfolio(p: Portfolio): Promise<string>`
- `listPortfolios(): Promise<Portfolio[]>`
- `getPortfolio(id: string): Promise<Portfolio | undefined>`
- `updatePortfolio(p: Portfolio): Promise<void>`
- `deletePortfolio(id: string): Promise<void>`

**IPortfolioEntryService**
- `createEntry(e: PortfolioEntry): Promise<string>`
- `listEntries(portfolioId: string): Promise<PortfolioEntry[]>`
- `getEntry(id: string): Promise<PortfolioEntry | undefined>`
- `updateEntry(e: PortfolioEntry): Promise<void>`
- `deleteEntry(id: string): Promise<void>`

**ICouponPaymentService**
- `createCouponPayment(cp: BondCouponPayment): Promise<string>`
- `listByEntry(entryId: string): Promise<BondCouponPayment[]>`
- `deleteCouponPayment(id: string): Promise<void>`

**ISellTransactionService** (Phase 01)
- `createSellTransaction(tx: SellTransaction): Promise<string>`
- `listByEntry(entryId: string): Promise<SellTransaction[]>`
- `listByPortfolio(portfolioId: string): Promise<SellTransaction[]>`
- `deleteSellTransaction(id: string): Promise<void>`

**ICapitalService** (Phase 01)
- `createCapitalTransaction(tx: CapitalTransaction): Promise<string>`
- `listCapitalTransactions(): Promise<CapitalTransaction[]>`
- `deleteCapitalTransaction(id: string): Promise<void>`

### Adapters

All adapters in `packages/ui/src/adapters/`:

**IndexedDB Adapters** (`web/`)
- `IndexedDBPortfolioAdapter`
- `IndexedDBPortfolioEntryAdapter`
- `IndexedDBCouponPaymentAdapter`
- `IndexedDBSellTransactionAdapter` (Phase 01)
- `IndexedDBCapitalAdapter` (Phase 01)

Query pattern: All adapters use Dexie's `.where()` API for efficient filtering.

```typescript
// Example: List sell transactions by entry
async listByEntry(entryId: string): Promise<SellTransaction[]> {
  return db.sellTransactions
    .where("entryId")
    .equals(entryId)
    .filter(tx => !tx.deleted)
    .toArray();
}
```

**Shared Adapters** (`shared/`)
- `QmServerAuthAdapter` — Authentication + token refresh
- `QmServerDataAdapter` — Market data API calls
- `IndexedDBSyncAdapter` — Checkpoint-based sync coordination

### ServiceFactory

Lazy singleton pattern — services instantiated once per app session.

```typescript
class ServiceFactory {
  private static portfolioService: IPortfolioService | null = null;
  private static sellTransactionService: ISellTransactionService | null = null;
  private static capitalService: ICapitalService | null = null;
  // ...

  static getPortfolioService(): IPortfolioService {
    if (!this.portfolioService) {
      this.portfolioService = new IndexedDBPortfolioAdapter(db);
    }
    return this.portfolioService;
  }

  static getSellTransactionService(): ISellTransactionService {
    if (!this.sellTransactionService) {
      this.sellTransactionService = new IndexedDBSellTransactionAdapter(db);
    }
    return this.sellTransactionService;
  }

  static getCapitalService(): ICapitalService {
    if (!this.capitalService) {
      this.capitalService = new IndexedDBCapitalAdapter(db);
    }
    return this.capitalService;
  }
}
```

**Setter methods** for testing (dependency injection):

```typescript
static setPortfolioService(service: IPortfolioService) {
  this.portfolioService = service;
}
```

### Convenience Wrappers

`packages/ui/src/services/index.ts` exports wrapper functions that delegate to ServiceFactory:

```typescript
export const getPortfolioService = () =>
  ServiceFactory.getPortfolioService();

export const getSellTransactionService = () =>
  ServiceFactory.getSellTransactionService();

export const createSellTransaction = (tx: SellTransaction) =>
  ServiceFactory.getSellTransactionService().createSellTransaction(tx);
```

Components import via:

```typescript
import {
  getSellTransactionService,
  getCapitalService,
} from "@fin-catch/ui/services";
```

## Sync Protocol

### Push Phase

1. Component calls service to create/update/delete record
2. Adapter writes to IndexedDB + inserts `_pendingChanges` entry
3. On sync trigger (manual or periodic):
   - IndexedDBSyncAdapter reads all `_pendingChanges`
   - Batches by table name, sends POST `/sync/{appId}/push`
   - Server applies mutations (server-wins conflict resolution)
   - Returns `{ accepted: [{ rowId, syncVersion }], conflicts: [] }`
   - Adapter clears matched `_pendingChanges` entries

### Pull Phase

1. IndexedDBSyncAdapter reads `_syncMeta` checkpoint for each table
2. Sends GET `/sync/{appId}/pull?since={timestamp}`
3. Server returns paginated `{ changes: [...], checkpoint }`
4. Adapter upserts all changes into local tables
5. Updates `_syncMeta` with new checkpoint
6. Repeats until no changes remain

### Conflict Resolution

- **Strategy:** Server-wins. `syncVersion` on every record prevents duplicates.
- **Client UUIDs:** Records created offline use client-generated UUIDs — no ID collisions on sync.
- **Soft delete TTL:** Server auto-purges deleted records after 60 days.

## Performance Metrics

### EntryPerformance

```typescript
interface EntryPerformance {
  entry: PortfolioEntry;
  currentPrice: number;
  purchasePrice?: number;
  currentValue: number;
  totalCost: number;
  gainLoss: number; // Unrealized (current - cost)
  gainLossPercentage: number;
  realizedGainLoss: number; // From all SellTransaction records (Phase 01)
  priceSource: string;
  currency: CurrencyCode;
  exchangeRate?: number;
}
```

**Computation:**

- `currentValue = currentPrice × quantity` (in display currency)
- `totalCost = purchasePrice × quantity + transactionFees` (in entry currency)
- `gainLoss = currentValue - totalCost` (unrealized)
- `realizedGainLoss` = Sum of all sell transactions' `realizedGainLoss` for this entry

### PortfolioPerformance

```typescript
interface PortfolioPerformance {
  totalValue: number; // Sum of all entry values
  totalCost: number; // Sum of all entry costs
  totalGainLoss: number; // Sum of unrealized gains
  totalGainLossPercentage: number;
  totalRealizedGainLoss: number; // Sum of all realized gains (Phase 01)
  currency: CurrencyCode;
  entriesPerformance: EntryPerformance[];
}
```

## Constraints & Validations

### Required Fields

- All entities require: `id`, `createdAt`, `syncVersion`
- All entities optional: `syncedAt`, `deleted`, `deletedAt`
- PortfolioEntry requires: `portfolioId`, `assetType`, `symbol`, `quantity`, `purchasePrice`, `purchaseDate`
- SellTransaction requires: `entryId`, `portfolioId`, `sellPrice`, `quantity`, `sellDate`, `fees`, `currency`, `realizedGainLoss`, `costBasisPerUnit`
- CapitalTransaction requires: `type`, `amount`, `currency`, `baseCurrencyAmount`, `date`

### FK Constraints

- `PortfolioEntry.portfolioId` must reference existing `Portfolio.id`
- `BondCouponPayment.entryId` must reference existing `PortfolioEntry.id`
- `SellTransaction.entryId` must reference existing `PortfolioEntry.id`
- `SellTransaction.portfolioId` must reference existing `Portfolio.id`
- `CapitalTransaction.referenceId` (if set) must reference existing `PortfolioEntry.id`

**Note:** Dexie.js does NOT enforce FKs at the client level — validation deferred to server on sync push. Soft-delete cascades: parent deleted does NOT auto-delete children. UI responsible for orphan handling.

## Type Exports

All types exported from `@fin-catch/shared`:

```typescript
export {
  Portfolio,
  PortfolioEntry,
  BondCouponPayment,
  SellTransaction,
  CapitalTransaction,
  CapitalTransactionType,
  CapitalSummary,
  PortfolioPerformance,
  EntryPerformance,
  // ... other computed types
} from "@fin-catch/shared";
```

Components import domain types from `@fin-catch/shared` (no React dependency).

## Future Extensions

- **Phase 02:** UI forms for sell transactions & capital tracker dashboard
- **Dividend tracking:** `DividendPayment` table for income events
- **Cost basis methods:** Support FIFO / LIFO / weighted average cost selection
- **Multi-currency:** Portfolio valuation in different base currencies with FX snapshots
