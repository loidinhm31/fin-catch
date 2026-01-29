# Design System - Fin Catch App (Fintech/Crypto Edition)

## Design Philosophy

The Fin Catch App uses a **Dark Fintech/Crypto** design aesthetic with neon accents, glassmorphism effects, and vibrant gradients. This creates a premium, modern feel inspired by leading cryptocurrency and trading platforms while maintaining excellent readability and professional appearance.

## Color Palette

### Primary Colors - Neon/Electric Theme

- **Primary (Electric Blue)**: `#00d4ff` - Main brand color, used for primary actions
- **Primary Light**: `#33e0ff` - Lighter variant for highlights
- **Primary Dark**: `#0099cc` - Darker variant for depth

### Secondary Colors

- **Secondary (Purple)**: `#7b61ff` - Secondary brand color
- **Secondary Light**: `#9d85ff` - Lighter purple for gradients
- **Secondary Dark**: `#5a3fff` - Darker purple for depth

### Accent Colors

- **Accent (Neon Green)**: `#00ff88` - Success states, positive metrics
- **Accent Light**: `#33ffaa` - Lighter green for highlights
- **Accent Dark**: `#00cc6a` - Darker green for depth

### Status Colors

- **Success**: `#00ff88` (Neon Green)
- **Danger**: `#ff3366` (Bright Red)
- **Warning**: `#ffaa00` (Amber)
- **Info**: `#00d4ff` (Electric Blue)

### Dark Theme Base

- **Background Primary**: `#0a0e27` - Main app background
- **Background Secondary**: `#0f1629` - Secondary surfaces
- **Background Tertiary**: `#1a1f3a` - Elevated surfaces
- **Background Elevated**: `#1e2340` - Highest elevation (modals, cards)

### Surface & Glass Colors

- **Surface**: `rgba(26, 31, 58, 0.6)` - Default glass surface
- **Surface Hover**: `rgba(30, 35, 64, 0.8)` - Hover state
- **Surface Elevated**: `rgba(30, 35, 64, 0.9)` - Elevated glass

### Text Colors

- **Text Primary**: `#ffffff` - Primary text, headings
- **Text Secondary**: `#a0aec0` - Secondary text, labels
- **Text Tertiary**: `#718096` - Muted text, placeholders
- **Text Muted**: `#4a5568` - Disabled states

### Border Colors

- **Border Default**: `rgba(123, 97, 255, 0.2)` - Purple tint
- **Border Hover**: `rgba(123, 97, 255, 0.4)` - Stronger purple on hover
- **Border Focus**: `rgba(0, 212, 255, 0.6)` - Electric blue on focus
- **Border Glow**: `rgba(0, 212, 255, 0.3)` - Subtle cyan glow

## Typography

### Font Family

- **Primary**: System font stack (San Francisco, Roboto, Segoe UI)
- **Monospace** (for numbers): SF Mono, Monaco, Consolas

### Font Sizes

- **xs**: 12px - Small labels, captions
- **sm**: 14px - Body text, form inputs
- **base**: 16px - Default text size
- **lg**: 18px - Large body text
- **xl**: 20px - Section headings
- **2xl**: 24px - Page headings
- **3xl**: 30px - Hero headings
- **4xl**: 36px - Large displays

### Font Weights

- **Regular**: 400 - Body text
- **Medium**: 500 - Emphasis
- **Semibold**: 600 - Subheadings
- **Bold**: 700 - Headings, buttons
- **Extrabold**: 800 - Hero text

## Spacing

Consistent spacing scale for margins, padding:

- **xs**: 4px
- **sm**: 8px
- **md**: 16px
- **lg**: 24px
- **xl**: 32px
- **2xl**: 48px

## Border Radius

- **sm**: 8px - Small elements
- **md**: 12px - Inputs, small cards
- **lg**: 16px - Buttons, cards
- **xl**: 20px - Large cards
- **2xl**: 24px - Modals, containers
- **full**: 9999px - Circular elements

## Shadows & Glows

### Shadows (for depth)

- **sm**: `0 1px 2px rgba(0, 0, 0, 0.2)`
- **md**: `0 4px 16px rgba(0, 0, 0, 0.2)`
- **lg**: `0 8px 24px rgba(0, 0, 0, 0.3)`
- **xl**: `0 24px 64px rgba(0, 0, 0, 0.6)`

### Glows (for emphasis)

- **Primary Glow**: `0 0 24px rgba(0, 212, 255, 0.4)`
- **Success Glow**: `0 0 24px rgba(0, 255, 136, 0.4)`
- **Danger Glow**: `0 0 24px rgba(255, 51, 102, 0.4)`
- **Purple Glow**: `0 0 16px rgba(123, 97, 255, 0.3)`

