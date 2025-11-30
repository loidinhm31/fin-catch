# FinCatch API - Technical Documentation

## Overview

FinCatch API is a unified interface for fetching financial market data from multiple data sources. The API supports stock market data (Vietnamese and global markets), gold price data (physical gold and futures), and exchange rate data through a consistent interface.

## Architecture

The API uses a **Gateway Pattern** to route requests to different data sources:

```
User Request → Gateway → Source Selection → Data Source → Response Mapping → Unified Response
```

### Key Components

1. **Gateway** (`src/gateway/mod.rs`): Routes requests to appropriate data sources
2. **Data Sources** (`src/sources/`): Implements data fetching from external APIs
3. **Models** (`src/models/`): Defines unified request/response structures
4. **Routes** (`src/routes/`): Exposes REST API endpoints

## Data Source Types

### Stock Data Sources

Stock data sources implement the `StockDataSource` trait and provide historical stock price data (OHLCV - Open, High, Low, Close, Volume).

#### 1. VNDIRECT Source

**Source Name**: `vndirect`
**Base URL**: `https://dchart-api.vndirect.com.vn`
**Provider**: VNDIRECT Securities Corporation

**Parameters**:
- `symbol`: Stock symbol (e.g., "VNM", "VCB", "HPG")
- `resolution`: Timeframe/interval
  - Supported values: `"1"`, `"5"`, `"15"`, `"30"`, `"60"`, `"1D"`, `"1W"`, `"1M"`
  - Minutes: 1, 5, 15, 30, 60
  - Daily, Weekly, Monthly: 1D, 1W, 1M
- `from`: Start timestamp (Unix timestamp in seconds)
- `to`: End timestamp (Unix timestamp in seconds)

**API Response Format**:
```json
{
  "s": "ok",
  "t": [timestamp1, timestamp2, ...],
  "o": [open1, open2, ...],
  "h": [high1, high2, ...],
  "l": [low1, low2, ...],
  "c": [close1, close2, ...],
  "v": [volume1, volume2, ...]
}
```

**Example Request**:
```bash
curl -X POST "http://localhost:3000/api/v1/stock/history" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "VNM",
    "resolution": "1D",
    "from": 1730764800,
    "to": 1731110400,
    "source": "vndirect"
  }'
```

**Implementation Notes**:
- Uses short field names (s, t, o, h, l, c, v) to minimize payload size
- All arrays must have the same length
- Timestamps are in seconds

---

#### 2. SSI Source

**Source Name**: `ssi`
**Base URL**: `https://iboard-api.ssi.com.vn`
**Provider**: SSI Securities Corporation (Saigon Securities Inc.)

**Parameters**:
- `symbol`: Stock symbol (e.g., "VNM", "VCB", "HPG")
- `resolution`: Timeframe/interval
  - Supported values: `"1"`, `"5"`, `"15"`, `"30"`, `"60"`, `"1D"`, `"1W"`, `"1M"`
- `from`: Start timestamp (Unix timestamp in seconds)
- `to`: End timestamp (Unix timestamp in seconds)

**API Response Format**:
SSI supports multiple response formats:

Format 1 (Status Arrays):
```json
{
  "s": "ok",
  "t": [timestamp1, timestamp2, ...],
  "o": [open1, open2, ...],
  "h": [high1, high2, ...],
  "l": [low1, low2, ...],
  "c": [close1, close2, ...],
  "v": [volume1, volume2, ...]
}
```

Format 2 (Object Arrays):
```json
{
  "status": "ok",
  "data": {
    "t": [timestamp1, timestamp2, ...],
    "o": [open1, open2, ...],
    "h": [high1, high2, ...],
    "l": [low1, low2, ...],
    "c": [close1, close2, ...],
    "v": [volume1, volume2, ...]
  }
}
```

**Example Request**:
```bash
curl -X POST "http://localhost:3000/api/v1/stock/history" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "HPG",
    "resolution": "1D",
    "from": 1730764800,
    "to": 1731110400,
    "source": "ssi"
  }'
```

**Implementation Notes**:
- Supports two different response formats using Rust's `#[serde(untagged)]` enum
- Automatically detects and parses the correct format
- Uses the same field naming convention as VNDIRECT

---

#### 3. Yahoo Finance Source

**Source Name**: `yahoo_finance`
**Base URL**: `https://query1.finance.yahoo.com`
**Provider**: Yahoo Finance

**Parameters**:
- `symbol`: Instrument symbol (supports multiple types):
  - Stocks: "TSLA", "AAPL", "GOOGL", "MSFT"
  - Gold futures: "GC=F" (COMEX Gold)
  - Silver futures: "SI=F" (COMEX Silver)
  - Oil futures: "CL=F" (WTI Crude Oil)
  - Cryptocurrency: "BTC-USD", "ETH-USD"
  - Indices: "^GSPC" (S&P 500), "^DJI" (Dow Jones)
