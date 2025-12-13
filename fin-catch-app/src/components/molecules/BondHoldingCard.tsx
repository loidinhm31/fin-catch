import React from "react";
import { ChevronDown, ChevronUp, Edit, Trash2 } from "lucide-react";
import { CurrencyCode, EntryPerformance, PortfolioEntry } from "@/types";
import { CouponPaymentsSection } from "./CouponPaymentsSection";

export interface BondHoldingCardProps {
  entryPerf: EntryPerformance;
  displayCurrency: CurrencyCode;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: (entry: PortfolioEntry) => void;
  onDelete: (entryId: number) => void;
  onPaymentsChange?: () => void;
  formatCurrency: (value: number, currency?: CurrencyCode) => string;
  formatPercentage: (value: number) => string;
  formatDate: (timestamp: number) => string;
}

export const BondHoldingCard: React.FC<BondHoldingCardProps> = ({
  entryPerf,
  displayCurrency,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onPaymentsChange,
  formatCurrency,
  formatPercentage,
  formatDate,
}) => {
  const entry = entryPerf.entry;
  const isPositive = entryPerf.gain_loss >= 0;

  return (
    <div className="glass-card p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold"
              style={{
                backgroundColor: "#f3e8ff",
                color: "#6b21a8",
              }}
            >
              BOND
            </span>
            {entry.currency && (
              <span
                className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold"
                style={{
                  backgroundColor:
                    entry.currency === displayCurrency ? "#d1fae5" : "#fce7f3",
                  color:
                    entry.currency === displayCurrency ? "#065f46" : "#9f1239",
                }}
              >
                {entry.currency}
              </span>
            )}
            <h3
              style={{
                fontSize: "var(--text-lg)",
                fontWeight: "var(--font-bold)",
                color: "var(--cube-gray-900)",
              }}
            >
              {entry.symbol}
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--cube-gray-500)",
                  marginBottom: "2px",
                }}
              >
                Current Value
              </p>
              <p
                style={{
                  fontWeight: "var(--font-bold)",
                  color: "var(--cube-gray-900)",
                }}
              >
                {formatCurrency(entryPerf.current_value)}
              </p>
            </div>
            <div>
              <p
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--cube-gray-500)",
                  marginBottom: "2px",
                }}
              >
                P&L
              </p>
              <p
                style={{
                  fontWeight: "var(--font-bold)",
                  color: isPositive ? "#10b981" : "#ef4444",
                }}
              >
                {formatCurrency(entryPerf.gain_loss)}
              </p>
              <p
                style={{
                  fontSize: "var(--text-xs)",
                  color: isPositive ? "#10b981" : "#ef4444",
                }}
              >
                {formatPercentage(entryPerf.gain_loss_percentage)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 ml-4">
        <button
          onClick={() => onEdit(entry)}
          className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center hover:bg-blue-200 transition-all"
        >
          <Edit className="w-4 h-4" style={{ color: "#2563eb" }} />
        </button>
        <button
          onClick={() => onDelete(entry.id!)}
          className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center hover:bg-red-200 transition-all"
        >
          <Trash2 className="w-4 h-4" style={{ color: "#dc2626" }} />
        </button>
        <button
          onClick={onToggleExpand}
          className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-all"
        >
          {isExpanded ? (
            <ChevronUp
              className="w-4 h-4"
              style={{ color: "var(--cube-gray-700)" }}
            />
          ) : (
            <ChevronDown
              className="w-4 h-4"
              style={{ color: "var(--cube-gray-700)" }}
            />
          )}
        </button>
      </div>

      {isExpanded && (
        <div
          className="pt-3 border-t space-y-2"
          style={{ borderColor: "rgba(0, 0, 0, 0.1)" }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--cube-gray-500)",
                }}
              >
                Quantity (bonds)
              </p>
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-medium)",
                  color: "var(--cube-gray-900)",
                }}
              >
                {entry.quantity}
              </p>
            </div>
            <div>
              <p
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--cube-gray-500)",
                }}
              >
                Purchase Price per bond ({displayCurrency})
              </p>
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-medium)",
                  color: "var(--cube-gray-900)",
                }}
              >
                {formatCurrency(entryPerf.purchase_price || 0)}
              </p>
            </div>
            <div>
              <p
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--cube-gray-500)",
                }}
              >
                Current Price per bond ({displayCurrency})
              </p>
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-medium)",
                  color: "var(--cube-gray-900)",
                }}
              >
                {formatCurrency(entryPerf.current_price)}
              </p>
            </div>
            <div>
              <p
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--cube-gray-500)",
                }}
              >
                Purchase Date
              </p>
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-medium)",
                  color: "var(--cube-gray-900)",
                }}
              >
                {formatDate(entry.purchase_date)}
              </p>
            </div>
            {entry.currency &&
              entry.currency !== displayCurrency &&
              entryPerf.exchange_rate && (
                <div className="col-span-2">
                  <p
                    style={{
                      fontSize: "var(--text-xs)",
                      color: "var(--cube-gray-500)",
                    }}
                  >
                    Exchange Rate
                  </p>
                  <p
                    style={{
                      fontSize: "var(--text-sm)",
                      fontWeight: "var(--font-medium)",
                      color: "var(--cube-gray-900)",
                    }}
                  >
                    1 {entry.currency} = {entryPerf.exchange_rate.toFixed(4)}{" "}
                    {displayCurrency}
                  </p>
                </div>
              )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p style={{ fontSize: "var(--text-xs)", color: "var(--cube-gray-500)" }}>
                Face Value
              </p>
              <p style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)", color: "var(--cube-gray-900)" }}>
                {entry.face_value ? formatCurrency(entry.face_value, entry.currency) : "N/A"}
              </p>
            </div>
            <div>
              <p style={{ fontSize: "var(--text-xs)", color: "var(--cube-gray-500)" }}>
                Coupon Rate
              </p>
              <p style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)", color: "var(--cube-gray-900)" }}>
                {entry.coupon_rate ? `${entry.coupon_rate.toFixed(2)}%` : "N/A"}
              </p>
            </div>
            <div>
              <p style={{ fontSize: "var(--text-xs)", color: "var(--cube-gray-500)" }}>
                Maturity Date
              </p>
              <p style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)", color: "var(--cube-gray-900)" }}>
                {entry.maturity_date ? formatDate(entry.maturity_date) : "N/A"}
              </p>
            </div>
            <div>
              <p style={{ fontSize: "var(--text-xs)", color: "var(--cube-gray-500)" }}>
                Frequency
              </p>
              <p style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)", color: "var(--cube-gray-900)" }}>
                {entry.coupon_frequency ? entry.coupon_frequency.charAt(0).toUpperCase() + entry.coupon_frequency.slice(1) : "N/A"}
              </p>
            </div>
            {entry.current_market_price && (
              <div className="col-span-2">
                <p style={{ fontSize: "var(--text-xs)", color: "var(--cube-gray-500)" }}>
                  Current Market Price (Manual)
                </p>
                <p style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)", color: "var(--cube-gray-900)" }}>
                  {formatCurrency(entry.current_market_price, entry.currency)}
                  {entry.last_price_update && (
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--cube-gray-500)", marginLeft: "4px" }}>
                      (Updated: {formatDate(entry.last_price_update)})
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Coupon Payments Section */}
          {entry.id && (
            <CouponPaymentsSection
              entryId={entry.id}
              entryCurrency={entry.currency || "USD"}
              displayCurrency={displayCurrency}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              onPaymentsChange={onPaymentsChange}
            />
          )}

          {entry.notes && (
            <div>
              <p
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--cube-gray-500)",
                }}
              >
                Notes
              </p>
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  color: "var(--cube-gray-900)",
                }}
              >
                {entry.notes}
              </p>
            </div>
          )}
          {entry.tags && (
            <div>
              <p
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--cube-gray-500)",
                }}
              >
                Tags
              </p>
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  color: "var(--cube-gray-900)",
                }}
              >
                {entry.tags}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
