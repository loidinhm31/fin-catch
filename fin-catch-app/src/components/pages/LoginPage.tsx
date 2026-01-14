import React, { useState } from "react";
import { KeyRound, Lock, Mail, ShieldCheck, User } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import { finCatchAPI } from "@/services/api";

interface LoginPageProps {
  onLoginSuccess: () => void;
  onSkip?: () => void;
}

type FormMode = "login" | "register";

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onSkip,
}) => {
  const [mode, setMode] = useState<FormMode>("login");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Registration form state
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Then login
      await finCatchAPI.authLogin(loginEmail, loginPassword);
      onLoginSuccess();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Login failed. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (registerPassword !== registerConfirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (registerPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (!registerUsername || !registerEmail) {
      setError("All fields are required");
      return;
    }

    setIsLoading(true);

    try {
      // Then register
      await finCatchAPI.authRegister(
        registerUsername,
        registerEmail,
        registerPassword,
      );
      onLoginSuccess();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Registration failed. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{
        background:
          "linear-gradient(135deg, #0F172A 0%, #0A0E27 50%, #1E1B4B 100%)",
      }}
    >
      <div className="w-full max-w-md">
        {/* Logo/Header Section */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{
              background: "linear-gradient(135deg, #7b61ff 0%, #00d4ff 100%)",
              boxShadow: "0 0 30px rgba(123, 97, 255, 0.5)",
            }}
          >
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1
            className="text-3xl font-extrabold mb-2"
            style={{
              background: "linear-gradient(135deg, #00d4ff 0%, #7b61ff 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Fin Catch
          </h1>
          <p className="text-[var(--color-text-secondary)] text-sm">
            Sync your portfolio across devices
          </p>
        </div>

        {/* Form Card */}
        <div
          className="rounded-2xl p-6 border"
          style={{
            background: "rgba(26, 31, 58, 0.6)",
            backdropFilter: "blur(16px)",
            borderColor: "rgba(123, 97, 255, 0.2)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
          }}
        >
          {/* Mode Toggle */}
          <div
            className="flex gap-2 mb-6 p-1 rounded-lg"
            style={{ background: "rgba(15, 23, 42, 0.5)" }}
          >
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError(null);
              }}
              className="flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-all"
              style={{
                background:
                  mode === "login"
                    ? "linear-gradient(135deg, #7b61ff 0%, #5a3fff 100%)"
                    : "transparent",
                color: mode === "login" ? "#ffffff" : "#a0aec0",
                boxShadow:
                  mode === "login"
                    ? "0 4px 12px rgba(123, 97, 255, 0.4)"
                    : "none",
              }}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError(null);
              }}
              className="flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-all"
              style={{
                background:
                  mode === "register"
                    ? "linear-gradient(135deg, #7b61ff 0%, #5a3fff 100%)"
                    : "transparent",
                color: mode === "register" ? "#ffffff" : "#a0aec0",
                boxShadow:
                  mode === "register"
                    ? "0 4px 12px rgba(123, 97, 255, 0.4)"
                    : "none",
              }}
            >
              Register
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div
              className="mb-4 p-3 rounded-lg text-sm border"
              style={{
                background: "rgba(255, 51, 102, 0.1)",
                borderColor: "rgba(255, 51, 102, 0.3)",
                color: "#ff3366",
              }}
            >
              {error}
            </div>
          )}

          {/* Login Form */}
          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label
                  htmlFor="login-email"
                  required
                  style={{
                    color: "var(--color-text-primary)",
                    marginBottom: "8px",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" style={{ color: "#00d4ff" }} />
                    Email
                  </div>
                </Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="your@email.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label
                  htmlFor="login-password"
                  required
                  style={{
                    color: "var(--color-text-primary)",
                    marginBottom: "8px",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4" style={{ color: "#00d4ff" }} />
                    Password
                  </div>
                </Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full mt-6"
                isLoading={isLoading}
                disabled={isLoading || !loginEmail || !loginPassword}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          )}

          {/* Registration Form */}
          {mode === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <Label
                  htmlFor="register-username"
                  required
                  style={{
                    color: "var(--color-text-primary)",
                    marginBottom: "8px",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" style={{ color: "#00d4ff" }} />
                    Username
                  </div>
                </Label>
                <Input
                  id="register-username"
                  type="text"
                  placeholder="johndoe"
                  value={registerUsername}
                  onChange={(e) => setRegisterUsername(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label
                  htmlFor="register-email"
                  required
                  style={{
                    color: "var(--color-text-primary)",
                    marginBottom: "8px",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" style={{ color: "#00d4ff" }} />
                    Email
                  </div>
                </Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="your@email.com"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label
                  htmlFor="register-password"
                  required
                  style={{
                    color: "var(--color-text-primary)",
                    marginBottom: "8px",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4" style={{ color: "#00d4ff" }} />
                    Password
                  </div>
                </Label>
                <Input
                  id="register-password"
                  type="password"
                  placeholder="••••••••"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  minLength={8}
                />
                <p
                  className="text-xs mt-1"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  At least 8 characters
                </p>
              </div>

              <div>
                <Label
                  htmlFor="register-confirm-password"
                  required
                  style={{
                    color: "var(--color-text-primary)",
                    marginBottom: "8px",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <KeyRound
                      className="w-4 h-4"
                      style={{ color: "#00d4ff" }}
                    />
                    Confirm Password
                  </div>
                </Label>
                <Input
                  id="register-confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={registerConfirmPassword}
                  onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full mt-6"
                isLoading={isLoading}
                disabled={
                  isLoading ||
                  !registerUsername ||
                  !registerEmail ||
                  !registerPassword ||
                  !registerConfirmPassword
                }
              >
                {isLoading ? "Creating account..." : "Create Account"}
              </Button>
            </form>
          )}

          {/* Skip Option */}
          {onSkip && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={onSkip}
                className="text-sm font-medium hover:underline transition-colors"
                style={{ color: "var(--color-text-secondary)" }}
                disabled={isLoading}
              >
                Skip for now (Local only)
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p
          className="text-center text-xs mt-6"
          style={{ color: "var(--color-text-muted)" }}
        >
          Your data is encrypted and secure
        </p>
      </div>
    </div>
  );
};
