import { useState } from "react";
import { FinancialDataPage, PortfolioPage } from "./components/pages";
import { LineChart, Wallet } from "lucide-react";
import "./styles/global.css";

type Page = "financial-data" | "portfolio";

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("portfolio");

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #0A0E27 50%, #1E1B4B 100%)' }}>
      {/* Page Content */}
      <div className="pb-20">
        {currentPage === "financial-data" ? <FinancialDataPage /> : <PortfolioPage />}
      </div>

      {/* Bottom Navigation Bar - Glassmorphism Dark Mode */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t"
           style={{
             background: 'rgba(15, 23, 42, 0.85)',
             backdropFilter: 'blur(16px)',
             WebkitBackdropFilter: 'blur(16px)',
             borderTopColor: 'rgba(255, 255, 255, 0.1)',
             boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.4)'
           }}>
        <div className="max-w-lg mx-auto px-4">
          <div className="flex justify-around items-center py-2">
            <button
              onClick={() => setCurrentPage("financial-data")}
              className={`flex flex-col items-center justify-center gap-1 px-6 py-2 rounded-xl transition-all min-w-[80px] min-h-[56px]`}
              style={{
                color: currentPage === "financial-data" ? '#22D3EE' : '#64748B',
                background: currentPage === "financial-data" ? 'rgba(34, 211, 238, 0.15)' : 'transparent',
                fontFamily: 'var(--font-heading)'
              }}
            >
              <LineChart className={`w-6 h-6 ${currentPage === "financial-data" ? "stroke-[2.5]" : "stroke-2"}`} />
              <span className={`text-xs ${currentPage === "financial-data" ? "font-bold" : "font-medium"}`}>
                Market
              </span>
            </button>
            <button
              onClick={() => setCurrentPage("portfolio")}
              className={`flex flex-col items-center justify-center gap-1 px-6 py-2 rounded-xl transition-all min-w-[80px] min-h-[56px]`}
              style={{
                color: currentPage === "portfolio" ? '#8B5CF6' : '#64748B',
                background: currentPage === "portfolio" ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                fontFamily: 'var(--font-heading)'
              }}
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