- `resolution`: Timeframe/interval
  - Supported values: `"1"`, `"5"`, `"15"`, `"30"`, `"60"`, `"1D"`, `"1W"`, `"1M"`
  - Maps to Yahoo Finance intervals: `1m`, `5m`, `15m`, `30m`, `1h`, `1d`, `1wk`, `1mo`
- `from`: Start timestamp (Unix timestamp in seconds)
- `to`: End timestamp (Unix timestamp in seconds)

**API Response Format**:
```json
{
  "chart": {
    "result": [
      {
        "meta": {
          "currency": "USD",
          "symbol": "GC=F",
          "exchangeName": "CMX",
          "instrumentType": "ALTSYMBOL"
        },
        "timestamp": [1730433600, 1730520000, ...],
        "indicators": {
          "quote": [
            {
              "open": [2745.5, 2750.0, ...],
              "high": [2756.0, 2760.0, ...],
              "low": [2734.199951171875, 2740.0, ...],
              "close": [2738.60009765625, 2755.0, ...],
              "volume": [109, 120, ...]
            }
          ]
        }
      }
    ],
    "error": null
  }
}
```

**Example Request - Tesla Stock**:
```bash
curl -X POST "http://localhost:3000/api/v1/stock/history" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "TSLA",
    "resolution": "1D",
    "from": 1730419200,
    "to": 1731024000,
    "source": "yahoo_finance"
  }'
```

**Example Request - Gold Futures**:
```bash
curl -X POST "http://localhost:3000/api/v1/stock/history" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "GC=F",
    "resolution": "1D",
    "from": 1730419200,
    "to": 1731024000,
    "source": "yahoo_finance"
  }'
```

**Implementation Notes**:
- Uses nested JSON structure with `chart.result[0].indicators.quote[0]`
- Supports null values in OHLCV arrays (filtered out in response)
- Resolution mapping: Internal format (1D) → Yahoo format (1d)
- Global market coverage (not limited to Vietnamese markets)
- Supports multiple instrument types through single API endpoint
- Rate limiting may apply (HTTP 429 responses)
- Uses modified User-Agent header to avoid restrictions

**Key Use Cases**:
- **Gold Futures (GC=F)**: Trading/spot prices for gold futures contracts (COMEX)
- **Stocks**: Global stock market data (US, international)
- **Commodities**: Oil (CL=F), Silver (SI=F), etc.
- **Crypto**: Bitcoin, Ethereum, and other cryptocurrencies

**Gold Futures vs Physical Gold**:
- **Gold Futures (GC=F)** via Yahoo Finance: Represents tradable futures contracts on COMEX
- **Physical Gold** via SJC/MiHong: Represents buy/sell prices at physical gold shops in Vietnam
- Use GC=F for futures trading data, use SJC/MiHong for physical gold purchase pricing

---

### Gold Data Sources

Gold data sources implement the `GoldDataSource` trait and provide historical gold price data (buy/sell prices).

#### 4. SJC Source

**Source Name**: `sjc`
**Base URL**: `https://sjc.com.vn`
**Provider**: SJC Gold Company Limited

**Parameters**:
- `gold_price_id`: Gold product type ID
  - **Supported values**: `"1"`, `"2"`, `"3"`, `"4"`, `"5"`
  - `"1"`: Ho Chi Minh Center
  - `"2"`: Ha Noi Center
- `from`: Start timestamp (Unix timestamp in seconds)
- `to`: End timestamp (Unix timestamp in seconds)

**API Request Format**:
The SJC API uses form data (application/x-www-form-urlencoded):
- `method`: "GetGoldPriceHistory"
- `fromDate`: MM/DD/YYYY format
- `toDate`: MM/DD/YYYY format
- `goldPriceId`: Product ID (1-5)

**API Response Format**:
```json
{
  "success": true,
  "data": [
    {
      "Id": 123,
      "TypeName": "Vàng SJC 1L, 10L, 1KG",
      "BranchName": "Hồ Chí Minh",
      "Buy": "78,000",
      "BuyValue": 78000000,
      "Sell": "79,000",
      "SellValue": 79000000,
      "BuyDiffer": "+100",
      "BuyDifferValue": 100000,
      "SellDiffer": "+200",
      "SellDifferValue": 200000,
      "GroupDate": "/Date(1730764800000)/"
    }
  ]
}
```

**Date Format**:
SJC uses .NET JSON date format: `/Date(milliseconds)/`
- Example: `/Date(1730764800000)/` represents October 27, 2024

