import React from "react";
import { SyncSettings } from "@/components/organisms/SyncSettings";

interface SettingsPageProps {
  onLogout?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onLogout }) => {
  return (
    <div className="max-w-lg mx-auto">
      <SyncSettings onLogout={onLogout} />
    </div>
  );
};
