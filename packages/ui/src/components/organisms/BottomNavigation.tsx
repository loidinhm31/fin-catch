import { LineChart, Wallet, Settings, ArrowLeftRight } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useNav } from "@fin-catch/ui/hooks";

type Page = "financial-data" | "portfolio" | "trading" | "settings";

const navItems: {
  id: Page;
  label: string;
  icon: typeof LineChart;
  path: string;
  activeColor: string;
  activeBg: string;
}[] = [
  {
    id: "financial-data",
    label: "Market",
    icon: LineChart,
    path: "/market",
    activeColor: "var(--color-nav-market-active)",
    activeBg: "var(--color-nav-market-bg)",
  },
  {
    id: "portfolio",
    label: "Portfolio",
    icon: Wallet,
    path: "/portfolio",
    activeColor: "var(--color-nav-portfolio-active)",
    activeBg: "var(--color-nav-portfolio-bg)",
  },
  {
    id: "trading",
    label: "Trading",
    icon: ArrowLeftRight,
    path: "/trading",
    activeColor: "var(--color-nav-trading-active)",
    activeBg: "var(--color-nav-trading-bg)",
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    path: "/settings",
    activeColor: "var(--color-nav-settings-active)",
    activeBg: "var(--color-nav-settings-bg)",
  },
];

export function BottomNavigation() {
  const { to } = useNav();

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
          {navItems.map(
            ({ id, label, icon: Icon, path, activeColor, activeBg }) => (
              <NavLink
                key={id}
                to={to(path)}
                className="flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all min-w-[70px] min-h-[56px]"
                style={({ isActive }) => ({
                  color: isActive ? activeColor : "var(--color-nav-inactive)",
                  background: isActive ? activeBg : "transparent",
                  fontFamily: "var(--font-family-heading)",
                })}
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-6 h-6 ${isActive ? "stroke-[2.5]" : "stroke-2"}`}
                    />
                    <span
                      className={`text-xs ${isActive ? "font-bold" : "font-medium"}`}
                    >
                      {label}
                    </span>
                  </>
                )}
              </NavLink>
            ),
          )}
        </div>
      </div>
    </nav>
  );
}
