import { useState, useCallback } from "react";

/**
 * Frozen price state returned by useFrozenPrice hook
 */
export interface FrozenPriceState {
  /** The frozen price value (null if not captured) */
  frozenPrice: number | null;
  /** Timestamp when price was captured (null if not captured) */
  frozenTimestamp: number | null;
  /** Capture the current price and freeze it */
  capturePrice: (price: number | undefined) => void;
  /** Clear the frozen price (reset to null) */
  clearFrozenPrice: () => void;
  /** Whether a price is currently frozen */
  isFrozen: boolean;
}

/**
 * useFrozenPrice hook
 *
 * Captures and freezes a price value at a specific moment in time.
 * Useful for order forms where you want to capture the price when a user
 * clicks on a symbol card, rather than continuously updating it.
 *
 * @example
 * ```tsx
 * const { frozenPrice, capturePrice, clearFrozenPrice } = useFrozenPrice();
 *
 * const handleCardClick = (currentPrice: number) => {
 *   capturePrice(currentPrice);
 *   // Open order form popover...
 * };
 *
 * const handlePopoverClose = () => {
 *   clearFrozenPrice();
 * };
 * ```
 */
export function useFrozenPrice(): FrozenPriceState {
  const [frozenPrice, setFrozenPrice] = useState<number | null>(null);
  const [frozenTimestamp, setFrozenTimestamp] = useState<number | null>(null);

  const capturePrice = useCallback((price: number | undefined) => {
    if (price !== undefined && price !== null) {
      setFrozenPrice(price);
      setFrozenTimestamp(Date.now());
    }
  }, []);

  const clearFrozenPrice = useCallback(() => {
    setFrozenPrice(null);
    setFrozenTimestamp(null);
  }, []);

  return {
    frozenPrice,
    frozenTimestamp,
    capturePrice,
    clearFrozenPrice,
    isFrozen: frozenPrice !== null,
  };
}
