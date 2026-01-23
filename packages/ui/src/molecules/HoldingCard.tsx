import React from "react";
import { CurrencyCode, EntryPerformance, PortfolioEntry } from "@repo/shared";
import { StockHoldingCard } from "./StockHoldingCard";
import { GoldHoldingCard } from "./GoldHoldingCard";
import { BondHoldingCard } from "./BondHoldingCard";

export interface HoldingCardProps {
  entryPerf: EntryPerformance;
  displayCurrency: CurrencyCode;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: (entry: PortfolioEntry) => void;
  onDelete: (entryId: string) => void;
  onPaymentsChange?: () => void;
  formatCurrency: (value: number, currency?: CurrencyCode) => string;
  formatPercentage: (value: number) => string;
  formatDate: (timestamp: number) => string;
}

export const HoldingCard: React.FC<HoldingCardProps> = (props) => {
  const { entryPerf } = props;
  const assetType = entryPerf.entry.asset_type;

  switch (assetType) {
    case "stock":
      return <StockHoldingCard {...props} />;
    case "gold":
      return <GoldHoldingCard {...props} />;
    case "bond":
      return <BondHoldingCard {...props} />;
    default:
      return null;
  }
};
