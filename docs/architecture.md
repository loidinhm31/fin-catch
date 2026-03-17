# fin-catch Architecture

## Overview

fin-catch is an offline-first portfolio tracker for Vietnamese financial markets (stocks, gold, bonds, crypto, cash). Built as an embeddable React app with platform-agnostic storage via IndexedDB/Dexie.js, it syncs to qm-hub-server using checkpoint-based pagination. Supports standalone (web/Tauri desktop) and embedded mode (inside qm-hub-app via Shadow DOM).

```mermaid
C4Context
    title fin-catch System Context

    Person(user, "Investor", "Tracks portfolios, monitors prices, places trades")

    System(finCatch, "fin-catch", "Offline-first portfolio tracker")

    System_Ext(qmHub, "qm-hub-server", "Axum API: sync, auth, market data, alerts")
    System_Ext(qmHubApp, "qm-hub-app", "Admin panel host (Shadow DOM embed)")
    System_Ext(dnse, "DNSE", "VN stock trading platform")
    System_Ext(marketSources, "Market Sources", "VNDirect, SSI, Yahoo Finance, SJC")

    Rel(user, finCatch, "Manages portfolios, views data")
    Rel(finCatch, qmHub, "Sync, auth, market data, alerts", "HTTPS/SSE")
    Rel(qmHubApp, finCatch, "Embeds via Shadow DOM + token SSO")
    Rel(qmHub, marketSources, "Fetches prices")
    Rel(finCatch, dnse, "Trading orders via qm-hub proxy")
```

## Monorepo Structure

```
fin-catch/
├── apps/
│   ├── web/              # Vite SPA (port 25095)
│   └── native/           # Tauri v2 desktop
├── packages/
│   ├── shared/           # Types, constants (no React)
│   ├── ui/               # Components, hooks, adapters, stores
│   ├── tsconfig/         # Shared TS configs
│   └── eslint-config/    # Shared lint rules
├── turbo.json            # Turborepo task graph
└── fin-catch-app-schema.json  # Server sync table definitions
```

## Platform Adapter Architecture

All business logic lives in `packages/ui`. Platform differences are abstracted behind service interfaces, resolved at boot via `ServiceFactory`.

```mermaid
flowchart TB
    subgraph UI["packages/ui"]
        Components[React Components]
        Hooks[Custom Hooks]
        SF[ServiceFactory]
    end

    subgraph Interfaces["Service Interfaces"]
        IP[IPortfolioService]
        IPE[IPortfolioEntryService]
        ICP[ICouponPaymentService]
        IST[ISellTransactionService]
        ICS[ICapitalService]
        IAuth[IAuthService]
        IData[IDataService]
        ISync[ISyncService]
        ITrade[ITradingAuthService]
        IMkt[IMarketDataService]
    end

    subgraph WebAdapters["Web / Shared Adapters"]
        IDBP[IndexedDBPortfolioAdapter]
        IDBE[IndexedDBPortfolioEntryAdapter]
        IDBC[IndexedDBCouponPaymentAdapter]
        IDBST[IndexedDBSellTransactionAdapter]
        IDBCS[IndexedDBCapitalAdapter]
        QmAuth[QmServerAuthAdapter]
        QmData[QmServerDataAdapter]
        IDBSync[IndexedDBSyncAdapter]
        TrdAuth[TradingAuthAdapter]
        MktData[MarketDataAdapter]
    end

    subgraph TauriAdapters["Tauri-only"]
        TauriData[TauriDataAdapter]
    end

    subgraph Storage["Storage Layer"]
        IDB[(IndexedDB / Dexie.js)]
        HTTP[qm-hub-server APIs]
        SSE[SSE / MQTT Streams]
    end

    Components --> Hooks
    Hooks --> SF
    SF --> Interfaces

    IP --> IDBP
    IPE --> IDBE
    ICP --> IDBC
    IST --> IDBST
    ICS --> IDBCS
    IAuth --> QmAuth
    IData --> QmData
    IData -.-> TauriData
    ISync --> IDBSync
    ITrade --> TrdAuth
    IMkt --> MktData

    IDBP --> IDB
    IDBE --> IDB
    IDBC --> IDB
    IDBST --> IDB
    IDBCS --> IDB
    IDBSync --> IDB
    QmAuth --> HTTP
    QmData --> HTTP
    TrdAuth --> HTTP
    MktData --> SSE
    TauriData -.-> HTTP

    classDef storage fill:#e1f5fe
    classDef adapter fill:#c8e6c9
    classDef tauri fill:#fff3e0
    class IDB,HTTP,SSE storage
    class IDBP,IDBE,IDBC,IDBST,IDBCS,QmAuth,QmData,IDBSync,TrdAuth,MktData adapter
    class TauriData tauri
```

**Key decisions:**

