import React from "react";

export interface TabItem<T extends string> {
  id: T;
  label: string;
  icon: React.ReactNode;
  color: string;
}

export interface TabNavigatorProps<T extends string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onTabChange: (tabId: T) => void;
}

export function TabNavigator<T extends string>({
  tabs,
  activeTab,
  onTabChange,
}: TabNavigatorProps<T>) {
  return (
    <div className="flex gap-3 mb-3">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all ${
            activeTab === tab.id
              ? `${tab.color} text-white shadow-lg`
              : "glass-button text-gray-700"
          }`}
          style={{ fontSize: "var(--text-sm)" }}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
