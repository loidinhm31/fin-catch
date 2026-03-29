# fin-catch

**Offline-first portfolio tracker for Vietnamese financial markets**

Track stocks (VN), gold (SJC), bonds, crypto, cash, and savings across desktop and web. Syncs seamlessly with qm-hub-server.

## Quick Start

### Prerequisites

- Node.js 18+ (test with `node --version`)
- pnpm 9.1.0 (`npm install -g pnpm@9.1.0`)
- Rust 1.70+ (for Tauri desktop builds)

### Installation

```bash
# Clone and install
git clone <repo-url>
cd embed-app/fin-catch
pnpm install

# Verify setup
pnpm test:run
```

### Development

```bash
# Web app (localhost:25095)
pnpm dev:web

# Desktop app (Tauri)
pnpm dev:tauri

# Run all tests
pnpm test

# Run tests once (CI)
pnpm test:run

# Lint & format
pnpm lint
pnpm format
```

### Build

```bash
# Build all packages
pnpm build

# Build web only
pnpm build:web

# Build Tauri desktop
pnpm build:tauri
```

## Project Structure

```
fin-catch/
├── apps/
│   ├── web/                   # Vite SPA (port 25095)
│   └── native/                # Tauri desktop shell
├── packages/
│   ├── ui/                    # Components, adapters, hooks (~27.5K LOC)
│   │   ├── src/components/    # Atomic design: atoms → molecules → organisms → pages
│   │   ├── src/adapters/      # Service implementations (IndexedDB, HTTP, IPC)
│   │   ├── src/hooks/         # Custom React hooks
│   │   ├── src/embed/         # FinCatchApp export for qm-hub-app embedding
│   │   ├── src/styles/        # Tailwind v4 + CSS variables
│   │   └── DESIGN_SYSTEM.md   # Component specs, colors, typography
│   ├── shared/                # Types, utilities, constants (~2K LOC)
│   ├── tsconfig/              # TS configurations
│   └── eslint-config/         # ESLint rules
├── docs/
│   ├── architecture.md        # System design, data flow, domain model
│   ├── project-overview-pdr.md # Vision, requirements, roadmap
│   ├── code-standards.md      # Conventions, patterns, best practices
│   └── codebase-summary.md    # File structure, LOC breakdown, key files
├── CLAUDE.md                  # Developer quick start
└── fin-catch-app-schema.json  # Server sync schema
```

## Architecture Overview

**Offline-first sync** with checkpoint-based pagination. All data stored locally in IndexedDB (Dexie.js); syncs with qm-hub-server on demand.

**Adapter pattern**: Services abstracted behind interfaces; platform-specific implementations selected at boot (web uses HTTP, Tauri uses native IPC for market data).

**Component architecture**: Atomic design (atoms → molecules → organisms → pages → templates) using Radix UI primitives + Tailwind v4.

See [docs/architecture.md](./docs/architecture.md) for detailed system diagrams and data flow.

## Available Scripts

| Command | Purpose |
|---------|---------|
| `pnpm dev:web` | Start web dev server (port 25095) |
| `pnpm dev:tauri` | Start Tauri desktop dev (port 1420) |
| `pnpm build` | Build all packages (web + native) |
| `pnpm build:web` | Build web SPA only |
| `pnpm build:tauri` | Build Tauri desktop app |
| `pnpm test` | Run tests in watch mode |
| `pnpm test:run` | Run tests once (CI) |
| `pnpm test:coverage` | Generate coverage report |
| `pnpm lint` | Run ESLint on all packages |
| `pnpm format` | Format code with Prettier |
| `pnpm clean` | Remove build artifacts |

### Turbo Filters

Run tasks in specific workspaces without cd:

```bash
turbo run dev --filter=@fin-catch/web
turbo run build --filter=@fin-catch/ui
turbo run lint --filter=@fin-catch/shared
```

## Testing

**Framework**: Vitest + jsdom

```bash
# Watch mode (development)
pnpm test

# Single run (CI)
pnpm test:run

# Coverage report
pnpm test:coverage

# Single test file
pnpm test packages/ui/src/adapters/web/database.test.ts
```

**Test files**:
- `adapters/shared/QmServerAuthAdapter.test.ts` — Auth refresh dedup
- `adapters/web/sync/IndexedDBSyncAdapter.test.ts` — Sync retry/backoff
- `adapters/web/sync/IndexedDBSyncStorage.test.ts` — Sync metadata validation

All adapter implementations are tested in isolation with mocked storage/HTTP.

