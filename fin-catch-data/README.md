# Fin-Catch Data

A Rust financial data aggregation library and optional standalone API server. Designed to fetch stock market, gold price, and exchange rate data from multiple sources through a unified interface.

## 🎯 Overview

**fin-catch-data** is a versatile Rust crate that can be used in two ways:

1. **As a Library**: Integrate directly into your Rust applications (e.g., Tauri apps, CLIs)
2. **As an API Server**: Run as a standalone HTTP REST service

This dual-purpose design allows you to choose the deployment model that best fits your needs:
- Use as a library for desktop apps with **Tauri IPC** for better performance
- Run as a server for web applications or microservices architecture

## ✨ Features

- **Multi-source support**: Extensible architecture supporting multiple data providers
- **Unified interface**: Consistent API for different data types (stock, gold, exchange rates)
- **Smart routing**: Automatic source selection based on query patterns
- **Stock data sources**: VNDIRECT, SSI, Yahoo Finance
- **Gold price sources**: SJC Gold Company
- **Exchange rate sources**: Vietcombank, Yahoo Finance
- **Type-safe**: Leverages Rust's type system for reliability
- **Async/await**: High-performance async I/O with Tokio
- **Health checks**: Monitor the status of all data sources
- **CORS enabled**: (Server mode) Ready for web application integration
- **Structured logging**: Built-in tracing for debugging and monitoring

## 📦 Architecture

### Components

1. **Models** (`src/models/`): Request/response structures
   - `request.rs`: Stock request models
   - `response.rs`: Stock response models
   - `gold.rs`: Gold price models
   - `exchange_rate.rs`: Exchange rate models
   - `gold_premium.rs`: Gold premium calculation models
   - `unified.rs`: Unified data types

2. **Sources** (`src/sources/`): Data source implementations
   - **Stock**: `vndirect.rs`, `ssi.rs`, `yahoo_finance.rs`
   - **Gold**: `sjc.rs`
   - **Exchange rates**: `vietcombank.rs`, `yahoo_finance_exchange.rs`

3. **Gateway** (`src/gateway/`): Request routing and source management

4. **Routes** (`src/routes/`, server mode only): HTTP API endpoint handlers

5. **Error** (`src/error.rs`): Centralized error handling

## 🚀 Getting Started

### As a Library

Add to your `Cargo.toml`:

```toml
[dependencies]
fin-catch-data = { path = "../fin-catch-data" }
```

**Example Usage:**

```rust
use fin_catch_data::{
    DataSourceGateway,
    StockHistoryRequest,
    Resolution,
};

#[tokio::main]
async fn main() {
    // Initialize gateway with all sources
    let gateway = DataSourceGateway::with_all_sources();

    // Fetch stock data
    let request = StockHistoryRequest {
        symbol: "VND".to_string(),
        resolution: Resolution::OneDay,
        from: 1715385600,
        to: 1720396800,
        source: None, // Uses default (VNDIRECT)
    };

    match gateway.fetch_stock_history(request).await {
        Ok(response) => println!("{:?}", response),
        Err(e) => eprintln!("Error: {}", e),
    }
}
```

### As an API Server

Build and run the standalone server:

```bash
# Build with server feature
cargo build --release --features server

# Run the server
cargo run --release --features server --bin fin-catch-server

# Or with custom port
PORT=8080 cargo run --release --features server --bin fin-catch-server
```

The server binary will be available at `target/release/fin-catch-server`.

## 🔧 Library API

### Initialize Gateway

```rust
use fin_catch_data::DataSourceGateway;

// Create gateway with all sources registered
let gateway = DataSourceGateway::with_all_sources();
```

### Fetch Stock History

```rust
use fin_catch_data::{StockHistoryRequest, Resolution};

let request = StockHistoryRequest {
    symbol: "VND".to_string(),
    resolution: Resolution::OneDay,
    from: 1715385600,
    to: 1720396800,
    source: None,
};

let response = gateway.fetch_stock_history(request).await?;
```

### Fetch Gold Prices

```rust
use fin_catch_data::GoldPriceRequest;

let request = GoldPriceRequest {
    gold_price_id: "1".to_string(),
    from: 1730764800,
    to: 1731110400,
    source: None,
};

let response = gateway.fetch_gold_history(request).await?;
```

### Fetch Exchange Rates

```rust
use fin_catch_data::ExchangeRateRequest;

let request = ExchangeRateRequest {
    currency_code: "USD".to_string(),
    from: 1730764800,
    to: 1731283200,
    source: None, // Smart routing: single day → Vietcombank, range → Yahoo
};

let response = gateway.fetch_exchange_rate_history(request).await?;
```