1. **Unified storage:** Both web and Tauri use IndexedDB (Dexie.js) — no SQLite. Eliminates platform-specific storage bugs.
2. **Platform-specific data:** Only `IDataService` differs — Tauri uses native IPC for market data; web uses HTTP adapters.
3. **Sell transactions & capital tracking (Phase 01):** Realized gain/loss computed at exit time, capital flows tracked separately to enable capital growth analysis independent of market fluctuations.

## Domain Model

```mermaid
erDiagram
    Portfolio ||--o{ PortfolioEntry : "has many"
    PortfolioEntry ||--o{ BondCouponPayment : "bond entries have"
    PortfolioEntry ||--o{ SellTransaction : "entry can be sold"
    Portfolio ||--o{ SellTransaction : "tracks sales"
    Portfolio ||--o{ CapitalTransaction : "tracks flows"

    Portfolio {
        string id PK "UUID"
        string name
        string description
        string baseCurrency
        number createdAt
        number syncVersion
        number syncedAt
        boolean deleted
        number deletedAt
    }

    PortfolioEntry {
        string id PK "UUID"
        string portfolioId FK
        string assetType "stock|gold|bond|cash|crypto"
        string symbol
        number quantity
        number purchasePrice
        string currency
        number purchaseDate
        string notes
        string tags
        number transactionFees
        string source
        number createdAt
        string unit "gold: gram|mace|tael|ounce|kg"
        string goldType "gold: SJC type ID"
        number faceValue "bond"
        number couponRate "bond"
        number maturityDate "bond"
        string couponFrequency "bond"
        number currentMarketPrice "bond"
        number ytm "bond"
        number targetPrice "alert"
        number stopLoss "alert"
        boolean alertEnabled "alert"
        number alertCount "alert: max 3"
        number syncVersion
        boolean deleted
    }

    BondCouponPayment {
        string id PK "UUID"
        string entryId FK
        number paymentDate
        number amount
        string currency
        string notes
        number createdAt
        number syncVersion
        boolean deleted
    }

    SellTransaction {
        string id PK "UUID"
        string entryId FK "entry sold"
        string portfolioId FK "portfolio context"
        number sellPrice "per-unit price"
        number quantity "units sold"
        number sellDate "Unix timestamp"
        number fees "transaction costs"
        string currency "sale currency"
        number realizedGainLoss "profit/loss on exit"
        number costBasisPerUnit "avg cost snapshot"
        string notes "optional memo"
        number createdAt
        number syncVersion
        boolean deleted
    }

    CapitalTransaction {
        string id PK "UUID"
        string type "pay-in|withdraw|buy-deduction|sell-credit"
        number amount "always positive"
        string currency "transaction currency"
        number baseCurrencyAmount "FX-converted"
        string referenceId FK "entryId if linked"
        string notes "optional memo"
        number date "Unix timestamp"
        number createdAt
        number syncVersion
        boolean deleted
    }
```

**Asset types:** `stock` (VN market symbols), `gold` (SJC bars/rings with unit conversion), `bond` (face value + coupon tracking + YTM), `cash` (currency holdings), `crypto` (placeholder).

**Capital transaction types:**
- `pay-in` — Deposit capital into portfolio
- `withdraw` — Withdraw capital from portfolio
- `buy-deduction` — Deduction for buy operation (settlement fee)
- `sell-credit` — Credit received from sell operation

### Computed Models

| Model | Purpose | Source |
|-------|---------|--------|
| `PortfolioPerformance` | Total value, cost, gain/loss (unrealized + realized), per-entry breakdown | Aggregated from entries + live prices + sell transactions |
| `EntryPerformance` | Current price, value, unrealized + realized gain/loss %, exchange rate | Single entry + market data + sell transactions |
| `CapitalSummary` | Net capital flow, available capital, total invested | Aggregated from capital transactions |
| `AssetAllocation` | Symbol, type, value, percentage | Portfolio-wide pie chart data |
| `HoldingPerformance` | Normalized curve (base 100 at purchase) | Historical price data |

## Sync Architecture

Offline-first with checkpoint-based pagination. Five synced tables defined in `fin-catch-app-schema.json`: `portfolios`, `portfolioEntries`, `bondCouponPayments`, `sellTransactions`, `capitalTransactions`.

