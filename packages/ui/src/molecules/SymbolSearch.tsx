import React, { useState, useCallback } from "react";
import { Search } from "lucide-react";

/**
 * Props for SymbolSearch component
 */
export interface SymbolSearchProps {
  /** Callback when a symbol is selected */
  onSelect: (symbol: string) => void;
  /** Placeholder text for input */
  placeholder?: string;
  /** Initial value for the input */
  initialValue?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Popular symbols to show as quick selection */
  popularSymbols?: string[];
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
 * SymbolSearch component
 *
 * Simple symbol input with popular symbols for quick selection.
 * Used for selecting stocks to view market data.
 */
export const SymbolSearch: React.FC<SymbolSearchProps> = ({
  onSelect,
  placeholder = "Enter symbol (e.g., VNM, FPT, VIC)",
  initialValue = "",
  disabled = false,
  popularSymbols = DEFAULT_POPULAR_SYMBOLS,
}) => {
  const [input, setInput] = useState(initialValue);

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim().toUpperCase();
    if (trimmed) {
      onSelect(trimmed);
    }
  }, [input, onSelect]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInput(e.target.value.toUpperCase());
    },
    [],
  );

  const handleQuickSelect = useCallback(
    (symbol: string) => {
      setInput(symbol);
      onSelect(symbol);
    },
    [onSelect],
  );

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4" style={{ color: "#00d4ff" }} />
        </div>
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm transition-all duration-200
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
        {input && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={disabled}
            className="absolute inset-y-0 right-0 pr-3 flex items-center transition-colors
                     hover:text-white disabled:opacity-50"
            style={{ color: "#00d4ff" }}
          >
            <span className="text-xs font-medium">GO</span>
          </button>
        )}
      </div>

      {/* Popular Symbols */}
      <div className="flex flex-wrap gap-2">
        {popularSymbols.map((symbol) => (
          <button
            key={symbol}
            type="button"
            onClick={() => handleQuickSelect(symbol)}
            disabled={disabled}
            className="px-3 py-1.5 rounded text-xs font-medium transition-all duration-200
                     hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: "rgba(15, 22, 41, 0.8)",
              border: "1px solid rgba(0, 212, 255, 0.2)",
              color: "#00d4ff",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(0, 212, 255, 0.15)";
              e.currentTarget.style.borderColor = "rgba(0, 212, 255, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(15, 22, 41, 0.8)";
              e.currentTarget.style.borderColor = "rgba(0, 212, 255, 0.2)";
            }}
          >
            {symbol}
          </button>
        ))}
      </div>
    </div>
  );
};
