import React, { useState, useEffect, useCallback } from "react";
import {
  AlertCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  Loader2,
  Send,
} from "lucide-react";
import type {
  TradingPlatformId,
  LoanPackage,
  OrderSide,
  OrderType,
  PlaceOrderRequest,
  PPSE,
} from "@fin-catch/shared";
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@fin-catch/ui/components/atoms";
import { ITradingAuthService } from "@fin-catch/ui/adapters/factory/interfaces";

/**
 * Props for OrderForm component
 */
interface OrderFormProps {
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
  /** Initial symbol from market data selection */
  initialSymbol?: string;
  /** Initial price from market data (in VND, not thousands) */
  initialPrice?: number;
}

const ORDER_TYPES: { value: OrderType; label: string; description: string }[] =
  [
    { value: "LO", label: "LO", description: "Limit Order" },
    { value: "MP", label: "MP", description: "Market Price" },
    { value: "ATO", label: "ATO", description: "At The Open" },
    { value: "ATC", label: "ATC", description: "At The Close" },
    { value: "MTL", label: "MTL", description: "Match or Limit" },
    { value: "MOK", label: "MOK", description: "Match or Kill" },
    { value: "MAK", label: "MAK", description: "Match and Kill" },
  ];

/**
 * Format currency value
 */
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("vi-VN", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * OrderForm component
 *
 * Form for placing buy/sell orders with:
 * - Symbol input with buying/selling power preview
 * - Side toggle (Buy/Sell)
 * - Order type selector
 * - Price input (for limit orders)
 * - Quantity input
 * - Loan package selector
 */
export const OrderForm: React.FC<OrderFormProps> = ({
  tradingService,
  platform,
  accountNo,
  loanPackages,
  onOrderPlaced,
  initialSymbol,
  initialPrice,
}) => {
  // Form state
  const [symbol, setSymbol] = useState(initialSymbol || "");
  const [side, setSide] = useState<OrderSide>("NB");
  const [orderType, setOrderType] = useState<OrderType>("LO");
  const [price, setPrice] = useState<string>(
    initialPrice ? (initialPrice / 1000).toString() : "",
  );
  const [quantity, setQuantity] = useState<string>("");
  const [selectedLoanPackageId, setSelectedLoanPackageId] = useState<number>(
    loanPackages.find((p) => p.type === "N")?.id || loanPackages[0]?.id || 0,
  );

  // Track if user has manually edited the price (to stop auto-sync from market data)
  const [priceManuallyEdited, setPriceManuallyEdited] = useState(false);

  // Update symbol when initialSymbol changes from market data
  // Also reset the manual edit flag so the new symbol's price can be synced
  useEffect(() => {
    if (initialSymbol) {
      setSymbol(initialSymbol);
      setPriceManuallyEdited(false); // Reset on symbol change to allow price sync
    }
  }, [initialSymbol]);

  // Update price when initialPrice changes from market data
  // Only sync if user hasn't manually edited the price
  useEffect(() => {
    if (
      initialPrice !== undefined &&
      orderType === "LO" &&
      !priceManuallyEdited
    ) {
      // Convert from VND to thousands for display
      setPrice((initialPrice / 1000).toFixed(1));
    }
  }, [initialPrice, orderType, priceManuallyEdited]);

  // UI state
  const [ppse, setPpse] = useState<PPSE | null>(null);
  const [isLoadingPPSE, setIsLoadingPPSE] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  // Set default loan package when packages change
  useEffect(() => {
    if (loanPackages.length > 0 && !selectedLoanPackageId) {
      // Prefer normal package over margin
      const normalPkg = loanPackages.find((p) => p.type === "N");
      setSelectedLoanPackageId(normalPkg?.id || loanPackages[0].id);
    }
  }, [loanPackages, selectedLoanPackageId]);

  // Fetch PPSE when symbol, price, or loan package changes
  const fetchPPSE = useCallback(async () => {
    if (!symbol || !price || !selectedLoanPackageId) {
      setPpse(null);
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setPpse(null);
      return;
    }

    setIsLoadingPPSE(true);
    try {
      const result = await tradingService.getPPSE(
        platform,
        accountNo,
        symbol.toUpperCase(),
        priceNum * 1000, // Convert to VND (input is in thousands)
        selectedLoanPackageId,
      );
      setPpse(result);
    } catch (err) {
      console.error("Failed to fetch PPSE:", err);
      setPpse(null);
    } finally {
      setIsLoadingPPSE(false);
    }
  }, [
    symbol,
    price,
    selectedLoanPackageId,
    tradingService,
    platform,
    accountNo,
  ]);

  // Debounce PPSE fetch
  useEffect(() => {
    const timer = setTimeout(fetchPPSE, 500);
    return () => clearTimeout(timer);
  }, [fetchPPSE]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const priceNum = parseFloat(price);
      const quantityNum = parseInt(quantity, 10);

      if (!symbol) throw new Error("Symbol is required");
      if (orderType === "LO" && (isNaN(priceNum) || priceNum <= 0)) {
        throw new Error("Price is required for limit orders");
      }
      if (isNaN(quantityNum) || quantityNum <= 0) {
        throw new Error("Quantity is required");
      }
      if (quantityNum % 100 !== 0) {
        throw new Error("Quantity must be a multiple of 100");
      }

      const order: PlaceOrderRequest = {
        symbol: symbol.toUpperCase(),
        side,
        orderType,
        price: orderType === "LO" ? priceNum * 1000 : undefined, // Convert to VND
        quantity: quantityNum,
        loanPackageId: selectedLoanPackageId,
        accountNo,
      };

      await tradingService.placeOrder(platform, order);

      // Reset form
      setSymbol("");
      setPrice("");
      setQuantity("");
      setShowConfirm(false);
      setPpse(null);
      setPriceManuallyEdited(false); // Allow price sync for next order
      onOrderPlaced?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to place order");
      setShowConfirm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  const isMarketOrder = orderType !== "LO";

  return (
    <div
      className="rounded-2xl p-6 border"
      style={{
        background: "var(--glass-bg-card)",
        backdropFilter: "blur(16px)",
        borderColor: "var(--color-market-purple-border)",
        boxShadow: "var(--shadow-glass-sm)",
      }}
    >
      <h3
        className="text-lg font-semibold mb-4"
        style={{ color: "var(--color-text-primary)" }}
      >
        Place Order
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Side Toggle */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSide("NB")}
            className={`flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
              side === "NB" ? "shadow-lg" : "opacity-60"
            }`}
            style={{
              background:
                side === "NB"
                  ? "var(--color-trade-buy-bg)"
                  : "var(--glass-bg-input)",
              borderColor:
                side === "NB"
                  ? "var(--color-trade-buy-border)"
                  : "var(--color-market-purple-border)",
              border: "1px solid",
              color:
                side === "NB"
                  ? "var(--color-trade-buy)"
                  : "var(--color-text-secondary)",
            }}
          >
            <ArrowUpCircle className="w-5 h-5" />
            Buy
          </button>
          <button
            type="button"
            onClick={() => setSide("NS")}
            className={`flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
              side === "NS" ? "shadow-lg" : "opacity-60"
            }`}
            style={{
              background:
                side === "NS"
                  ? "var(--color-trade-sell-bg)"
                  : "var(--glass-bg-input)",
              borderColor:
                side === "NS"
                  ? "var(--color-trade-sell-border)"
                  : "var(--color-market-purple-border)",
              border: "1px solid",
              color:
                side === "NS"
                  ? "var(--color-trade-sell)"
                  : "var(--color-text-secondary)",
            }}
          >
            <ArrowDownCircle className="w-5 h-5" />
            Sell
          </button>
        </div>

        {/* Symbol Input */}
        <div>
          <label
            className="block text-sm mb-2"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Symbol
          </label>
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            placeholder="VNM, FPT, VIC..."
            className="w-full p-3 rounded-xl border text-sm outline-none transition-colors uppercase"
            style={{
              background: "var(--glass-bg-input)",
              borderColor: "var(--color-market-purple-border)",
              color: "var(--color-text-primary)",
            }}
            maxLength={10}
          />
        </div>

        {/* Order Type */}
        <div>
          <label
            className="block text-sm mb-2"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Order Type
          </label>
          <div className="flex flex-wrap gap-2">
            {ORDER_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setOrderType(type.value)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors`}
                style={{
                  background:
                    orderType === type.value
                      ? "var(--color-sync-pending-bg)"
                      : "var(--glass-bg-input)",
                  borderColor:
                    orderType === type.value
                      ? "var(--color-sync-pending-border)"
                      : "var(--color-market-purple-border)",
                  border: "1px solid",
                  color:
                    orderType === type.value
                      ? "var(--color-market-live)"
                      : "var(--color-text-secondary)",
                }}
                title={type.description}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Price Input */}
        <div>
          <label
            className="block text-sm mb-2"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Price (x1,000 VND)
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => {
              setPrice(e.target.value);
              setPriceManuallyEdited(true); // Stop auto-sync from market data
            }}
            placeholder={isMarketOrder ? "Market price" : "Enter price"}
            className="w-full p-3 rounded-xl border text-sm outline-none transition-colors"
            style={{
              background: isMarketOrder
                ? "var(--glass-bg-input-disabled)"
                : "var(--glass-bg-input)",
              borderColor: "var(--color-market-purple-border)",
              color: "var(--color-text-primary)",
            }}
            disabled={isMarketOrder}
            step="0.1"
            min="0"
          />
        </div>

        {/* Quantity Input */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label
              className="text-sm"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Quantity
            </label>
            {isLoadingPPSE ? (
              <Loader2
                className="w-4 h-4 animate-spin"
                style={{ color: "var(--color-market-live)" }}
              />
            ) : ppse ? (
              <span
                className="text-xs"
                style={{ color: "var(--color-market-live)" }}
              >
                Max: {formatCurrency(ppse.qmax)}
              </span>
            ) : null}
          </div>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="100, 200, 300..."
            className="w-full p-3 rounded-xl border text-sm outline-none transition-colors"
            style={{
              background: "var(--glass-bg-input)",
              borderColor: "var(--color-market-purple-border)",
              color: "var(--color-text-primary)",
            }}
            step="100"
            min="100"
          />
        </div>

        {/* Loan Package Selector */}
        {loanPackages.length > 1 && (
          <div>
            <label
              className="block text-sm mb-2"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Loan Package
            </label>
            <Select
              value={selectedLoanPackageId.toString()}
              onValueChange={(val) => setSelectedLoanPackageId(Number(val))}
            >
              <SelectTrigger
                className="w-full text-sm font-medium"
                style={{
                  background: "var(--glass-bg-input)",
                  borderColor: "var(--color-market-purple-border)",
                  color: "var(--color-text-primary)",
                  height: "46px", // Match input height
                }}
              >
                <SelectValue placeholder="Select loan package" />
              </SelectTrigger>
              <SelectContent>
                {loanPackages.map((pkg) => (
                  <SelectItem key={pkg.id} value={pkg.id.toString()}>
                    {pkg.name} ({pkg.type === "M" ? "Margin" : "Cash"})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* PPSE Info */}
        {ppse && (
          <div
            className="p-3 rounded-xl border"
            style={{
              background: "var(--color-sync-pending-bg)",
              borderColor: "var(--color-sync-pending-border)",
            }}
          >
            <div className="flex justify-between text-sm">
              <span style={{ color: "var(--color-text-secondary)" }}>
                Buying Power
              </span>
              <span style={{ color: "var(--color-market-live)" }}>
                {formatCurrency(ppse.ppse)} VND
              </span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div
            className="flex items-center gap-2 p-3 rounded-xl border"
            style={{
              background: "var(--color-alert-error-bg)",
              borderColor: "var(--color-alert-error-border)",
              color: "var(--color-trade-sell)",
            }}
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Submit Button */}
        {showConfirm ? (
          <div className="space-y-2">
            <div
              className="p-3 rounded-xl text-center"
              style={{
                background:
                  side === "NB"
                    ? "var(--color-trade-buy-bg)"
                    : "var(--color-trade-sell-bg)",
                color:
                  side === "NB"
                    ? "var(--color-trade-buy)"
                    : "var(--color-trade-sell)",
              }}
            >
              <div className="text-sm font-medium">
                Confirm {side === "NB" ? "BUY" : "SELL"} {symbol}
              </div>
              <div className="text-lg font-bold">
                {formatCurrency(parseInt(quantity || "0", 10))} shares
                {!isMarketOrder && price && (
                  <> @ {formatCurrency(parseFloat(price) * 1000)} VND</>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={handleCancel}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                className="flex-1"
                style={{
                  background:
                    side === "NB"
                      ? "var(--color-green-500)"
                      : "var(--color-red-500)",
                  boxShadow:
                    side === "NB"
                      ? "var(--shadow-glow-green)"
                      : "var(--shadow-glow-red)",
                }}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Confirm
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <Button
            type="submit"
            variant="primary"
            disabled={!symbol || (!isMarketOrder && !price) || !quantity}
            className="w-full"
            style={{
              background:
                side === "NB"
                  ? "var(--color-green-500)"
                  : "var(--color-red-500)",
              boxShadow:
                side === "NB"
                  ? "var(--shadow-glow-green)"
                  : "var(--shadow-glow-red)",
            }}
          >
            <Send className="w-4 h-4 mr-2" />
            {side === "NB" ? "Buy" : "Sell"}
          </Button>
        )}
      </form>
    </div>
  );
};