## Deployment

### Web (Embedded in qm-hub-app)

Deployed as part of qm-hub-app via GitHub Actions. Build outputs to `apps/web/dist/`.

### Desktop (Tauri)

Releases built and published via GitHub Actions. Downloads from GitHub Releases page (Windows .msi, macOS .dmg, Linux .AppImage).

### Versioning

- Web: Uses qm-hub-app version
- Desktop: Semantic versioning (e.g., `v1.0.0`)
- Database schema: Dexie.js version increments for IndexedDB structure changes

## Key Conventions

- **Naming**: camelCase for database schema (matches server JSON)
- **Styling**: Tailwind v4 with `--color-*` CSS variables (no `dark:` prefix)
- **State**: `ServiceFactory` + React Context (no Zustand)
- **Forms**: react-hook-form + Zod validation
- **Testing**: Adapter-focused; mock storage/HTTP, not components
- **Error handling**: Return errors, don't throw
- **Security**: CSP `script-src` for XSS protection (localStorage tokens)

See [docs/code-standards.md](./docs/code-standards.md) for detailed conventions.

## Features

### Portfolio Management
- Create multiple portfolios with customizable base currency
- Support for 6 asset types: stock, bond, gold, cash, crypto, savings
- Record purchase date, price, quantity, fees, source, notes
- Soft delete with server TTL purging

### Market Data & Pricing
- Real-time VN stock prices (VNDirect, SSI)
- SJC gold prices with unit conversion (gram/mace/tael/kg/oz)
- Exchange rates for 9 currencies (5min cache TTL)
- Price history for performance trending

### Price Alerts & Notifications
- Set target price and stop-loss alerts on any holding
- Max 3 alerts per entry before auto-disable
- Server-side price breach detection with SSE notifications
- In-app alert toasts

### Trading (DNSE)
- Live order placement via DNSE proxy
- 7 order types (market, limit, stop, trailing stop, etc.)
- Real-time position tracking with P&L
- Order history and deal confirmation

### Cross-Device Sync
- Offline-first: Write locally, sync on demand
- Checkpoint-based pagination for efficient sync
- Server-wins conflict resolution
- Soft delete support

### Platform Support
- **Web**: Embedded in qm-hub-app via Shadow DOM
- **Desktop**: Tauri v2 (Windows, macOS, Linux)
- **Mobile**: Android support planned

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `dexie` | 4.3.0 | IndexedDB abstraction |
| `recharts` | 3.7.0 | Charts (candlestick, pie, line) |
| `react-hook-form` | 7.71.1 | Form state management |
| `framer-motion` | 12.34.0 | Animations |
| `@radix-ui/*` | latest | Accessible UI primitives |
| `@tauri-apps/api` | 2.10.1 | Desktop IPC |
| `@qm-hub/sync-client-types` | 0.2.2 | Sync protocol types |
| `tailwindcss` | 4.1.18 | Styling (v4 + Vite) |

## Documentation

- **[docs/architecture.md](./docs/architecture.md)** — Detailed system design with Mermaid diagrams, domain model, sync architecture, data flow
- **[docs/project-overview-pdr.md](./docs/project-overview-pdr.md)** — Vision, product requirements, success metrics, roadmap
- **[docs/code-standards.md](./docs/code-standards.md)** — Coding conventions, patterns, best practices, testing strategy
- **[docs/codebase-summary.md](./docs/codebase-summary.md)** — File structure, component breakdown, key files, metrics
- **[packages/ui/DESIGN_SYSTEM.md](./packages/ui/DESIGN_SYSTEM.md)** — Component specs, color palette, typography, asset type specs
- **[CLAUDE.md](./CLAUDE.md)** — Quick start for developers

## Contributing

1. Create a feature branch: `git checkout -b feat/my-feature`
2. Code with TypeScript strict mode enabled
3. Write tests for adapters and critical paths
4. Run `pnpm lint` and `pnpm format`
5. All tests must pass: `pnpm test:run`
6. Create a pull request

## Security

**Web target**: Tokens stored in localStorage (XSS risk). Mitigations:
- CSP `script-src` at server/CDN level (recommended)
- HttpOnly cookies for refresh token (planned)

**Tauri target**: Encrypted token storage via Rust native APIs.

## Support & Issues

Report bugs via GitHub Issues. For architecture questions, see [docs/architecture.md](./docs/architecture.md).

## License

[Include license info]

---

**Built with React 19, Tauri v2, Tailwind CSS v4, and TypeScript strict mode.**
