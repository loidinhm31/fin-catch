# fin-catch Codebase Summary

## Repository Overview

fin-catch is a **Turborepo monorepo** with 4 packages managed by pnpm 9.1.0. Total codebase: ~29.7K lines of TypeScript across packages/ui, packages/shared, and app entrypoints.

## Monorepo Structure

```
fin-catch/
├── apps/
│   ├── web/                   # Standalone Vite SPA (port 25095)
│   │   ├── src/App.tsx       # 15 LOC — router setup, platform context
│   │   ├── src/main.tsx      # Entry point with React mount
│   │   ├── index.html        # HTML template
│   │   └── vite.config.ts    # Tailwind v4, React plugin
│   │
│   └── native/                # Tauri v2 desktop shell
│       ├── src-tauri/        # Rust backend (131 LOC)
│       │   ├── main.rs       # App state, IPC command handler
│       │   └── lib.rs        # 124 LOC — init, platform setup
│       ├── src/App.tsx       # 7 LOC — minimal webview wrapper
│       └── tauri.conf.json   # Desktop config, update endpoints
│
├── packages/
│   ├── ui/                    # ~27.5K LOC — bulk of app code
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── atoms/    # 29 files — Button, Input, Card, Badge, Icon, etc.
│   │   │   │   ├── molecules/# 21 files — Form components, pickers, selectors
│   │   │   │   ├── organisms/# 33 files — Charts, modals, holdings, order forms
│   │   │   │   ├── pages/    # 6 files — LoginPage, PortfolioPage, TradingPage, etc.
│   │   │   │   └── templates/# 1 file — AppShell (layout + routing)
│   │   │   ├── adapters/     # Service implementations & DI
│   │   │   │   ├── factory/  # ServiceFactory + interface defs
│   │   │   │   ├── shared/   # QmServerAuthAdapter (210 LOC), QmServerDataAdapter (210 LOC)
│   │   │   │   ├── web/      # IndexedDB adapters, sync logic
│   │   │   │   └── tauri/    # TauriDataAdapter for native IPC (133 LOC)
│   │   │   ├── hooks/        # Custom React hooks (~400 LOC total)
│   │   │   │   ├── useAuth (96 LOC)
│   │   │   │   ├── usePortfolios (82 LOC)
│   │   │   │   ├── usePortfolioPerformance (48 LOC)
│   │   │   │   ├── useCurrencyPreference (20 LOC)
│   │   │   │   └── useFrozenPrice (64 LOC)
│   │   │   ├── platform/     # PlatformContext (71 LOC)
│   │   │   ├── embed/        # FinCatchApp export for qm-hub-app
│   │   │   ├── styles/       # global.css (42KB)
│   │   │   ├── utils/        # Utility functions (~500 LOC)
│   │   │   └── stores/       # Service getters (singleton pattern)
│   │   ├── DESIGN_SYSTEM.md  # 600+ LOC — color palette, typography, component specs
│   │   ├── README.md         # Library exports
│   │   └── package.json
│   │
│   ├── shared/                # ~2K LOC — types, utilities
│   │   ├── src/
│   │   │   ├── types/
│   │   │   │   ├── api.ts           # API response types
│   │   │   │   ├── auth.ts          # Auth request/response
│   │   │   │   ├── form.ts          # Form validation schemas
│   │   │   │   ├── market-data.ts   # SSE message types (327 LOC)
│   │   │   │   ├── trading.ts       # DNSE types (286 LOC)
│   │   │   │   ├── holdings.ts      # Portfolio types
│   │   │   │   ├── benchmark.ts     # Benchmark comparison (235 LOC)
│   │   │   │   └── sync.ts          # Sync protocol types
│   │   │   ├── utils/
│   │   │   │   ├── cn.ts            # Classname utility
│   │   │   │   ├── goldConversions.ts # Unit conversion (gram/mace/tael/kg/oz)
│   │   │   │   ├── dateUtils.ts
│   │   │   │   ├── currency.ts      # FX cache, VND middleware (242 LOC)
│   │   │   │   ├── chartUtils.ts    # Responsive tick density (81 LOC)
│   │   │   │   ├── holdings.ts      # Normalized curves (216 LOC)
│   │   │   │   ├── benchmark.ts     # VS benchmark (235 LOC)
│   │   │   │   └── logger.ts
│   │   │   └── constants/    # App constants
│   │   └── package.json
│   │
│   ├── tsconfig/              # Shared TypeScript configs
│   └── eslint-config/         # ESLint rules
│
├── fin-catch-app-schema.json  # Server sync schema (3 tables)
├── package.json               # Workspace root + build scripts
├── turbo.json                 # Build task definitions
├── pnpm-workspace.yaml        # Workspace config
└── vitest.config.ts           # Test runner config
```

## Package Breakdown by Size

