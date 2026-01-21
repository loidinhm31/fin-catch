# SJC Gold Price IDs Reference

This document provides a comprehensive reference of all available gold price IDs from the SJC (Saigon Jewelry Company) API.

## Discovery Date
Last updated: 2026-01-21

## Overview

The SJC API provides gold prices across 38 different combinations of **gold types** and **locations/branches** throughout Vietnam. Each combination is identified by a unique `gold_price_id`.

## Gold Type Categories

### 1. Gold Bars (Vàng SJC 1L, 10L, 1KG)
Large gold bars - typically priced **per tael (lượng = 37.5g)**

| ID  | Location           | Notes              |
|-----|--------------------|--------------------|
| 1   | Hồ Chí Minh       | Ho Chi Minh City   |
| 2   | Miền Bắc          | Northern Region    |
| 4   | Nha Trang         |                    |
| 5   | Cà Mau            |                    |
| 7   | Huế               |                    |
| 8   | Biên Hòa          |                    |
| 9   | Miền Tây          | Western Region     |
| 10  | Quảng Ngãi        |                    |
| 13  | Hạ Long           |                    |
| 16  | Bạc Liêu          |                    |

**Unit**: Tael/Lượng (37.5g)
**Typical Price Range**: 160,000,000 - 162,000,000 VND per tael

---

### 2. 5 Chỉ Gold (Vàng SJC 5 chỉ)
Medium-sized gold pieces - typically priced **per tael (lượng)**

| ID  | Location           | Notes              |
|-----|--------------------|--------------------|
| 17  | Hồ Chí Minh       | Ho Chi Minh City   |
| 18  | Miền Bắc          | Northern Region    |
| 20  | Nha Trang         |                    |
| 21  | Cà Mau            |                    |
| 23  | Huế               |                    |
| 24  | Biên Hòa          |                    |
| 25  | Miền Tây          | Western Region     |
| 26  | Quảng Ngãi        |                    |
| 29  | Hạ Long           |                    |
| 32  | Bạc Liêu          |                    |

**Unit**: Tael/Lượng (37.5g)
**Typical Price Range**: 160,000,000 - 162,020,000 VND per tael
**Note**: Slightly higher sell price compared to large bars

---

### 3. Small Gold (Vàng SJC 0.5 chỉ, 1 chỉ, 2 chỉ)
Smaller gold pieces - typically priced **per tael (lượng)**

| ID  | Location           | Notes              |
|-----|--------------------|--------------------|
| 33  | Hồ Chí Minh       | Ho Chi Minh City   |
| 34  | Miền Bắc          | Northern Region    |
| 36  | Nha Trang         |                    |
| 37  | Cà Mau            |                    |
| 39  | Huế               |                    |
| 40  | Biên Hòa          |                    |
| 41  | Miền Tây          | Western Region     |
| 42  | Quảng Ngãi        |                    |
| 45  | Hạ Long           |                    |
| 48  | Bạc Liêu          |                    |

**Unit**: Tael/Lượng (37.5g)
**Typical Price Range**: 160,000,000 - 162,030,000 VND per tael
**Note**: Highest sell price premium among bar types

---

### 4. Gold Rings (Vàng nhẫn SJC 99.99% 1 chỉ, 2 chỉ, 5 chỉ)
Gold jewelry/rings - typically priced **per mace (chỉ = 3.75g)**

| ID  | Location           | Notes              |
|-----|--------------------|--------------------|
| 49  | Hồ Chí Minh       | Ho Chi Minh City   |
| 50  | Miền Bắc          | Northern Region    |
| 52  | Nha Trang         |                    |
| 53  | Cà Mau            |                    |
| 55  | Huế               |                    |
| 56  | Biên Hòa          |                    |
| 57  | Miền Tây          | Western Region     |
| 58  | Quảng Ngãi        |                    |

**Unit**: Per tael (API returns per-tael prices)
**Typical Price Range**: 156,500,000 - 159,000,000 VND per tael
**Note**: Lower prices compared to gold bars (jewelry has different markup)

---

## Important Notes

