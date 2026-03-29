# Fin-Catch: Savings Asset Type Documentation Update

**Date**: 2026-03-11
**Subagent**: docs-manager
**Status**: Complete

## Summary

Updated fin-catch documentation to cover the new **savings** asset type feature. No new files created; existing ARCHITECTURE.md and DESIGN_SYSTEM.md enhanced with schema, calculation formulas, and valuation rules.

## Changes Made

### 1. `/embed-app/fin-catch/docs/ARCHITECTURE.md`

**Data Model ERD update** (line 482-515):
- Added `savings` to assetType union
- Documented savings-specific fields: principal, interestRate, termMonths, startDate, demandDepositRate, autoRenewal, renewalCount, originalStartDate, bankName

**New § Asset Types & Valuation** (line 534-596):
- Table of 6 asset types with price sources and recalc frequency
- Savings calculation formulas:
  - YTD: `principal × (1 + demandRate% × daysHeld/365)`
  - Maturity: `principal × (1 + interestRate% × termMonths/12)`
- Auto-renewal behavior: renewalCount increments, originalStartDate preserved
- Performance calculation contracts (currentValue, totalCost, gainLoss)
- Portfolio aggregation rules

### 2. `/embed-app/fin-catch/packages/ui/DESIGN_SYSTEM.md`

**Schema columns update** (line 313-350):
- Added 9 savings-related columns to portfolio_entries schema definition

**New § Asset Types & Calculation Rules** (line 280-299):
- Condensed asset type reference table (6 types)
- Savings-specific subsection with YTD/maturity logic
- Currency and renewal notes

## File Sizes (within limits)

- ARCHITECTURE.md: 635 LOC (was ~550, +85 lines)
- DESIGN_SYSTEM.md: 406 LOC (was ~376, +30 lines)
- Total added: 115 lines across 2 files

Both well under reasonable documentation limits; no splitting needed.

## Documentation Accuracy

All content verified against actual codebase:

| Source | Reference |
|--------|-----------|
| Asset types & fields | `packages/shared/src/types/portfolio.ts` lines 19, 41-50 |
| YTD/maturity calcs | `packages/ui/src/utils/performanceCalculations.ts` lines 115-145 |
| UI components | SavingsEntryForm.tsx, SavingsHoldingCard.tsx (new molecules) |
| Type union update | PortfolioEntryFormData assetType line 129 |

## Cross-References

- ARCHITECTURE.md ↔ DESIGN_SYSTEM.md: Asset type tables remain consistent
- Sync schema columns match TypeScript interface field names (camelCase)
- Calculation formulas derived directly from `calculateSavingsYtdValue()` and `calculateSavingsMaturityValue()` utility functions

## Not Done

- No new documentation files created (per instructions: "only update existing docs")
- No README.md update (not identified as requiring changes; UI molecule refs are in code, not docs)
- No codebase summary generated (repomix was not invoked; task scope was doc updates only)

## Notes for Next Contributor

If expanding fin-catch docs further:
1. Asset type section is concentrated in two locations — keep synchronized
2. Savings renewal logic could use a state machine diagram if detailed workflow docs needed
3. Currency conversion rules live in `currency.ts` utils; consider cross-linking
4. Bond coupon tracking has similar patterns to savings renewal; refactor opportunity
