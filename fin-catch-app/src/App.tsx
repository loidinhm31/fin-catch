import { useState } from "react";
import { FinancialDataPage, PortfolioPage } from "./components/pages";
import { LineChart, Wallet } from "lucide-react";
import "./styles/global.css";

type Page = "financial-data" | "portfolio";

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("portfolio");

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Page Content */}
      <div className="pb-20">
        {currentPage === "financial-data" ? <FinancialDataPage /> : <PortfolioPage />}
      </div>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-gray-200 shadow-lg">
        <div className="max-w-lg mx-auto px-4">
          <div className="flex justify-around items-center py-2">
            <button
              onClick={() => setCurrentPage("financial-data")}
              className={`flex flex-col items-center justify-center gap-1 px-6 py-2 rounded-xl transition-all min-w-[80px] min-h-[56px] ${
                currentPage === "financial-data"
                  ? "text-blue-600"
                  : "text-gray-500"
              }`}
            >
              <LineChart className={`w-6 h-6 ${currentPage === "financial-data" ? "stroke-[2.5]" : "stroke-2"}`} />
              <span className={`text-xs ${currentPage === "financial-data" ? "font-bold" : "font-medium"}`}>
                Market
              </span>
            </button>
            <button
              onClick={() => setCurrentPage("portfolio")}
              className={`flex flex-col items-center justify-center gap-1 px-6 py-2 rounded-xl transition-all min-w-[80px] min-h-[56px] ${
                currentPage === "portfolio"
                  ? "text-purple-600"
                  : "text-gray-500"
              }`}
            >
              <Wallet className={`w-6 h-6 ${currentPage === "portfolio" ? "stroke-[2.5]" : "stroke-2"}`} />
              <span className={`text-xs ${currentPage === "portfolio" ? "font-bold" : "font-medium"}`}>
                Portfolio
              </span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}