## Components

### Backgrounds

- **Screen Background**: Dark radial gradients with subtle color orbs
- **Animated Orbs**: Pulsing light effects in corners for depth
- **Gradient Overlays**: Subtle color transitions for visual interest

### Buttons

#### Primary Button

- **Background**: Linear gradient from electric blue to purple
- **Border**: 1px solid with cyan glow
- **Shadow**: Multi-layer shadow with glow effect
- **Hover**: Brighter gradient, increased glow, lift effect
- **Special**: Animated shine effect on hover

#### Secondary Button

- **Background**: Transparent with glass effect
- **Border**: 1px solid with purple tint
- **Hover**: Subtle background fill, increased border opacity

### Cards & Surfaces

#### Glass Cards

- **Background**: Semi-transparent dark surface with backdrop blur
- **Border**: 1px solid with purple tint
- **Shadow**: Soft shadow for depth
- **Hover**: Increased opacity, stronger border, cyan glow, lift effect

#### Performance Cards

- **Background**: Gradient overlay matching status (green for profit, red for loss)
- **Glow**: Matching color glow effect
- **Animation**: Smooth transitions on value changes

### Inputs & Forms

#### Text Inputs

- **Background**: Glass effect (dark semi-transparent)
- **Border**: Purple-tinted border
- **Focus**: Electric blue border with glow effect
- **Placeholder**: Muted text color

#### Select Dropdowns

- **Styling**: Matches text inputs
- **Options**: Dark background with hover states
- **Icon**: Custom arrow in muted color

### Modals

- **Backdrop**: Dark overlay (80% opacity) with blur
- **Container**: Elevated dark surface with stronger glass effect
- **Border**: Purple-tinted border with glow
- **Shadow**: Deep shadow with purple glow
- **Header**: Sticky, separated with border
- **Close Button**: Glass button with hover effect

### Badges & Tags

- **Background**: Colored background (10% opacity)
- **Text**: Matching bright color
- **Border**: Optional matching border
- **Glow**: Subtle glow for emphasis

### Charts & Data Visualization