**Example Request**:
```bash
curl -X POST "http://localhost:3000/api/v1/gold/history" \
  -H "Content-Type: application/json" \
  -d '{
    "gold_price_id": "1",
    "from": 1730764800,
    "to": 1731110400,
    "source": "sjc" 
  }'
```

**Implementation Notes**:
- Uses POST with form data, not JSON
- Requires specific headers: Origin, Referer, X-Requested-With
- Date conversion: Unix timestamp → MM/DD/YYYY format
- Response parsing: .NET date format → Unix timestamp
- Prices are in VND (Vietnamese Dong) per tael
- Returns data grouped by branch/location

---

#### 5. MiHong Source

**Source Name**: `mihong`
**Base URL**: `https://mihong.vn`
**Provider**: MiHong Vietnam

**Parameters**:
- `gold_price_id`: Gold purity/type code
  - **Supported values**: `"SJC"`, `"999"`, `"985"`, `"980"`, `"950"`, `"750"`, `"680"`, `"610"`, `"580"`, `"410"`
  - `"SJC"`: SJC gold (special brand)
  - `"999"`: 24K gold (99.9% purity) - **DEFAULT**
  - `"985"`: 23.64K gold (98.5% purity)
  - `"980"`: 23.52K gold (98.0% purity)
  - `"950"`: 22.8K gold (95.0% purity)
  - `"750"`: 18K gold (75.0% purity)
  - `"680"`: 16.32K gold (68.0% purity)
  - `"610"`: 14.64K gold (61.0% purity)
  - `"580"`: 13.92K gold (58.0% purity)
  - `"410"`: 9.84K gold (41.0% purity)
- `from`: Start timestamp (Unix timestamp in seconds)
- `to`: End timestamp (Unix timestamp in seconds)

**Date Type Selection** (automatic):
The API automatically calculates the appropriate `date_type` based on the time range:
- `"1"`: 1 hour (range ≤ 1 hour)
- `"2"`: 24 hours (range ≤ 24 hours)
- `"3"`: 15 days (range ≤ 15 days)
- `"4"`: 1 month (range ≤ 30 days) - **DEFAULT**
- `"5"`: 6 months (range ≤ 180 days)
- `"7"`: 1 year (range > 180 days)

**Session Management**:
MiHong requires session-based authentication:
1. First, visit the main page to obtain session cookies
2. Use those cookies for subsequent API requests
3. Requires `XSRF-TOKEN` and `laravel_session` cookies

**API Response Format**:
```json
{
  "success": true,
  "data": [
    {
      "buy": 14755555,
      "sell": 14875555,
      "date": "2025/10/27 00:00:00"
    }
  ]
}
```

**Date Format**:
MiHong uses slash-separated date format: `YYYY/MM/DD HH:MM:SS`
- May include escaped slashes: `2025\/10\/27 00:00:00`

**Example Request**:
```bash
curl -X POST "http://localhost:3000/api/v1/gold/history" \
  -H "Content-Type: application/json" \
  -d '{
    "gold_price_id": "999",
    "from": 1730764800,
    "to": 1731110400,
    "source": "mihong"
  }'
```

**Implementation Notes**:
- Requires cookie jar for session management
- SSL certificate validation is disabled (self-signed cert issue)
- Automatically initializes session before each request
- Date parsing handles both `\/` and `/` formats
- **Prices are in mace unit (3.75g)** - needs to be multiplied by 10 to convert to tael (37.5g)
- Returns aggregated data (not branch-specific)
- `type_name` in response uses the `gold_price_id` from the request

**Unit Conversion**:
- MiHong uses **mace** as the unit: 1 mace = 3.75g
- Vietnamese tael: 1 tael = 37.5g = 10 mace
- To convert MiHong prices to tael: multiply by 10

---

### Exchange Rate Data Sources

Exchange rate data sources implement the `ExchangeRateDataSource` trait and provide historical exchange rate data (buy/sell rates for foreign currencies).

#### 6. Vietcombank Source

**Source Name**: `vietcombank`
**Base URL**: `https://www.vietcombank.com.vn`
**Provider**: Vietcombank (Vietnam Joint Stock Commercial Bank for Foreign Trade)

**Parameters**:
- `currency_code`: Currency code or "ALL" for all currencies
  - **Supported values**: `"USD"`, `"EUR"`, `"GBP"`, `"JPY"`, `"AUD"`, `"SGD"`, `"THB"`, `"CAD"`, `"CHF"`, `"HKD"`, `"CNY"`, `"DKK"`, `"INR"`, `"KRW"`, `"KWD"`, `"MYR"`, `"NOK"`, `"RUB"`, `"SAR"`, `"SEK"`, or `"ALL"`
  - `"USD"`: US Dollar
  - `"EUR"`: Euro
  - `"GBP"`: UK Pound Sterling
  - `"JPY"`: Japanese Yen
  - `"ALL"`: Returns all available currencies (20+ currencies)
