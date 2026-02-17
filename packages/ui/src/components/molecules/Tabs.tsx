import React from "react";

export interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = "",
}) => {
  const [hoveredTab, setHoveredTab] = React.useState<string | null>(null);

  return (
    <div
      className={`flex space-x-2 ${className}`}
      style={{
        borderBottom: "1px solid var(--glass-border-light)",
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        const isHovered = hoveredTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            onMouseEnter={() => setHoveredTab(tab.id)}
            onMouseLeave={() => setHoveredTab(null)}
            className="flex items-center space-x-2 px-4 py-3 font-medium text-sm transition-all duration-200"
            style={{
              borderBottom: "2px solid",
              borderBottomColor: isActive
                ? "var(--color-cyan-500)"
                : isHovered
                  ? "var(--glass-border-medium)"
                  : "transparent",
              marginBottom: "-1px",
              color: isActive
                ? "var(--color-cyan-500)"
                : isHovered
                  ? "var(--color-text-primary)"
                  : "var(--color-text-secondary)",
            }}
          >
            {tab.icon && <span>{tab.icon}</span>}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};
