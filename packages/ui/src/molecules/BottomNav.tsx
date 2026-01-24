import { LineChart, Wallet, Settings, ArrowLeftRight } from "lucide-react";

type Page = "financial-data" | "portfolio" | "trading" | "settings";

interface BottomNavProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

export function BottomNav({ currentPage, onNavigate }: BottomNavProps) {
  const navItems: {
    id: Page;
    label: string;
    icon: typeof LineChart;
    activeColor: string;
  }[] = [
    {
      id: "financial-data",
      label: "Market",
      icon: LineChart,
      activeColor: "#22D3EE",
    },
    {
      id: "portfolio",
      label: "Portfolio",
      icon: Wallet,
      activeColor: "#8B5CF6",
    },
    {
      id: "trading",
      label: "Trading",
      icon: ArrowLeftRight,
      activeColor: "#00FF88",
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      activeColor: "#00D4FF",
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t md:hidden"
      style={{
        background: "rgba(15, 23, 42, 0.85)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderTopColor: "rgba(255, 255, 255, 0.1)",
        boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.4)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="max-w-lg mx-auto px-4">
        <div className="flex justify-around items-center py-2">
          {navItems.map(({ id, label, icon: Icon, activeColor }) => {
            const isActive = currentPage === id;
            return (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                className="flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all min-w-[70px] min-h-[56px]"
                style={{
                  color: isActive ? activeColor : "#64748B",
                  background: isActive ? `${activeColor}26` : "transparent",
                  fontFamily: "var(--font-heading)",
                }}
              >
                <Icon
                  className={`w-6 h-6 ${isActive ? "stroke-[2.5]" : "stroke-2"}`}
                />
                <span
                  className={`text-xs ${isActive ? "font-bold" : "font-medium"}`}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
