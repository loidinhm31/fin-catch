# fin-catch Code Standards & Best Practices

## Language & Type System

### TypeScript Configuration

- **Strict mode**: `compilerOptions.strict = true` for all workspaces
- **Target**: ES2020 (modern browsers + Node 18+)
- **Module**: ESNext (tree-shaking via bundler)
- **JSX**: react-jsx (React 17+ JSX transform)

### Naming Conventions

- **Database schema**: `camelCase` (matches server API JSON)
- **Files**: `kebab-case.ts` for utilities, `PascalCase.tsx` for React components
- **Variables & functions**: `camelCase`
- **Classes & types**: `PascalCase`
- **Constants**: `UPPER_SNAKE_CASE` for module-level constants; `camelCase` for config objects

### Import Organization

Order imports as: react → third-party libs → local utilities → types → styles

```typescript
// React + hooks
import React, { useState, useCallback } from 'react';

// Third-party
import { useForm } from 'react-hook-form';
import { Card } from '@radix-ui/themes';

// Local adapters & services
import { usePortfolios } from '@/hooks/usePortfolios';
import { getCurrencyFormatter } from '@/utils/currency';

// Types
import type { Portfolio, PortfolioEntry } from '@fin-catch/shared/types';

// Styles
import styles from './Component.module.css';
```

## Adapter Pattern & Dependency Injection

### Service Interfaces

All services are defined as interfaces in `packages/ui/src/adapters/factory/interfaces/`:

```typescript
export interface IPortfolioService {
  getAll(userId: string): Promise<Portfolio[]>;
  getById(id: string): Promise<Portfolio | null>;
  create(portfolio: CreatePortfolioDTO): Promise<Portfolio>;
  update(id: string, changes: Partial<Portfolio>): Promise<Portfolio>;
  delete(id: string): Promise<void>;
}
```

### ServiceFactory (Singleton DI)

Never instantiate adapters directly. Use `ServiceFactory` for all service access:

```typescript
// Correct
import { ServiceFactory } from '@/adapters/factory/ServiceFactory';

const portfolioService = ServiceFactory.getPortfolioService();
const result = await portfolioService.getAll(userId);

// Incorrect ❌
const adapter = new IndexedDBPortfolioAdapter(); // Don't do this
```

### Setter Pattern for Testing

Mock services via `ServiceFactory.set*()` methods:

```typescript
const mockService = { getAll: vi.fn() };
ServiceFactory.setPortfolioService(mockService);

// After test
ServiceFactory.reset(); // Clear mocks
```

### Platform Detection

```typescript
import { isTauri } from '@/utils/platform';

if (isTauri()) {
  // Tauri-specific code
  const result = await invoke('fetch_stock_history', { symbol: 'TCB' });
} else {
  // Web-specific code
  const result = await qmServerDataAdapter.getStockHistory('TCB');
}
```

## Component Architecture (Atomic Design)

### Atoms
Reusable UI building blocks with no dependencies on business logic.

```typescript
// Button.tsx
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'font-semibold rounded-lg transition-colors',
        variant === 'primary' && 'bg-(--color-primary-500) text-white hover:bg-(--color-primary-600)',
        size === 'md' && 'px-4 py-2',
      )}
      disabled={loading}
      {...props}
    >
      {loading ? <Spinner /> : props.children}
    </button>
  ),
);
```

### Molecules
Composed atoms with light business logic or styling patterns.

```typescript
// FormField.tsx
export const FormField = ({ label, error, children }: FormFieldProps) => (
  <div className="space-y-1">
    {label && <label className="text-sm font-medium text-(--color-text-primary)">{label}</label>}
    {children}
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);
```

### Organisms
Feature-complete, self-contained components with hooks, services, and state.

```typescript
// Holdings.tsx (303 LOC)
export const Holdings = ({ portfolioId }: { portfolioId: string }) => {
  const [entries, setEntries] = useState<PortfolioEntry[]>([]);
  const portfolioEntryService = ServiceFactory.getPortfolioEntryService();

  useEffect(() => {
    portfolioEntryService.getByPortfolioId(portfolioId).then(setEntries);
  }, [portfolioId]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {entries.map(entry => (
          <HoldingCard key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  );
};
```