- `from`: Start timestamp (Unix timestamp in seconds)
- `to`: End timestamp (Unix timestamp in seconds)

**Constraints**:
- **Maximum date range**: 180 days
- Requests exceeding 180 days will be rejected with validation error
- **Smart fetching strategy**:
  - Small requests (1-5 days): Sequential fetching with 500ms delay
  - Larger requests (6+ days): Concurrent batching (5 requests/batch) with 500ms delay between batches
- Data is fetched per day (one request per date)
- **Partial success support**: Returns successful data even if some dates fail
- Failed dates are reported in response metadata

**API Response Format**:
```json
{
  "Count": 20,
  "Date": "2025-11-02T00:00:00",
  "UpdatedDate": "2025-11-02T23:00:00+07:00",
  "Data": [
    {
      "currencyName": "US DOLLAR",
      "currencyCode": "USD",
      "cash": "26077.00",
      "transfer": "26107.00",
      "sell": "26347.00",
      "icon": "/-/media/Default-Website/Default-Images/Icons/Flags/im_flag_usa.svg"
    }
  ]
}
```

**Example Request - Single Currency**:
```bash
curl -X POST "http://localhost:3000/api/v1/exchange-rate/history" \
  -H "Content-Type: application/json" \
  -d '{
    "currency_code": "USD",
    "from": 1730764800,
    "to": 1731110400,
    "source": "vietcombank"
  }'
```

**Example Request - All Currencies**:
```bash
curl -X GET "http://localhost:3000/api/v1/exchange-rate/history?currency_code=ALL&from=1731024000&to=1731110400"
```

**Implementation Notes**:
- Fetches data from Vietcombank's public exchange rate API
- Converts Unix timestamps to YYYY-MM-DD format for API requests
- Generates list of dates for the range and fetches each separately
- **Performance optimizations**:
  - Adaptive fetching: Sequential for small requests, concurrent batching for larger requests
  - Concurrent batching processes 5 dates simultaneously for faster data retrieval
  - Maintains 500ms delay between batches to respect API rate limits
- **Reliability features**:
  - Partial success: Returns data from successful dates even if some dates fail
  - Failed dates are tracked and reported in response metadata
  - Individual date failures don't cause entire request to fail
- Some currencies may not have `buy_cash` or `buy_transfer` rates (returned as null)
- All rates are in VND (Vietnamese Dong)
- Date validation at request level prevents excessive API calls
- Follows the same error handling and logging patterns as other sources

**Supported Currencies** (20+ currencies):
- USD, EUR, GBP, JPY - Major currencies
- AUD, SGD, THB, CAD, CHF - Regional currencies
- HKD, CNY, DKK, INR, KRW - Asian currencies
- KWD, MYR, NOK, RUB, SAR, SEK - Other currencies

---

## Key Differences Between Sources

### Stock Sources: VNDIRECT vs SSI vs Yahoo Finance

| Feature | VNDIRECT | SSI | Yahoo Finance |
|---------|----------|-----|---------------|
| **Response Format** | Single format | Multiple formats | Nested JSON |
| **Base URL** | dchart-api.vndirect.com.vn | iboard-api.ssi.com.vn | query1.finance.yahoo.com |
| **Resolution Support** | 1, 5, 15, 30, 60, 1D, 1W, 1M | 1, 5, 15, 30, 60, 1D, 1W, 1M | 1, 5, 15, 30, 60, 1D, 1W, 1M |
| **Market Coverage** | Vietnam only | Vietnam only | Global (US, international) |
| **Instrument Types** | Stocks only | Stocks only | Stocks, futures, crypto, indices |
| **Commodity Support** | No | No | Yes (GC=F, SI=F, CL=F, etc.) |
| **Authentication** | None | None | None |
| **Rate Limiting** | Not observed | Not observed | Yes (HTTP 429) |
| **Null Values** | No | No | Yes (filtered in response) |

### Gold Sources: SJC vs MiHong

