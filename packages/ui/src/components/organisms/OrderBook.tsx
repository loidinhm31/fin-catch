import React from "react";
import {
  AlertCircle,
  Check,
  Clock,
  Loader2,
  RefreshCw,
  X,
  XCircle,
} from "lucide-react";
import type {
  ITradingAuthService,
  TradingPlatformId,
  Order,
  OrderStatus,
} from "@fin-catch/shared";
import { Button } from "@fin-catch/ui/components/atoms";

/**
 * Props for OrderBook component
 */
interface OrderBookProps {
  /** Trading service instance */
  tradingService: ITradingAuthService;
  /** Platform ID */
  platform: TradingPlatformId;
  /** Account number */
  accountNo: string;
  /** List of orders */
  orders: Order[];
  /** Loading state */
  isLoading?: boolean;
  /** Callback when order is cancelled */
  onCancelOrder?: (orderId: number) => void;
  /** Callback to refresh orders */
  onRefresh?: () => void;
}

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
 * Get status badge style and icon
 */
const getStatusStyle = (
  status: OrderStatus,
): { bg: string; color: string; icon: React.ReactNode } => {
  switch (status) {
    case "filled":
      return {
        bg: "rgba(0, 255, 136, 0.15)",
        color: "#00ff88",
        icon: <Check className="w-3 h-3" />,
      };
    case "partiallyFilled":
      return {
        bg: "rgba(0, 212, 255, 0.15)",
        color: "#00d4ff",
        icon: <Clock className="w-3 h-3" />,
      };
    case "new":
    case "pending":
      return {
        bg: "rgba(255, 165, 0, 0.15)",
        color: "#ffa500",
        icon: <Clock className="w-3 h-3" />,
      };
    case "rejected":
      return {
        bg: "rgba(255, 51, 102, 0.15)",
        color: "#ff3366",
        icon: <XCircle className="w-3 h-3" />,
      };
    case "cancelled":
      return {
        bg: "rgba(128, 128, 128, 0.15)",
        color: "#888",
        icon: <X className="w-3 h-3" />,
      };
    case "expired":
    case "doneForDay":
    default:
      return {
        bg: "rgba(128, 128, 128, 0.15)",
        color: "#888",
        icon: <Clock className="w-3 h-3" />,
      };
  }
};

/**
 * Check if order can be cancelled
 */
const canCancelOrder = (status: OrderStatus): boolean => {
  return (
    status === "pending" || status === "new" || status === "partiallyFilled"
  );
};

/**
 * OrderBook component
 *
 * Displays list of today's orders with:
 * - Order details (symbol, side, type, price, qty)
 * - Status badges
 * - Cancel button for pending orders
 */
export const OrderBook: React.FC<OrderBookProps> = ({
  tradingService,
  platform,
  accountNo,
  orders,
  isLoading = false,
  onCancelOrder,
  onRefresh,
}) => {
  const [cancellingOrderId, setCancellingOrderId] = React.useState<
    number | null
  >(null);

  const handleCancel = async (orderId: number) => {
    setCancellingOrderId(orderId);
    try {
      await tradingService.cancelOrder(platform, accountNo, orderId);
      onCancelOrder?.(orderId);
    } catch (err) {
      console.error("Failed to cancel order:", err);
    } finally {
      setCancellingOrderId(null);
    }
  };

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
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3
          className="text-lg font-semibold"
          style={{ color: "var(--color-text-primary)" }}
        >
          Orders
        </h3>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2 rounded-lg transition-colors hover:bg-white/10 disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw
            className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
            style={{ color: "var(--color-text-secondary)" }}
          />
        </button>
      </div>

      {/* Loading State */}
      {isLoading && orders.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <Loader2
            className="w-5 h-5 animate-spin"
            style={{ color: "#00d4ff" }}
          />
          <span
            className="ml-2 text-sm"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Loading orders...
          </span>
        </div>
      ) : orders.length === 0 ? (
        <div
          className="text-center py-8"
          style={{ color: "var(--color-text-secondary)" }}
        >
          <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No orders today</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const statusStyle = getStatusStyle(order.orderStatus);
            const isBuy = order.side === "NB";
            const isCancelling = cancellingOrderId === order.id;

            return (
              <div
                key={order.id}
                className="p-4 rounded-xl border"
                style={{
                  background: "rgba(15, 23, 42, 0.5)",
                  borderColor: "rgba(123, 97, 255, 0.2)",
                }}
              >
                <div className="flex items-start justify-between">
                  {/* Left: Order Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {/* Symbol */}
                      <span
                        className="font-semibold"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {order.symbol}
                      </span>
                      {/* Side Badge */}
                      <span
                        className="px-2 py-0.5 rounded text-xs font-medium"
                        style={{
                          background: isBuy
                            ? "rgba(0, 255, 136, 0.15)"
                            : "rgba(255, 51, 102, 0.15)",
                          color: isBuy ? "#00ff88" : "#ff3366",
                        }}
                      >
                        {isBuy ? "BUY" : "SELL"}
                      </span>
                      {/* Order Type */}
                      <span
                        className="text-xs"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        {order.orderType}
                      </span>
                    </div>

                    {/* Quantity and Price */}
                    <div
                      className="text-sm"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      <span>
                        {formatCurrency(order.fillQuantity)}/
                        {formatCurrency(order.quantity)}
                      </span>
                      {order.price && (
                        <span className="ml-2">
                          @ {formatCurrency(order.price)} VND
                        </span>
                      )}
                      {order.avgPrice && order.avgPrice !== order.price && (
                        <span
                          className="ml-2"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          (avg: {formatCurrency(order.avgPrice)})
                        </span>
                      )}
                    </div>

                    {/* Time */}
                    {order.createdTime && (
                      <div
                        className="text-xs mt-1"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        {new Date(order.createdTime).toLocaleTimeString()}
                      </div>
                    )}
                  </div>

                  {/* Right: Status and Actions */}
                  <div className="flex flex-col items-end gap-2">
                    {/* Status Badge */}
                    <div
                      className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
                      style={{
                        background: statusStyle.bg,
                        color: statusStyle.color,
                      }}
                    >
                      {statusStyle.icon}
                      <span className="capitalize">
                        {order.orderStatus.replace(/([A-Z])/g, " $1").trim()}
                      </span>
                    </div>

                    {/* Cancel Button */}
                    {canCancelOrder(order.orderStatus) && (
                      <Button
                        variant="secondary"
                        onClick={() => handleCancel(order.id)}
                        disabled={isCancelling}
                        className="text-xs px-2 py-1"
                        style={{
                          background: "rgba(255, 51, 102, 0.1)",
                          borderColor: "rgba(255, 51, 102, 0.3)",
                          color: "#ff3366",
                        }}
                      >
                        {isCancelling ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            <X className="w-3 h-3 mr-1" />
                            Cancel
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Reject Reason */}
                {order.rejectReason && (
                  <div
                    className="mt-2 text-xs p-2 rounded"
                    style={{
                      background: "rgba(255, 51, 102, 0.1)",
                      color: "#ff3366",
                    }}
                  >
                    {order.rejectReason}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