### API Response Format
When you query a gold price ID, the API returns:
- **timestamp**: Unix timestamp in seconds
- **type_name**: Gold type description (e.g., "Vàng SJC 1L, 10L, 1KG")
- **branch_name**: Location/branch name (e.g., "Hồ Chí Minh")
- **buy**: Buying price (VND)
- **sell**: Selling price (VND)
- **buy_differ**: Price difference from previous day (optional)
- **sell_differ**: Price difference from previous day (optional)

### Unit Conversion
⚠️ **CRITICAL**: The SJC API **ALWAYS returns prices per tael (lượng = 37.5g)**, regardless of the gold type's typical trading unit.

- 1 Tael (lượng) = 37.5g = 10 Chỉ
- 1 Mace (chỉ) = 3.75g = 1/10 Tael

Even gold rings (which are typically sold per chỉ) have their API prices returned per tael.

### Location Coverage
The API covers major cities and regions across Vietnam:
- **South**: Hồ Chí Minh, Biên Hòa, Miền Tây (Western Region), Cà Mau, Bạc Liêu
- **Central**: Nha Trang, Huế, Quảng Ngãi
- **North**: Miền Bắc (Northern Region), Hạ Long

### Missing IDs
The following IDs (3, 6, 11, 12, 14, 15, 19, 22, 27, 28, 30, 31, 35, 38, 43, 44, 46, 47, 51, 54, 59, 60) return error status and are likely:
- Discontinued product lines
- Reserved for future use
- Invalid/deleted entries

### Price Patterns
1. **Gold Bars (Large)**: Lowest sell premium
2. **5 Chỉ Gold**: +20,000 VND/tael sell premium
3. **Small Gold**: +30,000 VND/tael sell premium
4. **Gold Rings**: Lower overall price (different market segment)

## Usage Examples

### Fetching Gold Prices

#### Example 1: Ho Chi Minh Gold Bars
```rust
use fin_catch_data::{
    models::GoldPriceRequest,
    sources::{GoldDataSource, SjcSource},
};

let source = SjcSource::new();
let request = GoldPriceRequest {
    gold_price_id: "1".to_string(), // HCMC gold bars
    from: 1737936000, // 2025-01-27
    to: 1738022400,   // 2025-01-28
    source: Some("sjc".to_string()),
};

let response = source.fetch_history(&request).await?;
```

#### Example 2: Northern Region Gold Rings
```rust
let request = GoldPriceRequest {
    gold_price_id: "50".to_string(), // Miền Bắc gold rings
    from: 1737936000,
    to: 1738022400,
    source: Some("sjc".to_string()),
};

let response = source.fetch_history(&request).await?;
```

### Comparing Prices Across Locations

To compare gold bar prices across all locations:
```rust
let locations = vec![
    ("1", "Hồ Chí Minh"),
    ("2", "Miền Bắc"),
    ("4", "Nha Trang"),
    ("5", "Cà Mau"),
    ("7", "Huế"),
    ("8", "Biên Hòa"),
    ("9", "Miền Tây"),
    ("10", "Quảng Ngãi"),
    ("13", "Hạ Long"),
    ("16", "Bạc Liêu"),
];

for (id, location) in locations {
    let request = GoldPriceRequest {
        gold_price_id: id.to_string(),
        from: timestamp_from,
        to: timestamp_to,
        source: Some("sjc".to_string()),
    };
    let response = source.fetch_history(&request).await?;
    // Process response...
}
```

## Quick Reference Table

| Gold Type                  | ID Range | Count | Typical Unit Display |
|----------------------------|----------|-------|----------------------|
| Gold Bars (1L, 10L, 1KG)  | 1-16     | 10    | Per Tael (Lượng)     |
| 5 Chỉ Gold                | 17-32    | 10    | Per Tael (Lượng)     |
| Small Gold (0.5-2 Chỉ)    | 33-48    | 10    | Per Tael (Lượng)     |
| Gold Rings (99.99%)       | 49-58    | 8     | Per Mace (Chỉ)*      |

*Note: Even gold rings return API prices per tael

## Maintenance

To update this documentation with current data, run:
```bash
cd fin-catch-data
cargo run --example explore_sjc_gold_ids
```

This will query all IDs and display their current types, locations, and sample prices.

---

**Generated by**: explore_sjc_gold_ids.rs
**API Endpoint**: https://sjc.com.vn/GoldPrice/Services/PriceService.ashx
**Method**: POST with form data (GetGoldPriceHistory)
