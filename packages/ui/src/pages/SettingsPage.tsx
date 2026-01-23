import React from "react";
import { BrowserSync, SyncSettings } from "@repo/ui/organisms";

interface SettingsPageProps {
  onLogout?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onLogout }) => {
  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Browser Sync - Open in Browser feature */}
      <BrowserSync />

      {/* Cloud Sync Settings */}
      <SyncSettings onLogout={onLogout} />
    </div>
  );
};