### Pages
Full-screen components tied to routes; lazy-loaded via `React.lazy()`.

```typescript
// PortfolioPage.tsx (342 LOC)
export const PortfolioPage = () => {
  const [portfolios, , ] = usePortfolios();
  return (
    <div className="space-y-6">
      <PortfolioHeader />
      <Holdings portfolioId={portfolios[0]?.id} />
    </div>
  );
};
```

### Templates
Layout wrappers with routing and navigation.

```typescript
// AppShell.tsx (189 LOC)
export const AppShell = () => {
  const [isLoggedIn] = useAuth();

  return (
    <div className="flex h-screen flex-col">
      {isLoggedIn && <Sidebar />}
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
        </Routes>
      </main>
    </div>
  );
};
```

## Hooks & Custom Logic

### useAuth
Authentication state with token refresh dedup.

```typescript
const [isLoggedIn, user, logout] = useAuth();

// Does NOT throw; returns boolean for safety
if (!isLoggedIn) {
  return <Redirect to="/" />;
}
```

### usePortfolios
Portfolio CRUD with auto-reload.

```typescript
const [portfolios, isLoading, refetch] = usePortfolios();
const [selectedId, setSelectedId] = usePortfolioSelection();

await createPortfolio({ name: 'My Fund', baseCurrency: 'VND' });
await refetch(); // Refresh list
```

### usePlatformContext
React context for all services.

```typescript
const { authService, portfolioService, syncService } = usePlatformContext();

const user = await authService.getCurrentUser();
```

## State Management

**No Zustand or Redux.** Use `ServiceFactory` + `React.useState()` + `PlatformContext`:

```typescript
// ✅ Correct
const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
const portfolioService = ServiceFactory.getPortfolioService();

useEffect(() => {
  portfolioService.getAll(userId).then(setPortfolios);
}, [userId]);

// ❌ Incorrect
// Don't create new Zustand stores; use ServiceFactory singleton + useState
```

## Forms & Validation

Use `react-hook-form` + `Zod` for validation.

```typescript
// Schema in packages/shared/types/form.ts
export const CreatePortfolioSchema = z.object({
  name: z.string().min(1, 'Name required').max(50),
  baseCurrency: z.enum(['VND', 'USD', 'EUR']),
  description: z.string().optional(),
});

// Component
const CreatePortfolioForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<CreatePortfolioInput>({
    resolver: zodResolver(CreatePortfolioSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormField label="Portfolio Name" error={errors.name?.message}>
        <Input {...register('name')} />
      </FormField>
      <Button type="submit">Create</Button>
    </form>
  );
};
```

## Styling

### Tailwind CSS v4 + CSS Variables

- Use `@tailwindcss/vite` plugin (no PostCSS)
- Apply CSS custom properties via `bg-(--color-bg-white)` syntax
- **NO `dark:` prefix** — use CSS class selectors (`.dark`, `.cyber`) or variables

```typescript
// ✅ Correct
<div className="bg-(--color-bg-white) text-(--color-text-primary) border-(--color-border-light)">

// ❌ Incorrect
<div className="dark:bg-gray-800 dark:text-white"> // Won't respond to fin-catch's theme system
```

### Semantic CSS Variables

| Use | Don't Use |
|-----|-----------|
| `bg-(--color-bg-white)` | `bg-white`, `bg-gray-50` |
| `text-(--color-text-primary)` | `text-gray-800`, `text-gray-900` |
| `text-(--color-text-secondary)` | `text-gray-600` |
| `border-(--color-border-light)` | `border-gray-200`, `border-gray-300` |
| `hover:bg-(--color-primary-500)/10` | `hover:bg-indigo-50` |

### Global CSS Structure

```css
/* packages/ui/src/styles/global.css */

@layer base {
  /* Element selectors MUST be in @layer base to avoid leaking to qm-hub-app */
  body {
    @apply font-body text-(--color-text-primary);
    background: var(--color-bg-app);
  }

  h1, h2, h3, h4, h5, h6 {
    @apply font-heading;
  }
}

@layer components {
  /* Utility classes */
  .glass-card {
    @apply rounded-lg border border-(--color-border-light) backdrop-blur-sm;
    background: rgba(26, 31, 58, 0.6);
  }
}

/* Theme CSS custom properties */
:root {
  --color-bg-app: #0F172A;
  --color-bg-light: #1E293B;
  --color-bg-white: #1E293B;
  --color-text-primary: #ffffff;
  --color-border-light: rgba(255, 255, 255, 0.08);
  /* ... */
}
```