| Package | Files | Est. LOC | Key Contents |
|---------|-------|----------|--------------|
| `packages/ui` | 162 | 27,500 | Components (90), adapters, hooks, platform, embed |
| `packages/shared` | 20 | 2,200 | Types (7 files), utils (9 files), constants |
| `apps/web` | 8 | 150 | SPA shell, Vite config, HTML |
| `apps/native` | 6 | 150 | Tauri shell, Rust backend, config |
| **Total** | ~200 | ~29,700 | |

## Key Files by Role

### Service Layer & DI

| File | LOC | Purpose |
|------|-----|---------|
| `adapters/factory/ServiceFactory.ts` | 237 | Lazy singleton getters; `isTauri()` detection; setter DI |
| `adapters/factory/interfaces/*.ts` | 150+ | IPortfolioService, IAuthService, etc. |
| `adapters/shared/QmServerAuthAdapter.ts` | 210 | HTTP auth, token refresh dedup, localStorage |
| `adapters/shared/QmServerDataAdapter.ts` | 210 | Fetch stock/gold/FX data from qm-hub-server |
| `adapters/tauri/TauriDataAdapter.ts` | 133 | IPC to native fin-catch-data plugin |
| `adapters/web/sync/IndexedDBSyncAdapter.ts` | 300+ | Checkpoint sync, conflict resolution, retry backoff |
| `platform/PlatformContext.tsx` | 71 | React context wrapping all services |

### Domain Logic & Utilities

| File | LOC | Purpose |
|------|-----|---------|
| `utils/holdings.ts` | 216 | Normalized performance curves (base 100) |
| `utils/benchmark.ts` | 235 | Portfolio vs benchmark comparison |
| `utils/currency.ts` | 242 | FX rate caching, VND middleware, 9 currencies |
| `utils/chartUtils.ts` | 81 | Responsive tick density calculation |
| `types/market-data.ts` | 327 | SSE message types, resolution enums |
| `types/trading.ts` | 286 | DNSE session, orders, deals, position types |
| `types/holdings.ts` | 100+ | Portfolio, entry, coupon payment types |

### Hooks (Custom Reactive Logic)

| Hook | LOC | Purpose |
|------|-----|---------|
| `useAuth.ts` | 96 | Login/logout, token refresh, concurrent check dedup |
| `usePortfolios.ts` | 82 | CRUD portfolio list + auto-reload |
| `usePortfolioPerformance.ts` | 48 | Calculate portfolio metrics (value, gain/loss) |
| `useCurrencyPreference.ts` | 20 | localStorage persistence, default USD |
| `useFrozenPrice.ts` | 64 | Price snapshot capture for order forms |

### UI Components (Atomic Design)

| Level | Count | Examples |
|-------|-------|----------|
| **Atoms** | 29 | Button, Input, Badge, Card, Icon, Spinner, Divider, Modal, Alert, Select, Popover, Dialog, Drawer, Skeleton, Toast, Tooltip, Dropdown |
| **Molecules** | 21 | FormField, DateRangePicker, TabNavigator, SyncStatus, CurrencySelect, PriceInput, SymbolSearch, AssetTypeSelect, DateInput, NumberInput |
| **Organisms** | 33 | Holdings (303 LOC), OrderForm (605 LOC), CreatePortfolioModal (177 LOC), AddEditEntryModal (759 LOC), Charts (candlestick, pie, line), PortfolioForm, AssetAllocationChart, PerformanceChart, PriceAlert, AccountPanel, PositionsList, TradeHistory, OrderHistory |
| **Pages** | 6 | LoginPage (435 LOC), PortfolioPage (342 LOC), FinancialDataPage (805 LOC), TradingPage (190 LOC), TradingOperationsPage (642 LOC), SettingsPage (178 LOC) |
| **Templates** | 1 | AppShell (189 LOC) — lazy-loaded routes, sidebar/bottom-nav responsive, sync status |

### Pages Detail

| Page | LOC | Purpose |
|------|-----|---------|
| LoginPage | 435 | Email + password form, JWT token handling |
| PortfolioPage | 342 | Portfolio list + entry list (add/edit/delete), performance summary |
| FinancialDataPage | 805 | Market data browser: stocks, FX, gold, bonds |
| TradingPage | 190 | DNSE order entry, account info |
| TradingOperationsPage | 642 | Order/deal history, position monitoring, P&L |
| SettingsPage | 178 | Auth, sync status, theme, currency preference |

### Tauri Rust Backend

| File | LOC | Purpose |
|------|-----|---------|
| `main.rs` | 7 | App setup, IPC command setup |
| `lib.rs` | 124 | AppState (Arc<DataSourceGateway>), IPC handlers: `fetch_stock_history`, `fetch_gold_price`, `fetch_gold_premium`, `fetch_exchange_rate`, `fetch_currencies`, `check_market_status`, `fetch_vnd_to_fiat_rates` |

## Testing

