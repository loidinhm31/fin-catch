# @fin-catch/ui

Shared UI component library for the fin-catch application, built with React and Tailwind CSS following **atomic design** principles.

## Structure

- `atoms/` — Foundational elements (Button, Input, Badge, Card, etc.)
- `molecules/` — Composed atoms (FormField, DateRangePicker, SymbolSearch, etc.)
- `organisms/` — Complex sections (OrderForm, Holdings, Charts, Modals, etc.)
- `pages/` — Full page components (LoginPage, PortfolioPage, TradingPage, etc.)
- `templates/` — Layout shells (AppShell with routing, sidebar, bottom nav)
- `adapters/` — Platform-specific service implementations (Tauri, HTTP, IndexedDB)
- `hooks/` — Shared React hooks (useAuth, usePortfolios, etc.)

## Design System

See [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) for the full design system specification including colors, typography, spacing, and component guidelines.

## Export Paths

```ts
import { Button } from "@fin-catch/ui/components/atoms";
import { FormField } from "@fin-catch/ui/components/molecules";
import { OrderForm } from "@fin-catch/ui/components/organisms";
import { PortfolioPage } from "@fin-catch/ui/components/pages";
import { AppShell } from "@fin-catch/ui/components/templates";
import { useAuth } from "@fin-catch/ui/hooks";
import { serviceLogger } from "@fin-catch/ui/utils";
import { TauriPortfolioAdapter } from "@fin-catch/ui/adapters/tauri";
import { PlatformProvider } from "@fin-catch/ui/platform";
import { FinCatchApp } from "@fin-catch/ui/embed";
```
