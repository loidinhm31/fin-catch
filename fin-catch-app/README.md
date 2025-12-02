# FinCatch App

A desktop financial data visualization application built with Tauri, React, TypeScript, and Tailwind CSS using atomic design principles.

## 🎯 Overview

FinCatch App is a desktop application that integrates the **fin-catch-data** library directly into its Tauri backend, providing:
- **Fast IPC communication** instead of HTTP overhead
- **Single binary deployment** - no separate backend service needed
- **Offline capability** - all data fetching happens in the Rust backend
- **Consistent data access** across desktop platforms

## Features

- **Stock Market Data Query**: Query stock data from multiple sources (VNDIRECT, SSI, Yahoo Finance)
- **Gold Price Data Query**: Query gold prices from SJC source
- **Interactive Charts**:
  - Zoom & Pan functionality for detailed analysis
  - Touch gestures (pinch-to-zoom, swipe-to-pan) for mobile
  - Visual controls (zoom in, zoom out, reset)
  - Mouse wheel zoom and drag support for desktop
- **Mobile-First Design**: Optimized for mobile devices with responsive layouts
- **CUBE Theme**: Beautiful glassmorphism UI with gradient backgrounds and animated cubes
- **Atomic Design Pattern**: Reusable components built with atomic design methodology
- **Type-Safe**: Full TypeScript support for better development experience

## Project Structure

```
fin-catch-app/
├── src/
│   ├── components/
│   │   ├── atoms/          # Basic building blocks (Button, Input, Select, etc.)
│   │   ├── molecules/      # Combinations of atoms (FormField, DateRangePicker, etc.)
│   │   ├── organisms/      # Complex components (Forms, Charts)
│   │   ├── templates/      # Page layouts
│   │   └── pages/          # Complete pages
│   ├── services/           # API service layer
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions
│   ├── styles/            # Global styles
│   ├── App.tsx            # Main application component
│   └── main.tsx           # Application entry point
├── src-tauri/             # Tauri backend
└── public/                # Static assets
```

## Atomic Design Components

### Atoms
- `Button`: Customizable button with variants (primary, secondary, outline, ghost)
- `Input`: Text input with error states
- `Select`: Dropdown select with custom options
- `Label`: Form label with required indicator
- `DateInput`: Date and time picker
- `ErrorText`: Error message display

### Molecules
- `FormField`: Label + Input/Select + Error message wrapper
- `DateRangePicker`: From/To date selection
- `Card`: Content container with optional title
- `Tabs`: Tab navigation component

### Organisms
- `StockQueryForm`: Complete form for querying stock data
- `GoldQueryForm`: Complete form for querying gold prices
- `StockChart`: Interactive stock price chart with OHLCV data
- `GoldChart`: Gold price chart with buy/sell prices

### Pages
- `FinancialDataPage`: Main application page with tab navigation

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- pnpm package manager
- Rust (for Tauri)

### Installation

Install dependencies:
```bash
pnpm install
```

**Note:** No environment configuration needed - the app communicates directly with the integrated Rust backend via Tauri IPC.

### Development

Run the Tauri development application:
```bash
pnpm tauri dev
```

This will:
1. Build the Rust backend with fin-catch-data integration
2. Start the Vite development server
3. Launch the Tauri desktop application

### Building

Build the application:
```bash
pnpm build
```

Build Tauri application:
```bash
pnpm tauri build
```

## Backend Integration

The application uses **Tauri IPC** to communicate with the `fin-catch-data` library integrated into the Rust backend.

### Architecture

```
Frontend (React/TypeScript)
    ↓ (Tauri invoke)
Tauri Commands (Rust)
    ↓ (Direct function calls)
fin-catch-data Library
    ↓ (HTTP requests)
External Data Sources (VNDIRECT, SJC, Yahoo Finance, etc.)
```

**Benefits:**
- No separate backend server needed
- Faster communication via IPC
- Single executable deployment
- Type-safe Rust ↔ TypeScript communication

### Stock Query Parameters

- **Symbol**: Stock ticker (e.g., AAPL, TSLA, VND)
- **Resolution**: Time interval (1, 5, 15, 30, 60, 1D, 1W, 1M)
- **Date Range**: From and To dates
- **Source**: Data source (vndirect, ssi, yahoo_finance)

### Gold Query Parameters

- **Gold Type**: SJC gold types
  - Gold Bars: IDs 1, 2 (priced per tael/lượng)
  - Jewelry/Rings: ID 49 (priced per mace/chỉ)
- **Date Range**: From and To dates
- **Source**: Data source (sjc)

## Technology Stack

- **Framework**: React 19 with TypeScript
- **Desktop**: Tauri 2
- **Styling**: Tailwind CSS with CUBE theme
- **Forms**: React Hook Form
- **Charts**: Recharts with react-zoom-pan-pinch
- **Backend**: fin-catch-data library (Rust)
- **IPC**: Tauri invoke API
- **Date Handling**: date-fns
- **Icons**: Lucide React
- **Build Tool**: Vite

## Design System

The application uses a comprehensive design system with:

- Consistent color palette (cyan, blue, orange gradients)
- Glassmorphism effects for modern UI
- Responsive typography
- Custom animations (float, pulse-glow)
- Mobile-first responsive breakpoints
- Dark mode support

## Key Features

### Form Validation
- Real-time form validation using React Hook Form
- Clear error messages
- Required field indicators

### Data Visualization
- Multiple chart types (Line, Bar, Composed)
- Responsive charts that adapt to screen size
- Interactive tooltips with formatted data
- Custom color schemes for better readability
- **Advanced Interactions**:
  - Zoom in/out with mouse wheel or buttons
  - Pan by dragging the chart
  - Pinch-to-zoom on touch devices
  - Double-click to zoom in quickly
  - Reset button to restore original view
  - Visual zoom controls with glass button styling

### User Experience
- Tab navigation between Stock and Gold queries
- Loading states during API requests
- Error handling with user-friendly messages
- Data summary display
- Mobile-optimized touch interactions
- Intuitive chart interactions with clear instructions

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## Contributing

When adding new components, follow the atomic design pattern:

1. Start with atoms for basic elements
2. Combine atoms into molecules
3. Build organisms from molecules
4. Create templates for page layouts
5. Compose pages from templates and organisms
