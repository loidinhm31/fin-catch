# fin-catch: Product Overview & Product Development Requirements

## Product Vision

**fin-catch** is an offline-first portfolio tracker for Vietnamese retail investors, enabling real-time monitoring of holdings across Vietnamese financial markets and seamless synchronization across desktop (Tauri) and web platforms.

### Target Users

- Vietnamese retail investors managing diverse portfolios (stocks, bonds, gold, crypto, cash, savings)
- Users who need fast, responsive price monitoring without cloud dependency
- Multi-device users requiring automatic sync across web and desktop

### Core Market Opportunity

Vietnamese retail investment market growth driven by:
- Rising stock trading activity on DNSE (Hanoi Stock Exchange)
- Gold investment (SJC bars/jewelry) as safe-haven asset
- Bond market expansion
- Cryptocurrency adoption

## Core Features

### Portfolio Management
- Create multiple portfolios with customizable base currency (VND, USD, etc.)
- Add holdings across 6 asset types: stock, bond, gold, cash, crypto, savings
- Record purchase date, price, quantity, transaction fees, source, notes, tags
- Edit entries with change tracking via `syncVersion`
- Soft delete (server purges after 60-day TTL)
- **Asset-specific fields:**
  - **Stock**: Symbol, quantity, purchase price/date, currency
  - **Gold**: Unit (gram, mace, tael, ounce, kg), SJC type, market price
  - **Bond**: Face value, coupon rate, coupon frequency, maturity date, YTM, coupon payment tracking
  - **Savings**: Interest rate, term months, compounding type, demand deposit option
  - **Crypto**: Symbol, quantity, purchase price
  - **Cash**: Currency holdings

### Market Data & Pricing
- Real-time price updates via qm-hub-server integration
- Support for VN stock data (VNDirect, SSI APIs)
- SJC gold prices with live unit conversion
- Exchange rates (9 currencies) with 5-minute cache TTL
- Price history for performance trending

### Price Monitoring & Alerts
- Set target price and stop-loss alerts on any holding
- Max 3 alerts per entry before auto-disable
- Server-side price breach detection with SSE notifications
- In-app alert toast display
- Alerts stored on portfolio entry records

### Trading (DNSE - Vietnamese Stock Exchange)
- Live order placement via DNSE proxy (qm-fin-catch-trading-platform)
- Support for 7 order types (market, limit, stop, trailing stop, etc.)
- Real-time position tracking with P&L
- Order history and deal confirmation
- MQTT WebSocket streaming for order status

### Performance Analytics
- Portfolio-level metrics: total value, cost basis, gain/loss, gain/loss %
- Per-entry performance with current prices
- Asset allocation pie charts and breakdowns
- Holdings performance curves (normalized base 100)
- Benchmark comparison (future)
- Currency conversion to base currency with live rates

### Cross-Device Sync
- Offline-first: Write to local IndexedDB, sync on demand or periodically
- Automatic sync on app launch and background periodically
- Checkpoint-based pagination for efficient incremental sync
- Server-wins conflict resolution with per-record `syncVersion`
- Soft delete support (deleted entries marked, server TTL purges)

### Platform Support
- **Web**: Embedded in qm-hub-app via Shadow DOM, standalone Vite SPA
- **Tauri Desktop**: Native Windows/macOS/Linux app with SQLite (planned—current: IndexedDB)
- **Mobile**: Android support planned via Tauri Android

## Technical Architecture Overview

### Monorepo Structure (Turborepo + pnpm)

```
fin-catch/
├── apps/web/              # Web SPA (Vite, React 19)
├── apps/native/           # Tauri v2 shell + Rust backend
├── packages/ui/           # Shared components, adapters, hooks
├── packages/shared/       # Types, utilities (no React)
├── packages/tsconfig/     # TS configs
├── packages/eslint-config/# Lint rules
└── fin-catch-app-schema.json
```

### Component Architecture (Atomic Design)
- **Atoms** (29): Button, Input, Badge, Card, Icon, Divider, Spinner, Alert, Modal, etc.
- **Molecules** (21): FormField, DateRangePicker, TabNavigator, SyncStatus, CurrencySelect, etc.
- **Organisms** (33): Holdings, Charts, OrderForm, AddEditEntryModal, PortfolioForm, etc.
- **Pages** (6): LoginPage, PortfolioPage, FinancialDataPage, TradingPage, SettingsPage, TradingOperationsPage
- **Templates** (1): AppShell (routing, layout, nav)

### Adapter Pattern (Dependency Injection)

All platforms abstracted behind service interfaces with implementation selection at boot:

| Service Interface | Purpose | Web | Tauri |
|------------------|---------|-----|-------|
| IPortfolioService | CRUD portfolios | IndexedDB | IndexedDB |
| IPortfolioEntryService | CRUD holdings | IndexedDB | IndexedDB |
| ICouponPaymentService | Bond coupon tracking | IndexedDB | IndexedDB |
| IAuthService | Login, token mgmt | HTTP (qm-hub-server) | HTTP |
| IDataService | Market data fetch | HTTP (QmServerDataAdapter) | IPC (TauriDataAdapter) |
| ISyncService | Offline-first sync | IndexedDB checkpoint | IndexedDB checkpoint |
| IMarketDataService | Real-time SSE | MQTT/SSE streams | MQTT/SSE streams |
| ITradingAuthService | Trading session | HTTP (DNSE proxy) | HTTP (DNSE proxy) |

**Key decision**: Both web and Tauri use IndexedDB for local storage (no SQLite) to eliminate platform-specific bugs. Tauri's only platform-specific adapter is `TauriDataAdapter` for native IPC market data fetching.

### Data Storage (IndexedDB + Dexie.js)