| Feature | SJC                                           | MiHong |
|---------|-----------------------------------------------|--------|
| **Gold Type Parameter** | Numeric ID (1-2)                              | Code (SJC, 999, 985, etc.) |
| **Gold Type Meaning** | Product type (location - Ho Chi Minh, Ha Noi) | Purity percentage |
| **Authentication** | None                                          | Session cookies required |
| **Date Format Input** | MM/DD/YYYY                                    | Auto-calculated from timestamp |
| **Date Format Response** | .NET JSON (/Date(ms)/)                        | YYYY/MM/DD HH:MM:SS |
| **Request Method** | Form data (POST)                              | Query parameters (GET) |
| **Branch Data** | Yes (by location)                             | No (aggregated) |
| **Date Range Options** | Free-form                                     | Predefined (1H, 24H, 15D, 1M, 6M, 1Y) |
| **SSL Certificate** | Valid                                         | Self-signed (bypassed) |

**Critical Difference for `gold_price_id`**:
- **SJC**: Uses simple numeric IDs (1, 2, 3, 4, 5) representing product categories
  - Example: `"1"` = Gold bars, `"2"` = 24K jewelry
- **MiHong**: Uses purity codes (999, 985, 750, etc.) or brand codes (SJC)
  - Example: `"999"` = 24K gold (99.9%), `"750"` = 18K gold (75.0%)
  - The `gold_price_id` is used directly as the `type_name` in the response

## Unified Response Format

### Stock History Response

```json
{
  "symbol": "VNM",
  "resolution": "1D",
  "source": "vndirect",
  "status": "ok",
  "data": [
    {
      "timestamp": 1730764800,
      "open": 100000,
      "high": 102000,
      "low": 99000,
      "close": 101000,
      "volume": 1000000
    }
  ]
}
```

### Gold Price Response

```json
{
  "gold_price_id": "999",
  "source": "mihong",
  "status": "ok",
  "data": [
    {
      "timestamp": 1730764800,
      "type_name": "999",
      "branch_name": "Company Name",
      "buy": 14755555.0,
      "sell": 14875555.0,
      "buy_differ": 100000.0,
      "sell_differ": 200000.0
    }
  ]
}
```

**Fields**:
- `timestamp`: Unix timestamp in seconds
- `type_name`: For MiHong, this is the `gold_price_id` (e.g., "999", "SJC")
- `branch_name`: Optional, company/branch name (only from MiHong)
- `buy`/`sell`: Prices in VND per tael
- `buy_differ`/`sell_differ`: Optional, price change from previous

### Exchange Rate Response

```json
{
  "currency_code": "USD",
  "source": "vietcombank",
  "status": "ok",
  "data": [
    {
      "timestamp": 1730764800,
      "currency_code": "USD",
      "currency_name": "US DOLLAR",
      "buy_cash": 25130.0,
      "buy_transfer": 25160.0,
      "sell": 25460.0
    }
  ]
}
```

**Fields**:
- `timestamp`: Unix timestamp in seconds
- `currency_code`: Currency code (e.g., "USD", "EUR")
- `currency_name`: Full currency name (e.g., "US DOLLAR", "EURO")
- `buy_cash`: Optional, buy rate for cash transactions (may be null for some currencies)
- `buy_transfer`: Optional, buy rate for transfer transactions (may be null for some currencies)
- `sell`: Sell rate in VND

## API Endpoints

### Stock Market Data

#### GET `/api/v1/stock/history`
Fetch stock historical data using query parameters.

**Query Parameters**:
- `symbol` (required): Stock symbol
- `resolution` (required): Timeframe (1, 5, 15, 30, 60, 1D, 1W, 1M)
- `from` (required): Start timestamp (seconds)
- `to` (required): End timestamp (seconds)
- `source` (optional): Data source ("vndirect", "ssi", or "yahoo_finance", default: "vndirect")

#### POST `/api/v1/stock/history`
Fetch stock historical data using JSON body.

**Request Body**:
```json
{
  "symbol": "VNM",
  "resolution": "1D",
  "from": 1730764800,
  "to": 1731110400,
  "source": "vndirect"
}
```

---

### Gold Price Data

#### GET `/api/v1/gold/history`
Fetch gold price data using query parameters.

**Query Parameters**:
- `gold_price_id` (required): Gold type ID/code
- `from` (required): Start timestamp (seconds)
- `to` (required): End timestamp (seconds)
- `source` (optional): Data source ("sjc" or "mihong", default: "sjc")

#### POST `/api/v1/gold/history`
Fetch gold price data using JSON body.

**Request Body**:
```json
{
  "gold_price_id": "999",
  "from": 1730764800,
  "to": 1731110400,
  "source": "mihong"
}
```

---

### Exchange Rate Data

#### GET `/api/v1/exchange-rate/history`
Fetch exchange rate data using query parameters.

**Query Parameters**:
- `currency_code` (required): Currency code (e.g., "USD", "EUR") or "ALL" for all currencies
- `from` (required): Start timestamp (seconds)
- `to` (required): End timestamp (seconds)
- `source` (optional): Data source ("vietcombank", default: "vietcombank")

