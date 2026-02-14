import React from "react";
import { SyncSettings } from "@fin-catch/ui/components/organisms";
import { useAuth, useNav } from "@fin-catch/ui/hooks";
import { Button, Card } from "@fin-catch/ui/components/atoms";
import { LogIn } from "lucide-react";

interface SettingsPageProps {
  onLogout?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  onLogout,
}) => {
  const { nav } = useNav();
  const { isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    onLogout?.();
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Login Settings */}
      <Card className="mb-6">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <LogIn className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">
                {isAuthenticated ? "Account" : "Login to connect to server"}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isAuthenticated
                  ? "Manage your account connection"
                  : "Connect your account to sync data across devices"}
              </p>
            </div>
          </div>
          {isAuthenticated ? (
            <Button
              variant="ghost"
              className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              onClick={handleLogout}
            >
              Logout
            </Button>
          ) : (
            <Button
              variant="primary"
              className="w-full"
              onClick={() => nav("/login")}
            >
              Login / Register
            </Button>
          )}
        </div>
      </Card>
      <SyncSettings />
    </div>
  );
};