### No Gradients in Components

Use **solid colors** only:

```typescript
// ✅ Correct
<button className="bg-(--color-primary-500) hover:bg-(--color-primary-600)">

// ❌ Incorrect
<button className="bg-gradient-to-r from-indigo-500 to-purple-600">
```

## Error Handling

### Pattern: Return Errors, Don't Throw

All adapters follow this pattern:

```typescript
export async function syncNow(): Promise<SyncResult> {
  try {
    const pending = await db.table('_pendingChanges').toArray();
    const response = await fetch('/api/sync', { body: JSON.stringify(pending) });

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
```

### In Components

```typescript
const handleSync = async () => {
  const result = await syncAdapter.syncNow();
  if (!result.success) {
    toast.error(`Sync failed: ${result.error}`);
    return;
  }
  toast.success('Synced!');
};
```

## Database Schema (Dexie.js)

### Definition in `adapters/web/database.ts`

```typescript
import Dexie, { Table } from 'dexie';

export interface Portfolio {
  id: string;
  userId: string;
  name: string;
  baseCurrency: string;
  createdAt: number;
  syncVersion: number;
  syncedAt: number;
  deleted: boolean;
  deletedAt?: number;
}

export class FinCatchDB extends Dexie {
  portfolios!: Table<Portfolio>;
  portfolioEntries!: Table<PortfolioEntry>;
  bondCouponPayments!: Table<BondCouponPayment>;
  _syncMeta!: Table<SyncMetadata>;
  _pendingChanges!: Table<PendingChange>;

  constructor() {
    super('fin-catch-db');
    this.version(1).stores({
      portfolios: '&id',
      portfolioEntries: '&id, portfolioId, syncVersion',
      bondCouponPayments: '&id, entryId',
      _syncMeta: 'tableName',
      _pendingChanges: '++id, tableName',
    });
  }
}
```

### Sync Columns Required

Every synced table must include:
- `id: string` — UUID primary key
- `syncVersion: number` — Conflict resolution
- `syncedAt: number` — Last server sync
- `deleted: boolean` — Soft delete flag
- `deletedAt?: number` — Soft delete timestamp

## Testing

### Test Structure

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ServiceFactory } from '@/adapters/factory/ServiceFactory';

describe('QmServerAuthAdapter', () => {
  beforeEach(() => {
    ServiceFactory.reset();
    vi.clearAllMocks();
  });

  it('should refresh token on 401', async () => {
    const mockResponse = { accessToken: 'new-token', refreshToken: 'new-rt' };
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => mockResponse,
    })));

    const authService = ServiceFactory.getAuthService();
    const result = await authService.refreshAccessToken('old-rt');

    expect(result.accessToken).toBe('new-token');
  });
});
```

### Adapter-Focused Testing

Test service implementations in isolation using mocked storage/HTTP:

| Layer | Approach | Notes |
|-------|----------|-------|
| Adapters | Mock fetch, localStorage | Test retry/backoff, conflict resolution |
| Sync | Mock IndexedDB | Test checkpoint tracking, pending changes |
| Auth | Mock HTTP responses | Test token refresh dedup, race conditions |
| Components | React Testing Library | Test user interactions, form submission |

### Setup Mocks

Configured in `vitest.setup.ts`:

```typescript
// Mock localStorage
global.localStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

// Mock fetch
global.fetch = vi.fn();

// Mock import.meta.env
import.meta.env = {
  VITE_API_URL: 'http://localhost:3000',
  VITE_APP_ID: 'fin-catch-web',
};
```

## Security

### Token Storage (Web)

- **Storage**: `localStorage` (known XSS risk)
- **Mitigation**: CSP `script-src` at server level (recommended)
- **Future**: HttpOnly cookies for refresh token
- **Access token**: In-memory only (lost on page reload—acceptable in embedded mode)

### Token Refresh Dedup

Prevent race condition where concurrent 401s trigger multiple refresh requests:

```typescript
private refreshPromise: Promise<void> | null = null;