**Constraints**:
- Maximum date range: 180 days
- Requests exceeding 180 days will be rejected with validation error

**Example**:
```bash
curl 'http://localhost:3000/api/v1/exchange-rate/history?currency_code=USD&from=1730764800&to=1731110400'
```

#### POST `/api/v1/exchange-rate/history`
Fetch exchange rate data using JSON body.

**Request Body**:
```json
{
  "currency_code": "USD",
  "from": 1730764800,
  "to": 1731110400,
  "source": "vietcombank"
}
```

**Example - All Currencies**:
```json
{
  "currency_code": "ALL",
  "from": 1731024000,
  "to": 1731110400,
  "source": "vietcombank"
}
```

---

### Gold Premium Data

The Gold Premium API calculates the premium rate between local gold prices (Vietnam) and international gold spot prices.

#### GET `/api/v1/gold-premium`
Calculate gold premium rates using query parameters.

**Query Parameters**:
- `from` (required): Start timestamp (seconds)
- `to` (required): End timestamp (seconds)
- `gold_price_id` (optional): Gold type ID/code (default: "1" for SJC, or appropriate code for MiHong)
- `currency_code` (optional): Currency code (default: "USD")
- `gold_source` (optional): Gold data source ("sjc" or "mihong", default: "mihong")
- `exchange_rate_source` (optional): Exchange rate source with **smart routing**:
  - If not specified: Single day (`from == to`) → uses "vietcombank", Date range → uses "yahoo_finance"
  - If specified: Uses the specified source (overrides smart routing)
- `stock_source` (optional): Stock/futures source (default: "yahoo_finance")

**Example**:
```bash
curl 'http://localhost:3000/api/v1/gold-premium?from=1730764800&to=1731110400&gold_price_id=1&currency_code=USD&gold_source=sjc'
```

#### POST `/api/v1/gold-premium`
Calculate gold premium rates using JSON body.

**Request Body**:
```json
{
  "from": 1730764800,
  "to": 1731110400,
  "gold_price_id": "1",
  "currency_code": "USD",
  "gold_source": "sjc",
  "exchange_rate_source": "vietcombank",
  "stock_source": "yahoo_finance"
}
```

**Response Format**:
```json
{
  "status": "ok",
  "data": [
    {
      "timestamp": 1730769475,
      "target_price": 89000000.0,
      "market_price_usd": 2740.300048828125,
      "exchange_rate": 25460.0,
      "market_price_vnd": 84140255.32725586,
      "premium_rate": 5.7757664911315105,
      "gold_type": "Vàng SJC 1L, 10L, 1KG"
    }
  ],
  "metadata": {
    "gold_source": "sjc",
    "exchange_rate_source": "vietcombank",
    "stock_source": "yahoo_finance",
    "formula": "Premium (%) = [(Target Price - Market Price VND) / Market Price VND] × 100%",
    "conversion": "Market Price VND = USD/oz × Exchange Rate × 1.206 (1 tael = 1.206 troy oz)",
    "note": "Gold prices are already in full VND"
  }
}
```

**Response Fields**:
- `timestamp`: Unix timestamp in seconds
- `target_price`: Local gold price in VND per tael
- `market_price_usd`: International gold spot price in USD per troy ounce (from GC=F futures)
- `exchange_rate`: USD to VND exchange rate
- `market_price_vnd`: International price converted to VND per tael (using 1 tael = 1.206 troy oz)
- `premium_rate`: Premium percentage
- `gold_type`: Gold product type/name

**Implementation Details**:
1. **Fetches gold price data first** to determine the actual date range
2. **Smart exchange rate routing** (based on original request dates):
   - Single day queries: Uses Vietcombank for official Vietnamese bank rates with buy/sell spreads
   - Date range queries: Uses Yahoo Finance for fast bulk fetching (10-15x faster)
   - Can be overridden with explicit `exchange_rate_source` parameter
3. **Uses gold timestamps as base** and finds matching exchange rate and stock data by day
4. **Normalizes timestamps** to start of day (00:00:00 UTC) for matching across sources
5. **Unit conversion for MiHong**: Automatically multiplies prices by 10 (mace to tael conversion)
6. **Premium calculation formula**:
   - Market Price VND = (USD/oz) × (Exchange Rate) × 1.206
   - Premium (%) = [(Target Price - Market Price VND) / Market Price VND] × 100%

**Performance Benefits**:
- **Single day**: ~1 second (Vietcombank with official rates and spreads)
- **7-day range**: ~2 seconds (Yahoo Finance bulk fetch vs ~4 seconds with Vietcombank)
- **30-day range**: ~2 seconds (Yahoo Finance bulk fetch vs ~15 seconds with Vietcombank)

