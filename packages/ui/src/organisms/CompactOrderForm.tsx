import React, { useState, useEffect, useCallback } from "react";
import {
  AlertCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  Loader2,
  Send,
  X,
} from "lucide-react";
import type {
  ITradingAuthService,
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
} from "@fin-catch/ui/atoms";

/**
 * Props for CompactOrderForm component
 */
export interface CompactOrderFormProps {
  /** Stock symbol (read-only in this form) */
  symbol: string;
  /** Frozen price captured at click moment (in VND) */
  frozenPrice: number | null;
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
  /** Callback to close the form */
  onClose?: () => void;
}

const ORDER_TYPES: { value: OrderType; label: string }[] = [
  { value: "LO", label: "LO" },
  { value: "MP", label: "MP" },
  { value: "ATO", label: "ATO" },
  { value: "ATC", label: "ATC" },
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
 * CompactOrderForm component
 *
 * A slimmed-down version of OrderForm designed for popover use.
 * Key differences from OrderForm:
 * - Symbol is read-only (displayed as header, not editable)
 * - Price is **frozen** (passed as prop, doesn't auto-update)
 * - Compact layout (~320px wide)
 * - Order type as small icon buttons
 * - Includes close button
 *
 * @example
 * ```tsx
 * <CompactOrderForm
 *   symbol="VNM"
 *   frozenPrice={24500}
 *   tradingService={tradingService}
 *   platform="dnse"
 *   accountNo="123456"
 *   loanPackages={loanPackages}
 *   onOrderPlaced={() => refreshOrders()}
 *   onClose={() => setPopoverOpen(false)}
 * />
 * ```
 */
export const CompactOrderForm: React.FC<CompactOrderFormProps> = ({
  symbol,
  frozenPrice,
  tradingService,
  platform,
  accountNo,
  loanPackages,
  onOrderPlaced,
  onClose,
}) => {
  // Form state
  const [side, setSide] = useState<OrderSide>("NB");
  const [orderType, setOrderType] = useState<OrderType>("LO");
  const [price, setPrice] = useState<string>(
    frozenPrice ? (frozenPrice / 1000).toString() : "",
  );
  const [quantity, setQuantity] = useState<string>("");
  const [selectedLoanPackageId, setSelectedLoanPackageId] = useState<number>(
    loanPackages.find((p) => p.type === "N")?.id || loanPackages[0]?.id || 0,
  );

  // Track if user has manually edited the price
  const [priceManuallyEdited, setPriceManuallyEdited] = useState(false);

  // UI state
  const [ppse, setPpse] = useState<PPSE | null>(null);
  const [isLoadingPPSE, setIsLoadingPPSE] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  // Initialize price from frozen price
  useEffect(() => {
    if (frozenPrice && !priceManuallyEdited) {
      setPrice((frozenPrice / 1000).toFixed(1));
    }
  }, [frozenPrice, priceManuallyEdited]);

  // Set default loan package when packages change
  useEffect(() => {
    if (loanPackages.length > 0 && !selectedLoanPackageId) {
      const normalPkg = loanPackages.find((p) => p.type === "N");
      setSelectedLoanPackageId(normalPkg?.id || loanPackages[0].id);
    }
  }, [loanPackages, selectedLoanPackageId]);

  // Fetch PPSE when price or loan package changes
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
        priceNum * 1000, // Convert to VND
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
        price: orderType === "LO" ? priceNum * 1000 : undefined,
        quantity: quantityNum,
        loanPackageId: selectedLoanPackageId,
        accountNo,
      };

      await tradingService.placeOrder(platform, order);

      // Reset and close
      setQuantity("");
      setShowConfirm(false);
      setPpse(null);
      onOrderPlaced?.();
      onClose?.();
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
      style={{
        width: "320px",
        background: "rgba(26, 31, 58, 0.95)",
        backdropFilter: "blur(16px)",
        borderRadius: "12px",
        padding: "16px",
      }}
    >
      {/* Header with symbol and close button */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
          paddingBottom: "8px",
          borderBottom: "1px solid rgba(100, 116, 139, 0.2)",
        }}
      >
        <div>
          <span
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "var(--color-text-primary, #f8fafc)",
            }}
          >
            {symbol}
          </span>
          {frozenPrice && (
            <span
              style={{
                marginLeft: "8px",
                fontSize: "12px",
                color: "#00d4ff",
              }}
            >
              @ {formatCurrency(frozenPrice)}
            </span>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              padding: "4px",
              borderRadius: "4px",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--color-text-secondary, #94a3b8)",
            }}
            className="hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {/* Side Toggle - Compact */}
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            onClick={() => setSide("NB")}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "8px",
              fontWeight: 500,
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              cursor: "pointer",
              transition: "all 0.2s",
              background:
                side === "NB"
                  ? "rgba(0, 255, 136, 0.2)"
                  : "rgba(15, 23, 42, 0.5)",
              border:
                side === "NB"
                  ? "1px solid rgba(0, 255, 136, 0.5)"
                  : "1px solid rgba(123, 97, 255, 0.2)",
              color: side === "NB" ? "#00ff88" : "var(--color-text-secondary)",
              opacity: side === "NB" ? 1 : 0.7,
            }}
          >
            <ArrowUpCircle className="w-4 h-4" />
            Buy
          </button>
          <button
            type="button"
            onClick={() => setSide("NS")}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "8px",
              fontWeight: 500,
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              cursor: "pointer",
              transition: "all 0.2s",
              background:
                side === "NS"
                  ? "rgba(255, 51, 102, 0.2)"
                  : "rgba(15, 23, 42, 0.5)",
              border:
                side === "NS"
                  ? "1px solid rgba(255, 51, 102, 0.5)"
                  : "1px solid rgba(123, 97, 255, 0.2)",
              color: side === "NS" ? "#ff3366" : "var(--color-text-secondary)",
              opacity: side === "NS" ? 1 : 0.7,
            }}
          >
            <ArrowDownCircle className="w-4 h-4" />
            Sell
          </button>
        </div>

        {/* Order Type - Compact buttons */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: "11px",
              marginBottom: "6px",
              color: "var(--color-text-secondary)",
            }}
          >
            Order Type
          </label>
          <div style={{ display: "flex", gap: "6px" }}>
            {ORDER_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setOrderType(type.value)}
                style={{
                  flex: 1,
                  padding: "6px 8px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  background:
                    orderType === type.value
                      ? "rgba(0, 212, 255, 0.2)"
                      : "rgba(15, 23, 42, 0.5)",
                  border:
                    orderType === type.value
                      ? "1px solid rgba(0, 212, 255, 0.5)"
                      : "1px solid rgba(123, 97, 255, 0.2)",
                  color:
                    orderType === type.value
                      ? "#00d4ff"
                      : "var(--color-text-secondary)",
                }}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Price Input */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: "11px",
              marginBottom: "6px",
              color: "var(--color-text-secondary)",
            }}
          >
            Price (x1,000 VND)
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => {
              setPrice(e.target.value);
              setPriceManuallyEdited(true);
            }}
            placeholder={isMarketOrder ? "Market price" : "Enter price"}
            disabled={isMarketOrder}
            step="0.1"
            min="0"
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "8px",
              fontSize: "13px",
              outline: "none",
              background: isMarketOrder
                ? "rgba(15, 23, 42, 0.3)"
                : "rgba(15, 23, 42, 0.5)",
              border: "1px solid rgba(123, 97, 255, 0.2)",
              color: "var(--color-text-primary)",
            }}
          />
        </div>

        {/* Quantity Input */}
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "6px",
            }}
          >
            <label
              style={{
                fontSize: "11px",
                color: "var(--color-text-secondary)",
              }}
            >
              Quantity
            </label>
            {isLoadingPPSE ? (
              <Loader2
                className="w-3 h-3 animate-spin"
                style={{ color: "#00d4ff" }}
              />
            ) : ppse ? (
              <span style={{ fontSize: "10px", color: "#00d4ff" }}>
                Max: {formatCurrency(ppse.qmax)}
              </span>
            ) : null}
          </div>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="100, 200, 300..."
            step="100"
            min="100"
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "8px",
              fontSize: "13px",
              outline: "none",
              background: "rgba(15, 23, 42, 0.5)",
              border: "1px solid rgba(123, 97, 255, 0.2)",
              color: "var(--color-text-primary)",
            }}
          />
        </div>

        {/* Loan Package Selector - Only if multiple packages */}
        {loanPackages.length > 1 && (
          <div>
            <label
              style={{
                display: "block",
                fontSize: "11px",
                marginBottom: "6px",
                color: "var(--color-text-secondary)",
              }}
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
                  background: "rgba(15, 23, 42, 0.5)",
                  borderColor: "rgba(123, 97, 255, 0.2)",
                  color: "var(--color-text-primary)",
                  height: "40px",
                }}
              >
                <SelectValue placeholder="Select package" />
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
            style={{
              padding: "8px 10px",
              borderRadius: "8px",
              background: "rgba(0, 212, 255, 0.05)",
              border: "1px solid rgba(0, 212, 255, 0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "11px",
              }}
            >
              <span style={{ color: "var(--color-text-secondary)" }}>
                Buying Power
              </span>
              <span style={{ color: "#00d4ff" }}>
                {formatCurrency(ppse.ppse)} VND
              </span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 10px",
              borderRadius: "8px",
              background: "rgba(255, 51, 102, 0.1)",
              border: "1px solid rgba(255, 51, 102, 0.3)",
              color: "#ff3366",
            }}
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span style={{ fontSize: "11px" }}>{error}</span>
          </div>
        )}

        {/* Submit Button */}
        {showConfirm ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div
              style={{
                padding: "8px",
                borderRadius: "8px",
                textAlign: "center",
                background:
                  side === "NB"
                    ? "rgba(0, 255, 136, 0.1)"
                    : "rgba(255, 51, 102, 0.1)",
                color: side === "NB" ? "#00ff88" : "#ff3366",
              }}
            >
              <div style={{ fontSize: "12px", fontWeight: 500 }}>
                Confirm {side === "NB" ? "BUY" : "SELL"} {symbol}
              </div>
              <div style={{ fontSize: "14px", fontWeight: 700 }}>
                {formatCurrency(parseInt(quantity || "0", 10))} shares
                {!isMarketOrder && price && (
                  <> @ {formatCurrency(parseFloat(price) * 1000)} VND</>
                )}
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <Button
                type="button"
                variant="secondary"
                onClick={handleCancel}
                className="flex-1"
                style={{ fontSize: "12px" }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                className="flex-1"
                style={{
                  fontSize: "12px",
                  background:
                    side === "NB"
                      ? "linear-gradient(135deg, #00ff88 0%, #00d4ff 100%)"
                      : "linear-gradient(135deg, #ff3366 0%, #ff6b35 100%)",
                }}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-3 h-3 mr-1" />
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
                  ? "linear-gradient(135deg, #00ff88 0%, #00d4ff 100%)"
                  : "linear-gradient(135deg, #ff3366 0%, #ff6b35 100%)",
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