async getAccessToken(): Promise<string> {
  if (this.accessToken && !this.isExpired()) {
    return this.accessToken;
  }

  // Share single refresh promise across concurrent calls
  if (!this.refreshPromise) {
    this.refreshPromise = this.doRefresh();
  }

  await this.refreshPromise;
  this.refreshPromise = null;

  return this.accessToken;
}
```

### API Headers

All requests include:
- `X-API-Key: {appId}` — App identity
- `X-App-Id: {appId}` — App identifier
- `Authorization: Bearer {accessToken}` — User identity

## Performance Optimization

### Code Splitting

Pages lazy-loaded via `React.lazy()`:

```typescript
const PortfolioPage = lazy(() => import('./pages/PortfolioPage'));
const TradingPage = lazy(() => import('./pages/TradingPage'));

<Routes>
  <Route path="/portfolio" element={<PortfolioPage />} />
  <Route path="/trading" element={<TradingPage />} />
</Routes>
```

### Memoization

Use `useMemo` & `useCallback` for expensive computations:

```typescript
const portfolioValue = useMemo(() => {
  return entries.reduce((sum, entry) => sum + (entry.currentPrice * entry.quantity), 0);
}, [entries]);

const handleAddEntry = useCallback(async (entry: PortfolioEntry) => {
  await portfolioEntryService.create(entry);
}, [portfolioEntryService]);
```

### Debounce User Input

For search/filter operations:

```typescript
const [searchTerm, setSearchTerm] = useState('');
const debouncedSearch = useDebounce(searchTerm, 300);

useEffect(() => {
  searchService.search(debouncedSearch);
}, [debouncedSearch]);
```

## Accessibility

### Use Radix UI Primitives

All interactive elements built on Radix for ARIA support:

```typescript
import * as Dialog from '@radix-ui/react-dialog';
import * as Select from '@radix-ui/react-select';

<Dialog.Root open={isOpen}>
  <Dialog.Trigger>Open</Dialog.Trigger>
  <Dialog.Content>
    {/* Automatically includes ARIA attributes */}
  </Dialog.Content>
</Dialog.Root>
```

### Semantic HTML

```typescript
// ✅ Correct
<button onClick={handleDelete}>Delete</button>
<label htmlFor="email">Email</label>
<input id="email" type="email" />

// ❌ Incorrect
<div onClick={handleDelete} role="button">Delete</div>
<div className="label">Email</div>
```

## Documentation

### JSDoc Comments

Document exported functions and complex logic:

```typescript
/**
 * Converts gold weight between units.
 * @param amount - Quantity in source unit
 * @param from - Source unit (e.g. 'gram')
 * @param to - Target unit (e.g. 'mace')
 * @returns Converted amount
 * @throws Error if units invalid
 */
export function convertGoldUnit(amount: number, from: string, to: string): number {
  // ...
}
```

### README Files

- `packages/ui/README.md` — Export paths, component library usage
- `packages/shared/README.md` — Type exports, utility functions
- `apps/native/README.md` — Tauri setup & build instructions

## Git & Commits

### Commit Messages

Follow conventional commits:

```
feat: add gold unit conversion
fix: resolve sync race condition
docs: update architecture diagram
test: add IndexedDBSyncAdapter tests
chore: bump dependencies
```

### PR Review Checklist

- [ ] Tests added/updated
- [ ] Adapters isolated (not coupled to UI)
- [ ] Error handling: return errors, don't throw
- [ ] CSS variables used (no hardcoded colors)
- [ ] Accessibility checked (semantic HTML, ARIA)
- [ ] TypeScript strict mode passes
- [ ] No `any` types
- [ ] Lint & format pass

## References

- [Project Overview & PDR](./project-overview-pdr.md) — Vision & requirements
- [Architecture](./architecture.md) — System design
- [Design System](../packages/ui/DESIGN_SYSTEM.md) — Component specs & colors
- [Codebase Summary](./codebase-summary.md) — File structure & metrics
- [CLAUDE.md](../CLAUDE.md) — Quick start guide