**Source-Specific Behavior**:
- **SJC source**: Prices are already in VND per tael, no conversion needed
- **MiHong source**: Prices are in mace (3.75g), automatically converted to tael by multiplying by 10
  - 1 tael = 37.5g = 10 mace

**Data Flow**:
1. Fetch gold price data from selected source (sjc/mihong)
2. Determine min/max timestamps from gold data
3. Fetch exchange rate data (USD/VND) for date range
4. Fetch stock data (GC=F gold futures) for date range
5. Match data by day and calculate premium for each gold price point

**Example - SJC Source**:
```bash
curl -X POST 'http://localhost:3000/api/v1/gold-premium' \
  -H 'Content-Type: application/json' \
  -d '{
    "from": 1730764800,
    "to": 1731110400,
    "gold_price_id": "1",
    "currency_code": "USD",
    "gold_source": "sjc"
  }'
```

**Example - MiHong Source**:
```bash
curl -X POST 'http://localhost:3000/api/v1/gold-premium' \
  -H 'Content-Type: application/json' \
  -d '{
    "from": 1730764800,
    "to": 1731110400,
    "gold_price_id": "999",
    "currency_code": "USD",
    "gold_source": "mihong"
  }'
```

**Notes**:
- Gold futures symbol used: **GC=F** (COMEX Gold Futures) from Yahoo Finance
- Exchange rate: Typically uses Vietcombank rates
- Premium rates typically range from 4% to 8% for Vietnamese market
- MiHong may have timestamp issues (future dates), use SJC for current/accurate data

---

### Source Information

#### GET `/api/v1/sources`
Get metadata about all available data sources.

**Response**:
```json
{
  "metadata": {
    "vndirect": {
      "source": "vndirect",
      "base_url": "https://dchart-api.vndirect.com.vn",
      "provider": "VNDIRECT",
      "supports_resolutions": ["1", "5", "15", "30", "60", "1D", "1W", "1M"]
    },
    "ssi": { ... },
    "yahoo_finance": {
      "source": "yahoo_finance",
      "base_url": "https://query1.finance.yahoo.com",
      "provider": "Yahoo Finance",
      "supports_resolutions": ["1m", "5m", "15m", "30m", "1h", "1d", "1wk", "1mo"],
      "supports_symbols": ["stocks", "indices", "forex", "crypto", "futures", "commodities"],
      "notes": "Supports a wide range of financial instruments including gold futures (GC=F), silver (SI=F), oil (CL=F), etc."
    },
    "sjc": { ... },
    "mihong": { ... },
    "vietcombank": {
      "source": "vietcombank",
      "base_url": "https://www.vietcombank.com.vn",
      "data_type": "exchange_rate",
      "provider": "Vietcombank",
      "country": "Vietnam",
      "max_date_range_days": 180,
      "rate_limit": "500ms between requests",
      "supported_currencies": "ALL (USD, EUR, JPY, etc.)"
    }
  },
  "sources_by_type": {
    "stock": ["vndirect", "ssi", "yahoo_finance"],
    "gold": ["sjc", "mihong"],
    "exchange_rate": ["vietcombank"]
  }
}
```

#### GET `/api/v1/health`
Check health status of all data sources.

**Response**:
```json
{
  "vndirect": true,
  "ssi": true,
  "yahoo_finance": true,
  "sjc": true,
  "mihong": false,
  "vietcombank": true
}
```

## Error Handling

### Error Response Format
```json
{
  "symbol": "VNM",
  "resolution": "1D",
  "source": "vndirect",
  "status": "error",
  "error": "Error message describing what went wrong"
}
```

### Common Error Scenarios

1. **Invalid Parameters**
   - Status Code: 400 Bad Request
   - Empty symbol, invalid resolution, invalid timestamp range

2. **Unknown Source**
   - Status Code: 400 Bad Request
   - Requested source not registered in gateway

3. **Data Source Error**
   - Status Code: 502 Bad Gateway
   - External API returned error or is unavailable

4. **Timeout**
   - Status Code: 502 Bad Gateway
   - Request to external API timed out (30 seconds)

## Implementation Details

### Request Flow

1. **Request Validation**
   - Validate required fields
   - Check timestamp range (from < to)
   - Verify source name (if specified)

2. **Source Selection**
   - Use specified source or default
   - Lookup source in gateway registry

3. **Data Fetching**
   - For MiHong: Initialize session first
   - Transform request format (e.g., timestamp → date string)
   - Add required headers
   - Make HTTP request with timeout

4. **Response Mapping**
   - Parse external API response
   - Transform to unified format
   - Handle errors gracefully

