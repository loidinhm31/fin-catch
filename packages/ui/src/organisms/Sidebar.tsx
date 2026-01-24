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
} from "lucide-react";
import { useSyncStatus } from "@fin-catch/ui/hooks";

type Page = "financial-data" | "portfolio" | "settings";

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
  const { authStatus, syncStatus, isSyncing, lastSyncSuccess, error } =
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
        activeColor: "#22D3EE",
        activeBg: "rgba(34, 211, 238, 0.15)",
      },
      {
        id: "portfolio",
        label: "Portfolio",
        icon: Wallet,
        activeColor: "#8B5CF6",
        activeBg: "rgba(139, 92, 246, 0.15)",
      },
      {
        id: "settings",
        label: "Settings",
        icon: Settings,
        activeColor: "#00D4FF",
        activeBg: "rgba(0, 212, 255, 0.15)",
      },
    ];

  // Sync status helpers
  const getSyncIcon = () => {
    if (isSyncing) return RefreshCw;
    if (!authStatus?.isAuthenticated) return CloudOff;
    if (error) return AlertCircle;
    if (lastSyncSuccess === false) return AlertTriangle;
    if (lastSyncSuccess === true) return CheckCircle2;
    return Cloud;
  };

  const getSyncColor = () => {
    if (isSyncing) return "#00d4ff";
    if (!authStatus?.isAuthenticated) return "#718096";
    if (error) return "#ff3366";
    if (lastSyncSuccess === false) return "#ffaa00";
    if (syncStatus?.pendingChanges && syncStatus.pendingChanges > 0)
      return "#00d4ff";
    if (lastSyncSuccess === true) return "#00ff88";
    return "#a0aec0";
  };

  const pendingCount = syncStatus?.pendingChanges ?? 0;
  const SyncIcon = getSyncIcon();

  return (
    <aside
      className={`fixed left-0 top-0 bottom-0 z-40 hidden md:flex flex-col border-r transition-all duration-300 ${isCollapsed ? "w-16" : "w-64"
        }`}
      style={{
        background: "rgba(15, 23, 42, 0.85)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderRightColor: "rgba(255, 255, 255, 0.1)",
        boxShadow: "4px 0 20px rgba(0, 0, 0, 0.4)",
      }}
    >
      {/* Logo / Brand */}
      <div
        className={`flex items-center gap-3 py-5 border-b transition-all duration-300 ${isCollapsed ? "px-3 justify-center" : "px-6"
          }`}
        style={{ borderBottomColor: "rgba(255, 255, 255, 0.1)" }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: "linear-gradient(135deg, #22D3EE 0%, #8B5CF6 100%)",
            boxShadow: "0 4px 12px rgba(34, 211, 238, 0.3)",
          }}
        >
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        {!isCollapsed && (
          <div className="overflow-hidden">
            <h1
              className="text-lg font-bold text-white whitespace-nowrap"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              FinCatch
            </h1>
            <p className="text-xs text-slate-400 whitespace-nowrap">
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
                  className={`w-full flex items-center gap-3 py-3 rounded-xl transition-all duration-200 group ${isCollapsed ? "px-0 justify-center" : "px-4"
                    }`}
                  style={{
                    color: isActive ? activeColor : "#94A3B8",
                    background: isActive ? activeBg : "transparent",
                    fontFamily: "var(--font-heading)",
                  }}
                >
                  <Icon
                    className={`w-5 h-5 flex-shrink-0 transition-all ${isActive
                        ? "stroke-[2.5]"
                        : "stroke-2 group-hover:stroke-[2.5]"
                      }`}
                  />
                  {!isCollapsed && (
                    <>
                      <span
                        className={`text-sm whitespace-nowrap ${isActive ? "font-semibold" : "font-medium"
                          }`}
                      >
                        {label}
                      </span>
                      {isActive && (
                        <div
                          className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
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
        className="mx-3 mb-3 p-2 rounded-lg transition-all hover:bg-white/5 flex items-center justify-center"
        style={{ color: "#64748B" }}
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
        style={{ borderTopColor: "rgba(255, 255, 255, 0.1)" }}
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
          className={`w-full flex items-center gap-2 p-2 rounded-lg transition-all hover:bg-white/5 ${isCollapsed ? "justify-center" : ""
            }`}
          style={{ color: getSyncColor() }}
        >
          <SyncIcon
            className={`w-5 h-5 flex-shrink-0 ${isSyncing ? "animate-spin" : ""}`}
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
            <span
              className="absolute ml-6 -mt-4 flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full text-[9px] font-bold"
              style={{
                background: "linear-gradient(135deg, #00d4ff 0%, #7b61ff 100%)",
                color: "#ffffff",
              }}
            >
              {pendingCount > 99 ? "99+" : pendingCount}
            </span>
          )}
        </button>
        {!isCollapsed && (
          <p className="text-xs text-slate-500 text-center mt-2">v1.0.0</p>
        )}
      </div>
    </aside>
  );
}
