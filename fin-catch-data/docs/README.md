# FinCatch Data Documentation

This directory contains comprehensive documentation for the FinCatch data library.

## Available Documentation

### SJC Gold Price Reference

- **[SJC_GOLD_PRICE_IDS.md](./SJC_GOLD_PRICE_IDS.md)** - Complete reference guide for all 38 SJC gold price IDs
  - Organized by gold type category (Gold Bars, 5 Chỉ Gold, Small Gold, Gold Rings)
  - Location/branch information for each ID
  - Unit conversion details
  - Usage examples and API patterns
  - Price comparison insights

- **[sjc_gold_ids.json](./sjc_gold_ids.json)** - Machine-readable JSON reference
  - Structured data for frontend integration
  - All 38 gold price IDs with metadata
  - Category groupings
  - Unit conversion information
  - Usage examples

## Key Findings

### SJC Gold Price IDs Discovery

The SJC API provides gold prices for **38 different combinations** of gold types and locations:

1. **Gold Bars (1L, 10L, 1KG)** - 10 locations (IDs: 1, 2, 4, 5, 7, 8, 9, 10, 13, 16)
2. **5 Chỉ Gold** - 10 locations (IDs: 17, 18, 20, 21, 23, 24, 25, 26, 29, 32)
3. **Small Gold (0.5-2 Chỉ)** - 10 locations (IDs: 33, 34, 36, 37, 39, 40, 41, 42, 45, 48)
4. **Gold Rings (99.99%)** - 8 locations (IDs: 49, 50, 52, 53, 55, 56, 57, 58)

### Important Notes

- **Unit Consistency**: All API prices are returned **per tael (lượng = 37.5g)**, regardless of the gold type's typical trading unit
- **Location Coverage**: Major cities and regions across Vietnam (HCMC, Hanoi, Nha Trang, Hue, etc.)
- **Price Variations**: Small premiums exist between gold types (5 chỉ: +20k VND, small gold: +30k VND per tael)

## Exploration Tools

### Discover Available Gold IDs

Run the exploration tool to discover current gold price IDs:

```bash
cargo run --example explore_sjc_gold_ids
```

This tool:
- Tests all potential gold price IDs (1-60)
- Identifies which IDs are valid
- Shows gold types and locations for each ID
- Displays sample prices
- Generates a comprehensive summary

### Display SJC Metadata

View the structured metadata for the SJC source:

```bash
cargo run --example display_sjc_metadata
```

## Usage in Application

### TypeScript/Frontend

Import the JSON reference for use in your frontend:

```typescript
import sjcGoldIds from 'path/to/sjc_gold_ids.json';

// Get all gold bars
const goldBars = sjcGoldIds.categories.find(
  c => c.category_id === 'gold_bars'
);

// Get HCMC gold bars
const hcmcGoldBars = goldBars.items.find(
  item => item.location_en === 'Ho Chi Minh City'
);

// Use the ID
const goldPriceId = hcmcGoldBars.id; // "1"
```

### Rust/Backend

Access metadata programmatically:

```rust
use fin_catch_data::sources::{GoldDataSource, SjcSource};

let source = SjcSource::new();
let metadata = source.metadata();

// Access as JSON Value
let total_ids = metadata["total_supported_ids"];
let categories = &metadata["gold_type_categories"];
```

## Updating Documentation

To regenerate this documentation with current data:

1. Run the exploration tool:
   ```bash
   cargo run --example explore_sjc_gold_ids
   ```

2. Review the output and update the markdown documentation if needed

3. Verify metadata is current:
   ```bash
   cargo run --example display_sjc_metadata
   ```

## Contributing

When adding new data sources or discovering new gold price IDs:

1. Run the exploration tools to verify current state
2. Update the relevant documentation files
3. Update the source code metadata methods
4. Add usage examples where appropriate

## Questions?

For questions about:
- **Data sources**: See the main README.md
- **API usage**: See TECHNICAL_DOCUMENT.md
- **Gold price IDs**: See SJC_GOLD_PRICE_IDS.md
- **Integration**: See the project's CLAUDE.md