5. **Return Response**
   - Return unified response structure
   - Include source metadata

### Date/Time Handling

- **Input**: Unix timestamp in seconds (e.g., 1730764800)
- **SJC**: Convert to MM/DD/YYYY (e.g., "10/27/2024")
- **MiHong**: Automatically select date_type based on range
- **Vietcombank**: Convert to YYYY-MM-DD (e.g., "2024-10-27"), generates list of dates for range
- **Response**: Convert back to Unix timestamp in seconds

### Timezone Considerations

All timestamps are handled in UTC:
- Input timestamps are treated as UTC
- Date conversions use UTC
- Response timestamps are in UTC

## Adding New Data Sources

### For Stock Sources

1. Create new file in `src/sources/your_source.rs`
2. Implement `StockDataSource` trait:
   ```rust
   #[async_trait]
   impl StockDataSource for YourSource {
       fn name(&self) -> &str { "your_source" }
       async fn fetch_history(&self, request: &StockHistoryRequest) -> ApiResult<StockHistoryResponse>
       async fn health_check(&self) -> ApiResult<bool>
       fn metadata(&self) -> serde_json::Value
   }
   ```
3. Register in `src/sources/mod.rs`
4. Add to gateway in `src/main.rs`

### For Gold Sources

1. Create new file in `src/sources/your_source.rs`
2. Implement `GoldDataSource` trait:
   ```rust
   #[async_trait]
   impl GoldDataSource for YourSource {
       fn name(&self) -> &str { "your_source" }
       async fn fetch_history(&self, request: &GoldPriceRequest) -> ApiResult<GoldPriceResponse>
       async fn health_check(&self) -> ApiResult<bool>
       fn metadata(&self) -> serde_json::Value
   }
   ```
3. Register in `src/sources/mod.rs`
4. Add to gateway in `src/main.rs`

### For Exchange Rate Sources

1. Create new file in `src/sources/your_source.rs`
2. Implement `ExchangeRateDataSource` trait:
   ```rust
   #[async_trait]
   impl ExchangeRateDataSource for YourSource {
       fn name(&self) -> &str { "your_source" }
       async fn fetch_history(&self, request: &ExchangeRateRequest) -> ApiResult<ExchangeRateResponse>
       async fn health_check(&self) -> ApiResult<bool>
       fn metadata(&self) -> serde_json::Value
   }
   ```
3. Register in `src/sources/mod.rs`
4. Add to gateway in `src/main.rs`

## Testing

Test scripts are provided in the `examples/` directory:
- `test_vndirect.sh` - Test VNDIRECT stock source
- `test_ssi.sh` - Test SSI stock source
- `test_yahoo_finance.sh` - Test Yahoo Finance source (stocks, gold futures, crypto)
- `test_sjc.sh` - Test SJC gold source
- `test_mihong.sh` - Test MiHong gold source
- `test_vietcombank.sh` - Test Vietcombank exchange rate source
- `test_all_sources.sh` - Test all sources

Run the server:
```bash
cargo run
```

Execute tests:
```bash
./examples/test_yahoo_finance.sh
./examples/test_mihong.sh
./examples/test_sjc.sh
./test_vietcombank.sh
```

Documentation:
- `examples/yahoo_finance_usage.md` - Complete usage guide for Yahoo Finance integration
- `examples/vietcombank_usage.md` - Complete usage guide for Vietcombank exchange rates
- `VIETCOMBANK_IMPLEMENTATION.md` - Technical implementation details for Vietcombank source

## Performance Considerations

- **Request Timeout**: 30 seconds (configurable per source)
- **Connection Timeout**: 10 seconds
- **Session Caching**: MiHong uses persistent cookie jar per client instance
- **Concurrent Requests**: Supported via async/await

## Security Notes

1. **MiHong SSL**: Currently bypasses SSL certificate validation due to self-signed certificate
2. **CORS**: Permissive CORS policy enabled (adjust for production)
3. **Rate Limiting**:
   - Not implemented on API side (should be added for production)
   - Yahoo Finance enforces rate limiting (HTTP 429 responses)
   - Vietcombank: Implements 500ms sleep between requests to avoid rate limiting
4. **API Keys**: Not required for any current sources
5. **User-Agent**: Yahoo Finance requires modified User-Agent headers to avoid restrictions
6. **Date Range Limits**: Vietcombank enforces 180-day maximum range to prevent excessive API calls

## Dependencies

- `axum`: Web framework
- `tokio`: Async runtime
- `reqwest`: HTTP client (with `cookies` feature for MiHong)
- `serde`/`serde_json`: Serialization
- `chrono`: Date/time handling
- `async-trait`: Async trait support
- `tracing`: Logging