- **Grid Lines**: Subtle, low-opacity
- **Positive Values**: Neon green (#00ff88)
- **Negative Values**: Bright red (#ff3366)
- **Neutral**: Electric blue or purple
- **Gradients**: Used in area charts for depth

## Animations & Effects

### Transitions

- **Fast**: 150ms - Micro-interactions
- **Base**: 300ms - Standard transitions
- **Slow**: 500ms - Large movements

### Keyframe Animations

- **Float**: Gentle up/down movement for decorative elements
- **Pulse Glow**: Breathing effect for ambient orbs
- **Shimmer**: Sliding shine effect on hover
- **Fade In**: Smooth entrance for elements

### Hover Effects

- **Cards**: Lift (translateY -2px), glow increase, opacity increase
- **Buttons**: Shimmer effect, glow increase, lift
- **Inputs**: Border color change, glow effect

## Design Principles

1. **Dark First**: Dark theme as primary, optimized for extended viewing
2. **Neon Accents**: Vibrant colors used sparingly for impact
3. **Glassmorphism**: Frosted glass effects with backdrop blur throughout
4. **Glow Effects**: Strategic use of glows for emphasis and depth
5. **Gradients Everywhere**: Smooth color transitions for premium feel
6. **CSS Variables**: Always use custom properties for consistency
7. **High Contrast**: Ensure readability with proper contrast ratios
8. **Smooth Animations**: 60fps transitions for professional feel
9. **Depth Layering**: Use shadows and glows to create hierarchy
10. **Ambient Effects**: Subtle background animations for life
11. **Data-Focused**: Clear visualization of financial metrics
12. **Professional + Modern**: Balance between serious finance and crypto energy

## Accessibility

- **Contrast Ratios**: Minimum 4.5:1 for body text, 3:1 for large text
- **Focus Indicators**: Clear cyan glow on all interactive elements
- **Keyboard Navigation**: Full support with visible focus states
- **Screen Readers**: Semantic HTML and ARIA labels where needed
- **Color Independence**: Don't rely solely on color for information

## Motion & Interactions

- **Reduced Motion**: Respect prefers-reduced-motion settings
- **Smooth Scrolling**: Enabled by default
- **Touch Targets**: Minimum 44px for mobile interactions
- **Feedback**: Immediate visual feedback on all interactions
- **Loading States**: Animated spinners with brand colors

## Z-Index Layers

- **Base Content**: 0
- **Dropdown**: 10
- **Sticky Elements**: 20
- **Overlay**: 30
- **Modal**: 40
- **Bottom Navigation**: 50
- **Popover**: 50
- **Tooltip**: 60

## Grid & Layout

- **Max Width**: 428px for mobile-first design
- **Container Padding**: 16px default
- **Responsive Breakpoints**:
  - Mobile: < 640px
  - Tablet: 640px - 1024px
  - Desktop: > 1024px

## Custom Scrollbar

- **Track**: Semi-transparent dark
- **Thumb**: Purple-tinted with cyan on hover
- **Width**: 8px
- **Behavior**: Auto-hide on mobile, always visible on desktop

## FinCatch App Sync Schema

The **fin-catch-app** integrates with **qm-sync** for cross-device data synchronization. The following schema must be registered with qm-sync for the application to sync properly.

### App Registration Schema

**File**: `../fin-catch-app-schema.json`

**Registration Command**:

```bash
curl -X POST http://localhost:3000/api/v1/apps \
  -H "X-Admin-Key: <ADMIN_API_KEY>" \
  -H "Content-Type: application/json" \
  -d @../fin-catch-app-schema.json
```

### Schema Definition

```json
{
  "appId": "fin-catch",
  "schema": {
    "portfolios": {
      "columns": [
        { "name": "name", "type": "string", "nullable": false },
        { "name": "description", "type": "string", "nullable": true },
        { "name": "baseCurrency", "type": "string", "nullable": true },
        { "name": "createdAt", "type": "integer", "nullable": false }
      ],
      "primaryKey": "rowId"
    },
    "portfolio_entries": {
      "columns": [
        { "name": "portfolioSyncUuid", "type": "string", "nullable": false },
        { "name": "assetType", "type": "string", "nullable": false },
        { "name": "symbol", "type": "string", "nullable": false },
        { "name": "quantity", "type": "number", "nullable": false },
        { "name": "purchasePrice", "type": "number", "nullable": false },
        { "name": "currency", "type": "string", "nullable": true },
        { "name": "purchaseDate", "type": "integer", "nullable": false },
        { "name": "notes", "type": "string", "nullable": true },
        { "name": "tags", "type": "string", "nullable": true },
        { "name": "transactionFees", "type": "number", "nullable": true },
        { "name": "source", "type": "string", "nullable": true },
        { "name": "createdAt", "type": "integer", "nullable": false },
        { "name": "unit", "type": "string", "nullable": true },
        { "name": "goldType", "type": "string", "nullable": true },
        { "name": "faceValue", "type": "number", "nullable": true },
        { "name": "couponRate", "type": "number", "nullable": true },
        { "name": "maturityDate", "type": "integer", "nullable": true },
        { "name": "couponFrequency", "type": "string", "nullable": true },
        { "name": "currentMarketPrice", "type": "number", "nullable": true },
        { "name": "lastPriceUpdate", "type": "integer", "nullable": true },
        { "name": "ytm", "type": "number", "nullable": true }
      ],
      "primaryKey": "rowId"
    },
    "bond_coupon_payments": {
      "columns": [
        { "name": "entrySyncUuid", "type": "string", "nullable": false },
        { "name": "paymentDate", "type": "integer", "nullable": false },
        { "name": "amount", "type": "number", "nullable": false },
        { "name": "currency", "type": "string", "nullable": false },
        { "name": "notes", "type": "string", "nullable": true },
        { "name": "createdAt", "type": "integer", "nullable": false }
      ],
      "primaryKey": "rowId"
    }
  }
}
```

### Schema Notes

- **UUID Primary Keys**: All tables use UUID as `rowId` in the sync protocol
- **Soft Delete Support**: Client uses soft delete (`deleted`/`deleted_at` columns), server receives `deleted: true` flag
- **TTL Auto-Purge**: Server automatically purges deleted records older than 60 days (configurable via `DELETED_RECORDS_RETENTION_DAYS`)
- **Foreign Key Relationships**:
  - `portfolioSyncUuid` in `portfolio_entries` references `portfolios.rowId`
  - `entrySyncUuid` in `bond_coupon_payments` references `portfolio_entries.rowId`
- **Null Field Filtering**: Client automatically removes null fields before syncing
- **Purge Endpoint**: `POST /api/v1/sync/fin-catch/purge` triggers manual cleanup (requires authentication)

### Sync Protocol Details

**Data Flow**:

1. Client creates/updates records locally with UUID primary keys
2. Client marks deletions with `deleted=1, deleted_at=timestamp, synced_at=NULL`
3. Sync collects unsynced changes (including deletions)
4. Server receives records with `deleted: true` flag for deletions
5. Other devices pull changes and hard-delete locally
6. Server auto-purges deleted records after retention period

**See Also**: `../SYNC_IMPLEMENTATION_PROGRESS.md` for complete integration details

---