**Synced tables** (checkpoint-tracked):
- `portfolios` — Portfolio metadata + base currency
- `portfolioEntries` — Holdings with asset-specific nullable fields
- `bondCouponPayments` — Bond coupon payments + dates

**Sync metadata tables**:
- `_syncMeta` — Per-table last sync checkpoint
- `_pendingChanges` — Queued local mutations (operation, version, timestamp)

**Sync columns on all records**:
- `syncVersion` — Version number (server-wins conflict resolution)
- `syncedAt` — Timestamp of last server sync
- `deleted` — Boolean soft-delete flag
- `deletedAt` — Soft-delete timestamp

### Authentication & Authorization
- **Web/Embed**: OAuth via parent app (qm-hub-app) → localStorage JWT tokens
- **Tauri**: JWT via HTTP authentication endpoint
- **Dual token flow**: Access token (short-lived) + refresh token (long-lived) with rotation support
- **API auth headers**: `X-API-Key`, `X-App-Id` (app identity) + `Authorization: Bearer` (user identity)
- **Embedded mode**: SSO via parent's `authTokens` prop + logout event broadcasting

### CSS & Theming
- **Tailwind CSS v4** with `@tailwindcss/vite` plugin (no PostCSS)
- **Dark fintech theme**: Neon accents (electric blue #00d4ff, neon green #00ff88, purple #7b61ff)
- **CSS custom properties**: Semantic variables for colors, fonts, shadows
- **Glassmorphism**: Transparent cards with backdrop blur
- **Shadow DOM compatibility**: Element selectors in `@layer base` to avoid host app collision

## Non-Goals & Out of Scope

### Currently Out of Scope
- SQLite for Tauri (planned for v2)
- Android native UI (using web PWA wrapper planned)
- Machine learning price prediction
- Advanced tax reporting (future add-on)
- Margin trading / leverage
- International market data (focus on VN market)
- Custom benchmark creation (use predefined benchmarks only)
- Trading on non-DNSE platforms (DNSE only)
- Integration with Vietnamese banks (future)

## Key Tech Decisions & Rationale

| Decision | Rationale |
|----------|-----------|
| **IndexedDB (both web & Tauri)** | Eliminates platform-specific storage bugs; easier QA |
| **Dexie.js abstraction** | Simpler API than raw IndexedDB; better TypeScript support |
| **Adapter pattern** | Swappable implementations for testing; easy platform-specific optimizations |
| **Checkpoint-based sync** | Efficient incremental sync; handles offline periods; avoids full-table resync |
| **Server-wins conflicts** | Simple, deterministic; acceptable for portfolio data (user can re-edit) |
| **Soft delete TTL** | Sync propagation (clients see deletions); server cleanup (storage bounded) |
| **Tailwind v4 + CSS vars** | Fast styling; theme switching via variable override; no Tailwind dark: needed |
| **React Router 7** | Lazy page loading; embedded mode shares parent router |
| **Tauri v2** | Cross-platform desktop; lightweight; webview + Rust IPC backend |
| **Radix UI primitives** | Accessible, unstyled base components; compatible with Shadow DOM |
| **TypeScript strict** | Early error detection; better IDE support; safer refactoring |

## Success Metrics

### User-Facing Metrics
- Portfolio sync latency < 2 seconds
- Price update latency < 5 seconds (real-time SSE)
- Offline write → sync → read cycle < 5 seconds
- Zero data loss on sync failures (queued changes persisted)

### Technical Metrics
- Test coverage >= 70% (adapters, sync, auth)
- Lighthouse score >= 80 (web)
- Bundle size < 500KB (gzipped, web)
- Offline-first: Full functionality without network for >= 1 hour

## Acceptance Criteria

### MVP (v1.0)
- Portfolio CRUD with 4+ asset types (stock, bond, gold, cash)
- Price history for 30+ days
- Price alerts (max 3 per entry)
- Web + Tauri launch with offline-first sync
- Authentication via qm-hub-server
- Shadow DOM embedding in qm-hub-app

### v1.1 (Trading)
- DNSE trading via qm-fin-catch-trading-platform
- Order placement, history, deal confirmation
- Real-time P&L tracking
- Position management

### v1.2 (Analytics)
- Asset allocation charts
- Performance trends
- Multi-currency comparison
- Benchmark tracking

## Deployment & Maintenance

### Release Channels
- **Web**: Deployed via qm-hub-app; no separate rollout
- **Tauri**: GitHub Releases (Windows, macOS, Linux)
- **CI/CD**: GitHub Actions (lint, test, build, release)

### Database Versioning
- Dexie.js schema version increments for IndexedDB structure changes
- Migration paths for existing user data
- Server-side schema defined in `fin-catch-app-schema.json`

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Token theft (XSS) | CSP `script-src` at server/CDN; HttpOnly cookies (future) |
| Sync data loss | Write-ahead logging (pending changes table); backoff retry |
| Offline data stale > 1 week | Prompt user to sync; auto-sync on foreground (tab active) |
| Gold unit conversion errors | Unit tests (gram/mace/tael/ounce/kg); visual unit display |
| DNSE outages | Graceful degradation; cached session IDs; user notification |

## Project Timeline

- **Q1 2026**: MVP (portfolio CRUD + sync)
- **Q2 2026**: Trading features (v1.1)
- **Q3 2026**: Analytics & benchmarks (v1.2)
- **Q4 2026**: Mobile (Android) support
- **2027**: International markets + advanced features

## References

- [Architecture Documentation](./architecture.md) — System design & data flow
- [Design System](../packages/ui/DESIGN_SYSTEM.md) — Component specs & color palette
- [Code Standards](./code-standards.md) — Development conventions
- [CLAUDE.md](../CLAUDE.md) — Developer quick start
