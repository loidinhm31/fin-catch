import {
  LineChart,
  Wallet,
  Settings,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Cloud,
  CloudOff,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ArrowLeftRight,
} from "lucide-react";
import { useSyncStatus } from "@fin-catch/ui/hooks";

type Page = "financial-data" | "portfolio" | "trading" | "settings";

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onSyncTap?: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({
  currentPage,
  onNavigate,
  onSyncTap,
  isCollapsed,
  onToggleCollapse,
}: SidebarProps) {
  const { isAuthenticated, syncStatus, isSyncing, lastSyncSuccess, error } =
    useSyncStatus();

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

  // Sync status helpers
  const getSyncIcon = () => {
    if (isSyncing) return RefreshCw;
    if (!isAuthenticated) return CloudOff;
    if (error) return AlertCircle;
    if (lastSyncSuccess === false) return AlertTriangle;
    if (lastSyncSuccess === true) return CheckCircle2;
    return Cloud;
  };

  const getSyncColor = () => {
    if (isSyncing) return "var(--color-cyan-400)";
    if (!isAuthenticated) return "var(--color-text-muted)";
    if (error) return "var(--color-red-400)";
    if (lastSyncSuccess === false) return "var(--color-amber-400)";
    if (syncStatus?.pendingChanges && syncStatus.pendingChanges > 0)
      return "var(--color-cyan-400)";
    if (lastSyncSuccess === true) return "var(--color-nav-trading-active)";
    return "var(--color-text-muted)";
  };

  const pendingCount = syncStatus?.pendingChanges ?? 0;
  const SyncIcon = getSyncIcon();

  return (
    <aside
      className={`
        fixed left-0 top-0 bottom-0 z-40 hidden md:flex flex-col
        border-r transition-all duration-300
        ${isCollapsed ? "w-16" : "w-64"}
      `}
      style={{
        background: "var(--glass-bg-dark-strong)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderRightColor: "var(--glass-border-light)",
        boxShadow: "var(--shadow-md)",
      }}
    >
      {/* Logo / Brand */}
      <div
        className={`
          flex items-center gap-3 py-5 border-b
          transition-all duration-300
          ${isCollapsed ? "px-3 justify-center" : "px-6"}
        `}
        style={{
          borderBottomColor: "var(--glass-border-light)",
        }}
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-(--color-violet-500) shadow-(--shadow-glow-violet)">
          <TrendingUp className="w-5 h-5 text-(--color-text-primary)" />
        </div>
        {!isCollapsed && (
          <div className="overflow-hidden">
            <h1 className="text-lg font-bold whitespace-nowrap text-(--color-text-primary)">
              FinCatch
            </h1>
            <p className="text-xs whitespace-nowrap text-(--color-text-secondary)">
              Financial Tracker
            </p>
          </div>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {navItems.map(({ id, label, icon: Icon, activeColor, activeBg }) => {
            const isActive = currentPage === id;
            return (
              <li key={id}>
                <button
                  onClick={() => onNavigate(id)}
                  title={isCollapsed ? label : undefined}
                  className={`
                    w-full flex items-center gap-3 py-3 rounded-xl
                    transition-all duration-200 group
                    ${isCollapsed ? "px-0 justify-center" : "px-4"}
                  `}
                  style={{
                    color: isActive ? activeColor : "var(--color-nav-inactive)",
                    background: isActive ? activeBg : "transparent",
                  }}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 transition-all ${
                      isActive
                        ? "stroke-[2.5]"
                        : "stroke-2 group-hover:stroke-[2.5]"
                    }`}
                  />
                  {!isCollapsed && (
                    <>
                      <span
                        className={`text-sm whitespace-nowrap ${
                          isActive ? "font-semibold" : "font-medium"
                        }`}
                      >
                        {label}
                      </span>
                      {isActive && (
                        <div
                          className="ml-auto w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ background: activeColor }}
                        />
                      )}
                    </>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse Toggle Button */}
      <button
        onClick={onToggleCollapse}
        className="mx-3 mb-3 p-2 rounded-lg transition-all hover:bg-white/5 flex items-center justify-center text-(--color-text-muted)"
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? (
          <ChevronRight className="w-5 h-5" />
        ) : (
          <ChevronLeft className="w-5 h-5" />
        )}
      </button>

      {/* Footer with Sync Status */}
      <div
        className={`py-4 border-t ${isCollapsed ? "px-2" : "px-4"}`}
        style={{
          borderTopColor: "var(--glass-border-light)",
        }}
      >
        <button
          onClick={onSyncTap}
          title={
            isSyncing
              ? "Syncing..."
              : pendingCount > 0
                ? `${pendingCount} pending`
                : "Sync status"
          }
          className={`w-full flex items-center gap-2 p-2 rounded-lg transition-all hover:bg-white/5 ${
            isCollapsed ? "justify-center" : ""
          }`}
          style={{ color: getSyncColor() }}
        >
          <SyncIcon
            className={`w-5 h-5 shrink-0 ${isSyncing ? "animate-spin" : ""}`}
          />
          {!isCollapsed && (
            <span className="text-sm font-medium">
              {isSyncing
                ? "Syncing..."
                : pendingCount > 0
                  ? `${pendingCount} pending`
                  : "Synced"}
            </span>
          )}
          {isCollapsed && pendingCount > 0 && (
            <span className="absolute ml-6 -mt-4 flex items-center justify-center min-w-4 h-4 px-1 rounded-full text-[9px] font-bold bg-(--color-violet-500) shadow-(--shadow-glow-violet) text-(--color-text-primary)">
              {pendingCount > 99 ? "99+" : pendingCount}
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}
