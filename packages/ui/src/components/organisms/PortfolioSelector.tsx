import React from "react";
import { Pencil, Plus, X } from "lucide-react";
import { Portfolio } from "@fin-catch/shared";

export interface PortfolioSelectorProps {
  portfolios: Portfolio[];
  selectedPortfolioId: string | null;
  onSelect: (portfolioId: string) => void;
  onEdit?: (portfolioId: string) => void;
  onDelete: (portfolioId: string) => void;
  onCreateNew: () => void;
}

export const PortfolioSelector: React.FC<PortfolioSelectorProps> = ({
  portfolios,
  selectedPortfolioId,
  onSelect,
  onEdit,
  onDelete,
  onCreateNew,
}) => {
  return (
    <div>
      <h2
        style={{
          fontSize: "var(--text-xl)",
          fontWeight: "var(--font-bold)",
          color: "var(--cube-gray-900)",
          marginBottom: "var(--space-4)",
        }}
      >
        Your Portfolios
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {portfolios.map((portfolio) => (
          <div
            key={portfolio.id}
            className={`relative flex-shrink-0 ${selectedPortfolioId === portfolio.id ? "z-10 mr-2" : ""}`}
          >
            <button
              onClick={() => onSelect(portfolio.id!)}
              className={`px-4 py-3 rounded-xl font-bold transition-all ${
                selectedPortfolioId === portfolio.id
                  ? "bg-[#A855F7] text-white shadow-[0_0_15px_rgba(168,85,247,0.5)] pr-14"
                  : "glass-button"
              }`}
              style={{ fontSize: "var(--text-sm)" }}
            >
              {portfolio.name}
            </button>
            {selectedPortfolioId === portfolio.id && (
              <>
                {onEdit && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(portfolio.id!);
                    }}
                    className="absolute top-1/2 -translate-y-1/2 right-8 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600 cursor-pointer"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onEdit(portfolio.id!);
                      }
                    }}
                  >
                    <Pencil className="w-3 h-3" />
                  </span>
                )}
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(portfolio.id!);
                  }}
                  className="absolute top-1/2 -translate-y-1/2 right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 cursor-pointer"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onDelete(portfolio.id!);
                    }
                  }}
                >
                  <X className="w-3 h-3" />
                </span>
              </>
            )}
          </div>
        ))}
        <button
          onClick={onCreateNew}
          className="glass-button flex-shrink-0 px-4 py-3 rounded-xl font-bold transition-all"
          style={{ fontSize: "var(--text-sm)" }}
        >
          <Plus className="w-5 h-5 inline-block mr-2" />
          NEW
        </button>
      </div>
    </div>
  );
};