```mermaid
sequenceDiagram
    autonumber
    participant UI as React UI
    participant Adapter as IndexedDB Adapter
    participant IDB as IndexedDB
    participant Sync as IndexedDBSyncAdapter
    participant Server as qm-hub-server

    Note over UI,Server: Local Write (Offline-capable)
    UI->>Adapter: createEntry(entry) / createSellTx(tx)
    Adapter->>IDB: put(entry) + withSyncTracking()
    Adapter->>IDB: insert _pendingChanges

    Note over UI,Server: Sync Cycle (Manual or Periodic)
    UI->>Sync: syncNow()
    Sync->>IDB: read _pendingChanges
    Sync->>Server: POST /sync/{appId}/push (batch)
    Server-->>Sync: { accepted, conflicts[] }
    Note right of Server: Server-wins conflict resolution

    Sync->>Server: GET /sync/{appId}/pull?since={checkpoint}
    Server-->>Sync: { changes[], checkpoint }
    Sync->>IDB: upsert pulled changes
    Sync->>IDB: update _syncMeta (new checkpoint)
    Sync->>IDB: clear pushed _pendingChanges
    Sync-->>UI: SyncResult { pushed, pulled, conflicts }
```

### Sync Storage Schema (IndexedDB)

| Table | Purpose |
|-------|---------|
| `portfolios` | Domain data — portfolio metadata |
| `portfolioEntries` | Domain data — holdings (stock, gold, bond, etc.) |
| `bondCouponPayments` | Domain data — coupon income tracking |
| `sellTransactions` | Domain data — liquidity events + realized gain/loss (Phase 01) |
| `capitalTransactions` | Domain data — capital flows (deposits, withdrawals, fees) (Phase 01) |
| `_syncMeta` | Per-table `last_sync_timestamp` checkpoints |
| `_pendingChanges` | Queued local mutations (auto-increment ID, tableName, rowId, operation, data, version) |

**Dexie.js indexes** (v3 schema):
- `sellTransactions`: `id, entryId, portfolioId, sellDate, syncVersion, syncedAt, deleted`
- `capitalTransactions`: `id, type, date, referenceId, syncVersion, syncedAt, deleted`

### Conflict Resolution

- **Strategy:** Server-wins (default). `syncVersion` field on every record.
- **Soft delete:** `deleted=true` + `deletedAt` timestamp. Server purges after 60 days TTL.
- **Client UUIDs:** Records created offline with client-generated UUIDs — no ID collisions on sync.

### Auth Token Flow in Sync

```mermaid
flowchart LR
    subgraph AuthService["QmServerAuthAdapter (singleton)"]
        AT[Access Token]
        RT[Refresh Token]
        RP[refreshPromise dedup]
    end

    subgraph SyncAdapter["IndexedDBSyncAdapter"]
        TP[TokenProvider fn]
        QSC[QmSyncClient]
    end

    TP -->|reads| AT
    QSC -->|uses| TP
    QSC -->|on 401| RP
    RP -->|refreshed| AT
    RP -->|saves via| EXT[saveTokensExternal]

    classDef auth fill:#fff3e0
    class AT,RT,RP auth
```

Token refresh is deduplicated — concurrent 401s share a single refresh promise. Sync adapter skips retry on 401/403 (prevents auth lockout loops).

## Data Flow

```mermaid
flowchart TB
    subgraph Presentation["UI Layer"]
        Pages[Pages<br/>Portfolio, Financial, Trading, Settings]
        Organisms[Organisms<br/>Holdings, Charts, Forms, Dialogs]
        Molecules[Molecules<br/>TabNavigator, SyncStatus, DateRange]
        Atoms[Atoms<br/>Button, Input, Badge, Card]
    end

    subgraph Logic["Logic Layer"]
        Hooks[Custom Hooks<br/>usePortfolios, useAuth, useSyncStatus,<br/>usePortfolioPerformance, useCurrencyPreference]
        Platform[PlatformContext<br/>React Context providing all services]
    end

    subgraph Services["Service Layer"]
        SF[ServiceFactory<br/>Lazy singleton getters/setters]
        Adapters[Adapters<br/>IndexedDB*, QmServer*, Trading*, MarketData*]
    end

    subgraph Storage["Storage"]
        IDB[(IndexedDB)]
        Remote[qm-hub-server]
    end

    Pages --> Organisms --> Molecules --> Atoms
    Organisms --> Hooks
    Hooks --> Platform --> SF --> Adapters
    Adapters --> IDB
    Adapters --> Remote

    classDef ui fill:#e8eaf6
    classDef logic fill:#f3e5f5
    classDef service fill:#c8e6c9
    classDef store fill:#e1f5fe
    class Pages,Organisms,Molecules,Atoms ui
    class Hooks,Platform logic
    class SF,Adapters service
    class IDB,Remote store
```

## Routing & Embedding

### Route Map

| Path | Page | Auth Required |
|------|------|---------------|
| `/` | LoginPage | No |
| `/portfolio` | PortfolioPage | Yes |
| `/financial-data` | FinancialDataPage | Yes |
| `/settings` | SettingsPage | Yes |
| `/trading` | TradingPage | Yes |
| `/trading-operations` | TradingOperationsPage | Yes |

All pages lazy-loaded via `React.lazy()`.

### Embedded Mode

