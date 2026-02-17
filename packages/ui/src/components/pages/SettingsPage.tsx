import React from "react";
import { SyncSettings } from "@fin-catch/ui/components/organisms";
import { useAuth, useNav } from "@fin-catch/ui/hooks";
import { useTheme, type Theme } from "@fin-catch/ui/contexts";
import { Button, Card } from "@fin-catch/ui/components/atoms";
import { LogIn, Sun, Moon, Laptop, Terminal, Palette } from "lucide-react";

interface SettingsPageProps {
  onLogout?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onLogout }) => {
  const { nav } = useNav();
  const { isAuthenticated, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const themeOptions: { value: Theme; label: string; icon: React.ReactNode }[] =
    [
      { value: "light", label: "Light", icon: <Sun className="h-4 w-4" /> },
      { value: "dark", label: "Dark", icon: <Moon className="h-4 w-4" /> },
      {
        value: "system",
        label: "System",
        icon: <Laptop className="h-4 w-4" />,
      },
      {
        value: "cyber",
        label: "Cyber",
        icon: <Terminal className="h-4 w-4" />,
      },
    ];

  const handleLogout = async () => {
    await logout();
    onLogout?.();
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Theme Settings */}
      <Card className="mb-6">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div
              className="p-3 rounded-full"
              style={{
                backgroundColor: "var(--color-nav-portfolio-bg)",
              }}
            >
              <Palette
                className="w-6 h-6"
                style={{ color: "var(--color-nav-portfolio-active)" }}
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                Theme
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Choose your preferred appearance
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {themeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setTheme(option.value)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all"
                style={
                  theme === option.value
                    ? {
                        borderColor: "var(--color-violet-500)",
                        backgroundColor: "var(--color-nav-portfolio-bg)",
                        color: "var(--color-violet-500)",
                      }
                    : {
                        borderColor: "var(--color-border-primary)",
                        backgroundColor: "transparent",
                        color: "var(--color-text-secondary)",
                      }
                }
                onMouseEnter={(e) => {
                  if (theme !== option.value) {
                    e.currentTarget.style.borderColor =
                      "var(--color-violet-500)";
                    e.currentTarget.style.backgroundColor =
                      "var(--glass-bg-dark)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (theme !== option.value) {
                    e.currentTarget.style.borderColor =
                      "var(--color-border-primary)";
                    e.currentTarget.style.backgroundColor = "transparent";
                  }
                }}
              >
                {option.icon}
                <span
                  className="text-sm font-medium"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Login Settings */}
      <Card className="mb-6">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div
              className="p-3 rounded-full"
              style={{
                backgroundColor: "var(--color-action-edit-bg)",
              }}
            >
              <LogIn
                className="w-6 h-6"
                style={{ color: "var(--color-action-edit-icon)" }}
              />
            </div>
            <div>
              <h3
                className="text-lg font-semibold"
                style={{ color: "var(--color-text-primary)" }}
              >
                {isAuthenticated ? "Account" : "Login to connect to server"}
              </h3>
              <p
                className="text-sm"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {isAuthenticated
                  ? "Manage your account connection"
                  : "Connect your account to sync data across devices"}
              </p>
            </div>
          </div>
          {isAuthenticated ? (
            <button
              className="w-full p-3 rounded-xl transition-all"
              style={{
                color: "var(--color-red-400)",
                backgroundColor: "transparent",
                border: "1px solid var(--color-red-400)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "var(--color-action-delete-bg)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
              onClick={handleLogout}
            >
              Logout
            </button>
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