### Calculate Gold Premium

```rust
use fin_catch_data::{GoldPremiumRequest, GoldPremiumCalculator};

let request = GoldPremiumRequest {
    from: 1730764800,
    to: 1731283200,
    gold_price_id: Some("1".to_string()),
    currency_code: Some("USD".to_string()),
    gold_source: None,
    exchange_rate_source: None,
    stock_source: None,
};

let response = GoldPremiumCalculator::calculate(&gateway, &request).await?;
```

## 🌐 HTTP API (Server Mode)

When running as a server, the following endpoints are available:

### Stock Data
- `POST /api/v1/stock/history` - Fetch stock history
- `GET /api/v1/stock/history` - Fetch stock history (query params)

### Gold Data
- `POST /api/v1/gold/history` - Fetch gold price history
- `GET /api/v1/gold/history` - Fetch gold price history (query params)

### Exchange Rates
- `POST /api/v1/exchange-rate/history` - Fetch exchange rate history

### Gold Premium
- `POST /api/v1/gold-premium` - Calculate gold premium

### Metadata & Health
- `GET /api/v1/sources` - List all available sources
- `GET /api/v1/health` - API health check
- `GET /api/v1/health/sources` - All sources health check
- `GET /api/v1/health/source/:name` - Specific source health check
- `GET /` - API documentation

For detailed API documentation and examples, see the full API reference in the [Technical Documentation](./TECHNICAL_DOCUMENT.md).

## 🏗️ Integration with Tauri

**fin-catch-data** integrates seamlessly with Tauri applications. See the `fin-catch-app` project for a complete example.

**Example Tauri Command:**

```rust
use std::sync::Arc;
use tauri::State;
use fin_catch_data::{DataSourceGateway, StockHistoryRequest, StockHistoryResponse};

struct AppState {
    gateway: Arc<DataSourceGateway>,
}

#[tauri::command]
async fn fetch_stock_history(
    request: StockHistoryRequest,
    state: State<'_, AppState>,
) -> Result<StockHistoryResponse, String> {
    state
        .gateway
        .fetch_stock_history(request)
        .await
        .map_err(|e| e.to_string())
}

fn main() {
    let gateway = Arc::new(DataSourceGateway::with_all_sources());

    tauri::Builder::default()
        .manage(AppState { gateway })
        .invoke_handler(tauri::generate_handler![fetch_stock_history])
        .run(tauri::generate_context!())
        .expect("error running tauri application");
}
```

## 📊 Smart Routing

The library includes intelligent source selection:

### Exchange Rates
- **Single-day queries** (`from == to`): Routes to **Vietcombank** (official bank rates)
- **Date range queries** (`from != to`): Routes to **Yahoo Finance** (bulk efficiency)

### Gold Premium Calculation
Automatically fetches and combines:
- Gold prices (SJC)
- Exchange rates (smart routing)
- International spot prices (Yahoo Finance)
- Calculates premium percentage and value

## 🔍 Resolution Types

| Resolution | Description |
|-----------|-------------|
| `1` | 1 minute |
| `5` | 5 minutes |
| `15` | 15 minutes |
| `30` | 30 minutes |
| `60` | 1 hour |
| `1D` | 1 day |
| `1W` | 1 week |
| `1M` | 1 month |

## 📚 Available Data Sources

| Source | Type | Provider | Markets |
|--------|------|----------|---------|
| `vndirect` | Stock | VNDIRECT | Vietnamese stocks |
| `ssi` | Stock | SSI | Vietnamese stocks |
| `yahoo_finance` | Stock | Yahoo Finance | Global stocks |
| `sjc` | Gold | SJC Gold Company | Vietnamese gold |
| `vietcombank` | Exchange Rate | Vietcombank | 20+ currencies |
| `yahoo_finance` | Exchange Rate | Yahoo Finance | All major currencies |

## 🛠️ Development

### Build Library Only
```bash
cargo build
```

### Build Server
```bash
cargo build --features server
```

### Run Tests
```bash
cargo test
```

### Format Code
```bash
cargo fmt
```

### Lint
```bash
cargo clippy
```

## 🚢 Production Deployment

### Library Usage
Simply include as a dependency in your `Cargo.toml`.

### Server Deployment

**Build optimized binary:**
```bash
cargo build --release --features server
```

Binary: `target/release/fin-catch-server`

**Docker:**
```dockerfile
FROM rust:1.70 as builder
WORKDIR /app
COPY . .
RUN cargo build --release --features server

FROM debian:bookworm-slim
COPY --from=builder /app/target/release/fin-catch-server /usr/local/bin/
EXPOSE 3000
CMD ["fin-catch-server"]
```

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