| File | Type | Purpose |
|------|------|---------|
| `adapters/shared/QmServerAuthAdapter.test.ts` | Vitest | Auth refresh dedup, concurrent 401 handling |
| `adapters/web/sync/IndexedDBSyncAdapter.test.ts` | Vitest | Sync retry logic, backoff, conflict resolution |
| `adapters/web/sync/IndexedDBSyncStorage.test.ts` | Vitest | Pull record validation, sync metadata mgmt |
| `vitest.setup.ts` | Config | Mocks: localStorage, fetch, import.meta.env |
| **Summary** | 3 files | ~500 LOC total; all green |

## Critical Dependencies

| Package | Version | Purpose | Notes |
|---------|---------|---------|-------|
| `dexie` | 4.3.0 | IndexedDB abstraction | Both web & Tauri |
| `recharts` | 3.7.0 | Charts (candlestick, pie, line, area) | Responsive |
| `react-hook-form` | 7.71.1 | Form state management | Integrates with Zod validation |
| `framer-motion` | 12.34.0 | Animations | Portal modals, transitions |
| `@radix-ui/*` | latest | Unstyled accessible primitives | 15+ Radix packages |
| `@tauri-apps/api` | 2.10.1 | Desktop IPC | Windows, macOS, Linux |
| `@qm-hub/sync-client-types` | 0.2.2 | Sync protocol types | From qm-core-engine |
| `tailwindcss` | 4.1.18 | CSS (v4 + Vite plugin) | No PostCSS |
| `axios` | latest | HTTP client | Shared between adapters |
| `zod` | latest | Form validation | Schemas in packages/shared |

## Architecture Patterns

### 1. Adapter Pattern (Dependency Injection)

All services behind interfaces; implementations injected at boot:

```
ServiceFactory.getAuthService() → QmServerAuthAdapter (web) | TauriAuthAdapter (future)
ServiceFactory.getDataService() → QmServerDataAdapter (web) | TauriDataAdapter (Tauri)
ServiceFactory.getSyncService() → IndexedDBSyncAdapter (both)
```

### 2. Platform Context (React Context)

Single top-level context providing all services to subtree:

```tsx
<PlatformContextProvider services={serviceFactory}>
  <AppShell />
</PlatformContextProvider>
```

### 3. IndexedDB Storage (Dexie.js)

```typescript
const db = new Dexie('fin-catch-db');
db.version(1).stores({
  portfolios: '&id',
  portfolioEntries: '&id, portfolioId',
  bondCouponPayments: '&id, entryId',
  _syncMeta: 'tableName',
  _pendingChanges: '++id, tableName'
});
```

### 4. Atomic Design Component Hierarchy

```
Atoms (basic elements)
  → Molecules (simple compositions)
    → Organisms (feature-complete units)
      → Pages (route-level sections)
        → Templates (layouts)
```

### 5. Custom Hooks (Reactive Logic)

- `useAuth()` — Token lifecycle
- `usePortfolios()` — List CRUD + auto-reload
- `useCurrencyPreference()` — localStorage sync
- All hooks are adapter-agnostic; use services from context

### 6. Async Error Handling (No Throws)

Pattern across adapters: Return error responses, don't throw.

```typescript
const syncResult = await syncAdapter.syncNow();
if (!syncResult.success) {
  return { error: syncResult.error };
}
```

## Code Statistics

- **Total TypeScript files**: 162
- **Component files** (*.tsx): 90
- **Total lines of code**: ~29.7K
- **Largest file**: FinancialDataPage.tsx (805 LOC)
- **Test files**: 3 (500 LOC)
- **Test coverage**: All adapters tested; auth & sync critical paths covered

## Development Workflow

### Commands

```bash
pnpm dev:web              # Start web dev server (port 25095)
pnpm dev:tauri            # Start Tauri dev mode (port 1420 Vite, webview)
pnpm build                # Build all workspaces (web + native)
pnpm test                 # Watch mode (Vitest)
pnpm test:run             # Single run
pnpm lint                 # ESLint all packages
pnpm format               # Prettier format
```

### Turbo Task Graph

- `dev` — Run dev servers
- `build` — Compile TypeScript + Vite bundles
- `lint` — ESLint all packages
- `test` — Vitest (watch mode)
- `clean` — Remove build artifacts

## Key Conventions

- **Path alias**: `@/*` → `./src/*` in apps; `@fin-catch/ui/*` → `packages/ui/src/*` in packages
- **Naming**: camelCase for database schema (matches server JSON)
- **Forms**: react-hook-form + Zod validation
- **Styling**: Tailwind v4 + CSS custom properties (no dark: variants)
- **State management**: ServiceFactory + React context (no Zustand)
- **Error handling**: Graceful fallback; return errors, don't throw
- **Security**: XSS-aware token storage (localStorage for web, encrypted store for Tauri)

## References

- [Project Overview & PDR](./project-overview-pdr.md) — Vision, requirements, roadmap
- [Architecture](./architecture.md) — System design, data flow, domain model
- [Design System](../packages/ui/DESIGN_SYSTEM.md) — Component specs, colors, typography
- [Code Standards](./code-standards.md) — Conventions & best practices
- [CLAUDE.md](../CLAUDE.md) — Quick start guide
