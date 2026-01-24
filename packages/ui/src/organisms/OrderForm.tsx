import React, { useState, useEffect, useCallback } from "react";
import {
  AlertCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  Loader2,
  Send,
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
}) => {
  // Form state
  const [symbol, setSymbol] = useState("");
  const [side, setSide] = useState<OrderSide>("NB");
  const [orderType, setOrderType] = useState<OrderType>("LO");
  const [price, setPrice] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [selectedLoanPackageId, setSelectedLoanPackageId] = useState<number>(
    loanPackages[0]?.id || 0,
  );

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
        background: "rgba(26, 31, 58, 0.6)",
        backdropFilter: "blur(16px)",
        borderColor: "rgba(123, 97, 255, 0.2)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
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
                  ? "rgba(0, 255, 136, 0.2)"
                  : "rgba(15, 23, 42, 0.5)",
              borderColor:
                side === "NB"
                  ? "rgba(0, 255, 136, 0.5)"
                  : "rgba(123, 97, 255, 0.2)",
              border: "1px solid",
              color: side === "NB" ? "#00ff88" : "var(--color-text-secondary)",
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
                  ? "rgba(255, 51, 102, 0.2)"
                  : "rgba(15, 23, 42, 0.5)",
              borderColor:
                side === "NS"
                  ? "rgba(255, 51, 102, 0.5)"
                  : "rgba(123, 97, 255, 0.2)",
              border: "1px solid",
              color: side === "NS" ? "#ff3366" : "var(--color-text-secondary)",
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
              background: "rgba(15, 23, 42, 0.5)",
              borderColor: "rgba(123, 97, 255, 0.2)",
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
                      ? "rgba(0, 212, 255, 0.2)"
                      : "rgba(15, 23, 42, 0.5)",
                  borderColor:
                    orderType === type.value
                      ? "rgba(0, 212, 255, 0.5)"
                      : "rgba(123, 97, 255, 0.2)",
                  border: "1px solid",
                  color:
                    orderType === type.value
                      ? "#00d4ff"
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
            onChange={(e) => setPrice(e.target.value)}
            placeholder={isMarketOrder ? "Market price" : "Enter price"}
            className="w-full p-3 rounded-xl border text-sm outline-none transition-colors"
            style={{
              background: isMarketOrder
                ? "rgba(15, 23, 42, 0.3)"
                : "rgba(15, 23, 42, 0.5)",
              borderColor: "rgba(123, 97, 255, 0.2)",
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
                style={{ color: "#00d4ff" }}
              />
            ) : ppse ? (
              <span className="text-xs" style={{ color: "#00d4ff" }}>
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
              background: "rgba(15, 23, 42, 0.5)",
              borderColor: "rgba(123, 97, 255, 0.2)",
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
                  background: "rgba(15, 23, 42, 0.5)",
                  borderColor: "rgba(123, 97, 255, 0.2)",
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
              background: "rgba(0, 212, 255, 0.05)",
              borderColor: "rgba(0, 212, 255, 0.2)",
            }}
          >
            <div className="flex justify-between text-sm">
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
            className="flex items-center gap-2 p-3 rounded-xl border"
            style={{
              background: "rgba(255, 51, 102, 0.1)",
              borderColor: "rgba(255, 51, 102, 0.3)",
              color: "#ff3366",
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
                    ? "rgba(0, 255, 136, 0.1)"
                    : "rgba(255, 51, 102, 0.1)",
                color: side === "NB" ? "#00ff88" : "#ff3366",
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
                      ? "linear-gradient(135deg, #00ff88 0%, #00d4ff 100%)"
                      : "linear-gradient(135deg, #ff3366 0%, #ff6b35 100%)",
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
