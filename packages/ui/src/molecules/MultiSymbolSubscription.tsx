import React, { useState, useCallback } from "react";
import { Plus, X, RefreshCw } from "lucide-react";
import type { OhlcResolution } from "@fin-catch/shared";

/**
 * Props for MultiSymbolSubscription component
 */
export interface MultiSymbolSubscriptionProps {
  /** Callback when symbols should be subscribed */
  onSubscribe: (
    symbols: string[],
    includeOhlc: boolean,
    ohlcResolution: OhlcResolution,
  ) => void;
  /** Callback when a symbol should be unsubscribed */
  onUnsubscribe: (symbol: string) => void;
  /** Currently subscribed symbols */
  subscribedSymbols: string[];
  /** Placeholder text for input */
  placeholder?: string;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Whether a subscription is in progress */
  loading?: boolean;
}

/**
 * Default popular Vietnamese stock symbols
 */
const DEFAULT_POPULAR_SYMBOLS = [
  "VNM",
  "FPT",
  "VIC",
  "HPG",
  "TCB",
  "VCB",
  "MBB",
  "VHM",
];

/**
 * OHLC resolution options
 */
const RESOLUTION_OPTIONS: { value: OhlcResolution; label: string }[] = [
  { value: "1", label: "1m" },
  { value: "1H", label: "1H" },
  { value: "1D", label: "1D" },
  { value: "W", label: "W" },
];

/**
 * MultiSymbolSubscription component
 *
 * Input for subscribing to multiple symbols at once with OHLC option.
 * Displays subscribed symbols as removable chips.
 */
export const MultiSymbolSubscription: React.FC<
  MultiSymbolSubscriptionProps
> = ({
  onSubscribe,
  onUnsubscribe,
  subscribedSymbols,
  placeholder = "Enter symbols (e.g., VNM,FPT,MWG)",
  disabled = false,
  loading = false,
}) => {
  const [input, setInput] = useState("");
  const [includeOhlc, setIncludeOhlc] = useState(false);
  const [ohlcResolution, setOhlcResolution] = useState<OhlcResolution>("1");

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInput(e.target.value.toUpperCase());
    },
    [],
  );

  const handleSubscribe = useCallback(() => {
    const symbols = input
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter((s) => s.length > 0 && !subscribedSymbols.includes(s));

    if (symbols.length > 0) {
      onSubscribe(symbols, includeOhlc, ohlcResolution);
      setInput("");
    }
  }, [input, includeOhlc, ohlcResolution, subscribedSymbols, onSubscribe]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSubscribe();
      }
    },
    [handleSubscribe],
  );

  const handleQuickAdd = useCallback(
    (symbol: string) => {
      if (!subscribedSymbols.includes(symbol)) {
        onSubscribe([symbol], includeOhlc, ohlcResolution);
      }
    },
    [subscribedSymbols, includeOhlc, ohlcResolution, onSubscribe],
  );

  const handleClearAll = useCallback(() => {
    subscribedSymbols.forEach((symbol) => onUnsubscribe(symbol));
  }, [subscribedSymbols, onUnsubscribe]);

  return (
    <div className="space-y-3">
      {/* Input Row */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Symbol Input */}
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || loading}
            className="w-full px-3 py-2 rounded-lg text-sm transition-all duration-200
                     focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: "rgba(10, 14, 39, 0.5)",
              border: "1px solid rgba(0, 212, 255, 0.3)",
              color: "white",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#00d4ff";
              e.target.style.boxShadow = "0 0 0 2px rgba(0, 212, 255, 0.2)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "rgba(0, 212, 255, 0.3)";
              e.target.style.boxShadow = "none";
            }}
          />
        </div>

        {/* Include OHLC Checkbox */}
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={includeOhlc}
            onChange={(e) => setIncludeOhlc(e.target.checked)}
            disabled={disabled || loading}
            className="w-4 h-4 rounded border-2 cursor-pointer
                     focus:ring-2 focus:ring-offset-0 disabled:opacity-50"
            style={{
              borderColor: "rgba(0, 212, 255, 0.5)",
              accentColor: "#00d4ff",
            }}
          />
          <span className="text-xs text-gray-400">OHLC</span>
        </label>

        {/* Resolution Dropdown */}
        <select
          value={ohlcResolution}
          onChange={(e) => setOhlcResolution(e.target.value as OhlcResolution)}
          disabled={disabled || loading || !includeOhlc}
          className="px-2 py-2 rounded-lg text-xs transition-all duration-200
                   focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: "rgba(10, 14, 39, 0.5)",
            border: "1px solid rgba(0, 212, 255, 0.3)",
            color: includeOhlc ? "white" : "rgba(255,255,255,0.4)",
          }}
        >
          {RESOLUTION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Subscribe Button */}
        <button
          type="button"
          onClick={handleSubscribe}
          disabled={disabled || loading || !input.trim()}
          className="px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200
                   hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          style={{
            background: "linear-gradient(135deg, #00d4ff 0%, #00a8cc 100%)",
            color: "#0a0e27",
          }}
        >
          {loading ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
          Subscribe
        </button>
      </div>

      {/* Popular Symbols */}
      <div className="flex flex-wrap gap-1.5">
        {DEFAULT_POPULAR_SYMBOLS.map((symbol) => (
          <button
            key={symbol}
            type="button"
            onClick={() => handleQuickAdd(symbol)}
            disabled={disabled || loading || subscribedSymbols.includes(symbol)}
            className="px-2 py-1 rounded text-xs font-medium transition-all duration-200
                     hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: subscribedSymbols.includes(symbol)
                ? "rgba(0, 212, 255, 0.2)"
                : "rgba(15, 22, 41, 0.8)",
              border: subscribedSymbols.includes(symbol)
                ? "1px solid rgba(0, 212, 255, 0.5)"
                : "1px solid rgba(0, 212, 255, 0.2)",
              color: "#00d4ff",
            }}
          >
            {symbol}
          </button>
        ))}
      </div>

      {/* Subscribed Symbols as Chips */}
      {subscribedSymbols.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-400">Subscribed:</span>
          {subscribedSymbols.map((symbol) => (
            <div
              key={symbol}
              className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
              style={{
                background: "rgba(0, 212, 255, 0.15)",
                border: "1px solid rgba(0, 212, 255, 0.3)",
                color: "#00d4ff",
              }}
            >
              <span>{symbol}</span>
              <button
                type="button"
                onClick={() => onUnsubscribe(symbol)}
                disabled={disabled || loading}
                className="hover:text-white transition-colors disabled:opacity-50"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {subscribedSymbols.length > 1 && (
            <button
              type="button"
              onClick={handleClearAll}
              disabled={disabled || loading}
              className="text-xs text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50"
            >
              Clear All
            </button>
          )}
        </div>
      )}
    </div>
  );
};
