import React, { useState, useCallback, useEffect } from "react";
import { Reorder } from "framer-motion";
import type {
  StockInfo,
  TopPrice,
  ITradingAuthService,
  TradingPlatformId,
  LoanPackage,
} from "@fin-catch/shared";
import { TradingCardPopover } from "@fin-catch/ui/molecules";

/**
 * Props for DraggableSymbolGrid component
 */
export interface DraggableSymbolGridProps {
  /** List of symbols in display order */
  symbols: string[];
  /** Map of symbol -> StockInfo */
  symbolData: Map<string, StockInfo>;
  /** Map of symbol -> TopPrice */
  topPriceData?: Map<string, TopPrice>;
  /** Callback when symbols are reordered */
  onReorder: (newOrder: string[]) => void;
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
  /** Show TickTape in cards */
  showTickTape?: boolean;
  /** Show MarketDepth in cards */
  showMarketDepth?: boolean;
}

/**
 * Storage key for card order persistence
 */
const getStorageKey = (accountNo: string) => `trading-card-order-${accountNo}`;

/**
 * Load saved card order from localStorage
 */
export function loadCardOrder(accountNo: string): string[] | null {
  try {
    const saved = localStorage.getItem(getStorageKey(accountNo));
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.error("Failed to load card order:", err);
  }
  return null;
}

/**
 * Save card order to localStorage
 */
export function saveCardOrder(accountNo: string, order: string[]): void {
  try {
    localStorage.setItem(getStorageKey(accountNo), JSON.stringify(order));
  } catch (err) {
    console.error("Failed to save card order:", err);
  }
}

/**
 * Merge saved order with current symbols
 * - Saved symbols that still exist keep their order
 * - New symbols are appended at the end
 * - Removed symbols are filtered out
 */
export function mergeCardOrder(
  savedOrder: string[] | null,
  currentSymbols: string[],
): string[] {
  if (!savedOrder) {
    return currentSymbols;
  }

  const currentSet = new Set(currentSymbols);
  const result: string[] = [];

  // Add saved symbols that still exist, in order
  for (const symbol of savedOrder) {
    if (currentSet.has(symbol)) {
      result.push(symbol);
      currentSet.delete(symbol);
    }
  }

  // Append new symbols at the end
  for (const symbol of currentSet) {
    result.push(symbol);
  }

  return result;
}

/**
 * DraggableSymbolGrid component
 *
 * A responsive grid of TradingCardPopover components that supports
 * drag-and-drop reordering using framer-motion's Reorder components.
 *
 * Features:
 * - Drag-and-drop reordering with smooth animations
 * - Persists card order to localStorage
 * - Disables popovers during drag operations
 * - Responsive grid: 2-5 columns based on container width
 *
 * @example
 * ```tsx
 * <DraggableSymbolGrid
 *   symbols={subscribedSymbols}
 *   symbolData={symbolData}
 *   topPriceData={topPriceData}
 *   onReorder={setSubscribedSymbols}
 *   tradingService={tradingService}
 *   platform="dnse"
 *   accountNo="123456"
 *   loanPackages={loanPackages}
 *   onOrderPlaced={() => refreshOrders()}
 * />
 * ```
 */
export const DraggableSymbolGrid: React.FC<DraggableSymbolGridProps> = ({
  symbols,
  symbolData,
  topPriceData,
  onReorder,
  tradingService,
  platform,
  accountNo,
  loanPackages,
  onOrderPlaced,
  className,
  showMarketDepth,
  showTickTape,
}) => {
  const [draggingSymbol, setDraggingSymbol] = useState<string | null>(null);

  // Load and merge saved order on mount or when symbols change
  useEffect(() => {
    const savedOrder = loadCardOrder(accountNo);
    const mergedOrder = mergeCardOrder(savedOrder, symbols);

    // Only update if order is different
    if (
      mergedOrder.length !== symbols.length ||
      mergedOrder.some((s, i) => s !== symbols[i])
    ) {
      onReorder(mergedOrder);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountNo]); // Only on account change, not on symbols change to avoid loops

  // Handle reorder - called when drag ends
  const handleReorder = useCallback(
    (newOrder: string[]) => {
      onReorder(newOrder);
      saveCardOrder(accountNo, newOrder);
    },
    [onReorder, accountNo],
  );

  // Get TopPrice data for a symbol
  const getTopPriceForSymbol = useCallback(
    (symbol: string): TopPrice | null => {
      if (!topPriceData) return null;
      return topPriceData.get(symbol) || null;
    },
    [topPriceData],
  );

  if (symbols.length === 0) {
    return (
      <div
        className={className}
        style={{
          padding: "32px",
          textAlign: "center",
          color: "var(--color-text-secondary, #94a3b8)",
          background: "rgba(15, 23, 42, 0.4)",
          borderRadius: "12px",
          border: "1px dashed rgba(100, 116, 139, 0.3)",
        }}
      >
        <p style={{ fontSize: "14px", marginBottom: "8px" }}>
          No symbols subscribed
        </p>
        <p style={{ fontSize: "12px", opacity: 0.7 }}>
          Add symbols above to start watching
        </p>
      </div>
    );
  }

  return (
    <Reorder.Group
      axis="x"
      values={symbols}
      onReorder={handleReorder}
      className={className}
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
        gap: "16px",
        listStyle: "none",
        padding: 0,
        margin: 0,
      }}
    >
      {symbols.map((symbol) => (
        <Reorder.Item
          key={symbol}
          value={symbol}
          onDragStart={() => setDraggingSymbol(symbol)}
          onDragEnd={() => setDraggingSymbol(null)}
          style={{
            listStyle: "none",
          }}
          whileDrag={{
            scale: 1.05,
            zIndex: 50,
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
          }}
          layout
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30,
          }}
        >
          <TradingCardPopover
            symbol={symbol}
            stockInfo={symbolData.get(symbol) || null}
            topPrice={getTopPriceForSymbol(symbol)}
            isDragging={draggingSymbol === symbol}
            tradingService={tradingService}
            platform={platform}
            accountNo={accountNo}
            loanPackages={loanPackages}
            onOrderPlaced={onOrderPlaced}
            showDragHandle
            showMarketDepth={showMarketDepth}
            showTickTape={showTickTape}
          />
        </Reorder.Item>
      ))}
    </Reorder.Group>
  );
};

/**
 * DraggableSymbolGridSkeleton - Loading placeholder
 */
export const DraggableSymbolGridSkeleton: React.FC<{
  count?: number;
  className?: string;
}> = ({ count = 4, className }) => {
  return (
    <div
      className={className}
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: "16px",
      }}
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse"
          style={{
            width: "220px",
            minHeight: "180px",
            background: "rgba(15, 23, 42, 0.7)",
            border: "1px solid rgba(100, 116, 139, 0.2)",
            borderRadius: "12px",
          }}
        />
      ))}
    </div>
  );
};
