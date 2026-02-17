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
    activeBg: string;
  }[] = [
    {
      id: "financial-data",
      label: "Market",
      icon: LineChart,
      activeColor: "var(--color-nav-market-active)",
      activeBg: "var(--color-nav-market-bg)",
    },
    {
      id: "portfolio",
      label: "Portfolio",
      icon: Wallet,
      activeColor: "var(--color-nav-portfolio-active)",
      activeBg: "var(--color-nav-portfolio-bg)",
    },
    {
      id: "trading",
      label: "Trading",
      icon: ArrowLeftRight,
      activeColor: "var(--color-nav-trading-active)",
      activeBg: "var(--color-nav-trading-bg)",
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      activeColor: "var(--color-nav-settings-active)",
      activeBg: "var(--color-nav-settings-bg)",
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t md:hidden"
      style={{
        background: "var(--glass-bg-dark-strong)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderTopColor: "var(--glass-border-light)",
        boxShadow: "var(--shadow-md)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="max-w-lg mx-auto px-4">
        <div className="flex justify-around items-center py-2">
          {navItems.map(({ id, label, icon: Icon, activeColor, activeBg }) => {
            const isActive = currentPage === id;
            return (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                className="flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all min-w-[70px] min-h-[56px]"
                style={{
                  color: isActive ? activeColor : "var(--color-nav-inactive)",
                  background: isActive ? activeBg : "transparent",
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
