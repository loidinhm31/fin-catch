import React, { useState, useCallback } from "react";
import type {
  StockInfo,
  TopPrice,
  ITradingAuthService,
  TradingPlatformId,
  LoanPackage,
} from "@fin-catch/shared";
import { Popover, PopoverTrigger, PopoverContent } from "@fin-catch/ui/atoms";
import { TradingCard } from "./TradingCard";
import { CompactOrderForm } from "@fin-catch/ui/organisms";
import { useFrozenPrice } from "@fin-catch/ui/hooks";

/**
 * Props for TradingCardPopover component
 */
export interface TradingCardPopoverProps {
  /** Stock symbol */
  symbol: string;
  /** Stock info data (real-time price) */
  stockInfo: StockInfo | null;
  /** Top price data (Level 2 bid/ask) */
  topPrice?: TopPrice | null;
  /** Whether this card is being dragged (disables popover) */
  isDragging?: boolean;
  /** Whether this card is selected */
  isSelected?: boolean;
  /** Trading service instance */
  tradingService: ITradingAuthService;
  /** Platform ID */
  platform: TradingPlatformId;
  /** Account number */
  accountNo: string;
  /** Available loan packages */
  loanPackages: LoanPackage[];
  /** Callback when order is placed */
  onOrderPlaced?: () => void;
  /** Custom class name */
  className?: string;
  /** Show drag handle on card */
  showDragHandle?: boolean;
  /** Show TickTape component */
  showTickTape?: boolean;
  /** Show MarketDepth component */
  showMarketDepth?: boolean;
  /** Maximum ticks to show in TickTape */
  maxTicks?: number;
  /** Maximum levels to show in MarketDepth */
  maxLevels?: number;
  /** Callback when price level is clicked in MarketDepth */
  onPriceClick?: (price: number, side: "bid" | "ask") => void;
}

/**
 * TradingCardPopover component
 *
 * Wraps TradingCard with a Radix Popover that opens on click.
 * When clicked, captures the current price and opens a CompactOrderForm.
 *
 * Key behaviors:
 * - Opens on **click** (not hover) - works on desktop and mobile
 * - Captures price at click moment (frozen, doesn't update while open)
 * - Disabled during drag operations
 * - Click outside or press Escape to close
 *
 * @example
 * ```tsx
 * <TradingCardPopover
 *   symbol="VNM"
 *   stockInfo={stockInfo}
 *   tradingService={tradingService}
 *   platform="dnse"
 *   accountNo="123456"
 *   loanPackages={loanPackages}
 *   onOrderPlaced={() => refreshOrders()}
 * />
 * ```
 */
export const TradingCardPopover: React.FC<TradingCardPopoverProps> = ({
  symbol,
  stockInfo,
  topPrice,
  isDragging = false,
  isSelected = false,
  tradingService,
  platform,
  accountNo,
  loanPackages,
  onOrderPlaced,
  className,
  showDragHandle = true,
  showTickTape = false,
  showMarketDepth = false,
  maxTicks,
  maxLevels,
  onPriceClick,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { frozenPrice, capturePrice, clearFrozenPrice } = useFrozenPrice();

  // Handle card click - capture price and open popover
  const handleCardClick = useCallback(() => {
    if (isDragging) return; // Don't open during drag

    // Capture the current price - try multiple sources
    // Priority: lastPrice > topPrice mid-price > bidPrice > askPrice
    let currentPrice = stockInfo?.lastPrice;

    if (!currentPrice && topPrice) {
      // Calculate mid-price from order book
      const bestBid = topPrice.bids?.[0]?.price;
      const bestAsk = topPrice.asks?.[0]?.price;
      if (bestBid && bestAsk) {
        currentPrice = (bestBid + bestAsk) / 2;
      } else if (bestBid) {
        currentPrice = bestBid;
      } else if (bestAsk) {
        currentPrice = bestAsk;
      }
    }

    if (!currentPrice) {
      // Fallback to stockInfo bid/ask
      currentPrice = stockInfo?.bidPrice || stockInfo?.askPrice;
    }

    capturePrice(currentPrice);
    setIsOpen(true);
  }, [
    isDragging,
    stockInfo?.lastPrice,
    stockInfo?.bidPrice,
    stockInfo?.askPrice,
    topPrice,
    capturePrice,
  ]);

  // Handle popover close
  const handleClose = useCallback(() => {
    setIsOpen(false);
    clearFrozenPrice();
  }, [clearFrozenPrice]);

  // Handle open change from Radix
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        handleClose();
      }
    },
    [handleClose],
  );

  // Handle order placed
  const handleOrderPlaced = useCallback(() => {
    onOrderPlaced?.();
    handleClose();
  }, [onOrderPlaced, handleClose]);

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <div>
          <TradingCard
            symbol={symbol}
            stockInfo={stockInfo}
            topPrice={topPrice}
            platform={platform}
            isDragging={isDragging}
            isSelected={isSelected || isOpen}
            onClick={handleCardClick}
            className={className}
            showDragHandle={showDragHandle}
            showTickTape={showTickTape}
            showMarketDepth={showMarketDepth}
            maxTicks={maxTicks}
            maxLevels={maxLevels}
            onPriceClick={onPriceClick}
          />
        </div>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        sideOffset={8}
        style={{
          padding: 0,
          border: "none",
          background: "transparent",
          boxShadow: "none",
        }}
      >
        <CompactOrderForm
          symbol={symbol}
          frozenPrice={frozenPrice}
          tradingService={tradingService}
          platform={platform}
          accountNo={accountNo}
          loanPackages={loanPackages}
          onOrderPlaced={handleOrderPlaced}
          onClose={handleClose}
        />
      </PopoverContent>
    </Popover>
  );
};
