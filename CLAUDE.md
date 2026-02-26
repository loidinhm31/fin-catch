# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
pnpm dev:web              # Web dev server (port 25095)
pnpm dev:tauri            # Tauri desktop app (port 1420)
pnpm build                # Build all packages
pnpm lint                 # ESLint all packages
pnpm format               # Prettier format
pnpm test                 # Vitest watch mode
pnpm test:run             # Single test run
pnpm test:coverage        # Coverage report
pnpm test packages/ui/src/adapters/web/database.test.ts  # Run single test file
```

## Architecture

### Workspace Structure

```
apps/
  web/                    # Web app (Vite + React, port 25095)
  native/                 # Desktop app (Tauri v2 webview shell)
packages/
  ui/                     # Shared component library (atomic design)
  shared/                 # Shared types and utilities
  tsconfig/               # TypeScript configurations
  eslint-config/          # ESLint configurations
```

### Adapter Pattern (Platform Abstraction)

The app uses dependency injection for service implementations. All platforms use IndexedDB for local storage, with platform-specific optimizations for market data.

**Interfaces** (`packages/ui/src/adapters/factory/interfaces/`):

- `IPortfolioService`, `IPortfolioEntryService`, `ICouponPaymentService` - CRUD operations
- `IAuthService`, `IDataService`, `ISyncService` - Auth and sync
- `IMarketDataService`, `ITradingAuthService` - Trading features (optional)

**Implementations** (`packages/ui/src/adapters/`):

- `web/` - IndexedDB via Dexie.js for local storage (portfolios, entries, coupon payments)
- `shared/` - Server adapters (QmServerAuthAdapter, QmServerDataAdapter, MarketDataAdapter)
- `tauri/` - Native IPC adapter (TauriDataAdapter for fin-catch-data market data)

**ServiceFactory** (`adapters/factory/ServiceFactory.ts`):

- Lazy singleton services
- Auto-detects Tauri via `isTauri()` to select optimal data adapter
- Tauri: Uses `TauriDataAdapter` (native IPC) for market data, IndexedDB for storage
- Web: Uses `QmServerDataAdapter` (HTTP) for market data, IndexedDB for storage
- Provides `getPortfolioService()`, `getAuthService()`, `getSyncService()`, etc.

**PlatformContext** (`platform/PlatformContext.tsx`):

- React context providing all services to components
- Set up in `FinCatchApp`

### Data Model (camelCase)

All local types and database schema use camelCase field names (matching the server API):

- `portfolioId`, `assetType`, `purchasePrice`, `purchaseDate`, `syncVersion`, `syncedAt`, etc.
- Database schema in `adapters/web/database.ts` uses Dexie.js version 2+ with camelCase indexes

### Component Structure (Atomic Design)

```
packages/ui/src/components/
  atoms/                  # Button, Input, Badge, Card, etc.
  molecules/              # FormField, DateRangePicker, etc.
  organisms/              # OrderForm, Charts, Modals, etc.
  pages/                  # LoginPage, PortfolioPage, TradingPage
  templates/              # AppShell with routing
```

### Embeddable Component

`FinCatchApp` (`packages/ui/src/embed/FinCatchApp.tsx`):

- Main entry point for embedding in other apps (e.g., qm-hub-app)
- Configures platform services, context providers, routing
- Supports shared SSO via localStorage tokens

## Key Conventions

- Path alias `@fin-catch/ui/*` → `packages/ui/src/*` in library code
- Path alias `@/*` → `./src/*` in app code
- Tailwind CSS v4 with `@tailwindcss/vite` plugin
- React 19 with React Router 7
- Radix UI for accessible primitives
- Dexie.js for IndexedDB abstraction
- All TypeScript strict mode
- All local types use camelCase (matching server API)
- **Element selectors (`body`, `h1`–`h6`, etc.) in `global.css` must live inside `@layer base`** so they cannot override `qm-hub-app`'s unlayered body/heading rules when the CSS is processed by the host app's `@tailwindcss/vite` pipeline. `:host` selectors may remain unlayered (shadow DOM only). See `embed-app/CLAUDE.md § CSS Isolation for Embedded Apps`.

## Security Posture (Web Target)

`QmServerAuthAdapter` stores `accessToken` + `refreshToken` in `localStorage` for the web/embed target. This is a **known XSS attack surface** — any script injection can exfiltrate tokens.

Mitigations (in priority order):
1. **CSP `script-src`** at the server/CDN level — reduces XSS attack surface without code changes (recommended).
2. **HttpOnly cookie for refresh token** — requires server-side change; access token remains in-memory.
3. **In-memory token storage** — eliminates localStorage risk; tokens lost on page reload (acceptable in embedded context where parent provides `authTokens` via props).

Tauri target is not affected — tokens are stored in encrypted Rust-side storage via native APIs.

The refresh token race condition is resolved via promise deduplication (`doRefresh()` in `QmServerAuthAdapter`). Concurrent callers share a single in-flight promise — critical when server uses token rotation.

Logout dispatches `window.dispatchEvent(new Event('auth:logout'))` so `useSyncStatus` and other hooks reflect the state change immediately without waiting for the 30s poll interval.

## Sync Integration

This app syncs with `qm-sync` server using IndexedDB for local storage. Key tables: `portfolios`, `portfolio_entries`, `bond_coupon_payments`.

- Sync schema defined in `packages/ui/DESIGN_SYSTEM.md` (FinCatch App Sync Schema section)
- Soft delete with server-side TTL purging (60 days default)
- UUID primary keys for offline record creation
- Per-table `sync_metadata` tracking with `last_sync_timestamp`

## Testing

Vitest with jsdom environment. Tests in `packages/**/*.{test,spec}.{ts,tsx}`.

Setup (`vitest.setup.ts`) mocks:

- `localStorage`
- `fetch`
- `import.meta.env`