```mermaid
flowchart TB
    subgraph QmHubApp["qm-hub-app (Host)"]
        BR[BrowserRouter]
        SW[ShadowWrapper]
        TokenStore[localStorage tokens]
    end

    subgraph FinCatch["fin-catch (Embedded)"]
        FCA[FinCatchApp]
        BPC[BasePathContext]
        AppShell[AppShell]
    end

    BR -->|shared router| FCA
    TokenStore -->|authTokens prop| FCA
    SW -->|Shadow DOM isolation| FCA
    FCA -->|useRouter=false| BPC
    BPC -->|basePath=/fin-catch| AppShell
    AppShell -->|skipAuth=true| Pages[Lazy Pages]

    classDef host fill:#fff3e0
    classDef embed fill:#e8eaf6
    class BR,SW,TokenStore host
    class FCA,BPC,AppShell,Pages embed
```

**Embed props:**
- `embedded=true` — hides Sidebar/BottomNav
- `useRouter=false` — shares parent's BrowserRouter
- `basePath="/fin-catch"` — prefixes all routes
- `authTokens` — SSO via parent's JWT tokens
- `onLogoutRequest` — delegates logout to parent

**Logout flow:** Parent dispatches `window.dispatchEvent(new Event('auth:logout'))` → fin-catch hooks clear local state → re-mount with login screen.

## Market Data & Trading

```mermaid
flowchart LR
    subgraph Sources["Data Sources (via qm-hub-server)"]
        VND[VNDirect]
        SSI[SSI]
        Yahoo[Yahoo Finance]
        SJC[SJC Gold]
    end

    subgraph Server["qm-hub-server"]
        FCD[fin-catch-data plugin<br/>Historical prices, gold, FX]
        FCM[fin-catch-monitor plugin<br/>Price alerts]
        FTP[trading-platform plugin<br/>DNSE proxy]
        MQ[MQTT/SSE<br/>Real-time streaming]
    end

    subgraph Client["fin-catch Client"]
        QmData[QmServerDataAdapter<br/>Historical data]
        MktData[MarketDataAdapter<br/>Real-time SSE]
        TrdAuth[TradingAuthAdapter<br/>DNSE trading]
    end

    Sources --> FCD
    Sources --> MQ
    FCD --> QmData
    MQ --> MktData
    FTP --> TrdAuth
    FCM -->|alerts via SSE| MktData

    classDef source fill:#e1f5fe
    classDef server fill:#c8e6c9
    classDef client fill:#f3e5f5
    class VND,SSI,Yahoo,SJC source
    class FCD,FCM,FTP,MQ server
    class QmData,MktData,TrdAuth client
```

### Price Alert Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Disabled: Entry created (alertEnabled=false)
    Disabled --> Armed: User sets targetPrice/stopLoss + enables
    Armed --> Triggered: Server detects price breach
    Triggered --> Armed: alertCount < 3
    Triggered --> AutoDisabled: alertCount >= 3
    Armed --> Disabled: User disables
    AutoDisabled --> Armed: User re-enables + resets count
```

Alerts stored on `PortfolioEntry` fields. Server-side `qm-fin-catch-monitor` polls prices, fires notifications via `qm-notification`, sends SSE events to client as toast notifications.

## Testing Strategy

| Layer | Tool | Pattern |
|-------|------|---------|
| Adapters | Vitest + jsdom | Mock fetch, test adapter logic in isolation |
| Sync | Vitest | Mock IndexedDB storage, test retry/backoff/conflict |
| Auth | Vitest | Mock HTTP, test token refresh dedup + race conditions |

```bash
pnpm test:run    # Single run (CI)
pnpm test        # Watch mode (dev)
```

Test files:
- `adapters/shared/QmServerAuthAdapter.test.ts`
- `adapters/web/sync/IndexedDBSyncAdapter.test.ts`
- `adapters/web/sync/IndexedDBSyncStorage.test.ts`

## Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `dexie` | 4.3.0 | IndexedDB abstraction |
| `recharts` | 3.7.0 | Charts (candlestick, pie, line) |
| `react-hook-form` | 7.71.1 | Form state |
| `framer-motion` | 12.34.0 | Animations |
| `@radix-ui/*` | latest | Accessible UI primitives |
| `@tauri-apps/api` | 2.10.1 | Desktop IPC |
| `@qm-hub/sync-client-types` | 0.2.2 | Sync protocol types |
| `tailwindcss` | 4.1.18 | Styling (v4 + Vite plugin) |

## Build & Deploy

```bash
pnpm dev:web       # Dev server (port 25095)
pnpm dev:tauri     # Tauri desktop dev
pnpm build         # Production build (all workspaces)
pnpm lint          # ESLint
pnpm format        # Prettier
```

Web build outputs to `apps/web/dist/`. Tauri produces native bundles per platform.
