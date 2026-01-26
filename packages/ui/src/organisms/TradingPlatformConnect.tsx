import React, { useEffect, useState, useCallback } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  KeyRound,
  Link2,
  Link2Off,
  Loader2,
  Lock,
  Mail,
  RefreshCw,
  User,
} from "lucide-react";
import type {
  ITradingAuthService,
  TradingPlatform,
  TradingPlatformId,
  TradingSession,
  TradingStatus,
} from "@fin-catch/shared";
import { AUTH_STORAGE_KEYS } from "@fin-catch/shared/constants";
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@fin-catch/ui/atoms";
import { TradingAccountInfo } from "./TradingAccountInfo";

/**
 * Props for TradingPlatformConnect component
 */
interface TradingPlatformConnectProps {
  /** Trading auth service instance */
  tradingService: ITradingAuthService;
  /** Callback when connection status changes */
  /** Callback when connection status changes */
  onStatusChange?: (platform: TradingPlatformId, status: TradingStatus) => void;
  /** Base path for navigation */
  basePath?: string;
}

/**
 * Connection step in the auth flow
 */
type ConnectionStep = "select" | "login" | "otp" | "connected";

/**
 * TradingPlatformConnect component
 *
 * Multi-step UI for connecting to trading platforms:
 * 1. Select platform
 * 2. Login with credentials
 * 3. Verify OTP
 * 4. View connected status
 */
export const TradingPlatformConnect: React.FC<TradingPlatformConnectProps> = ({
  tradingService,
  onStatusChange,
  basePath,
}) => {
  // Platform selection state
  const [platforms, setPlatforms] = useState<TradingPlatform[]>([]);
  const [selectedPlatform, setSelectedPlatform] =
    useState<TradingPlatform | null>(null);

  // Connection flow state
  const [step, setStep] = useState<ConnectionStep>("select");
  const [session, setSession] = useState<TradingSession | null>(null);

  // Form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpType, setOtpType] = useState<"email" | "smart">("email");

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [_otpSent, setOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);

  // Initialize OTP type from storage
  useEffect(() => {
    const storedType = localStorage.getItem(AUTH_STORAGE_KEYS.OTP_TYPE) as
      | "email"
      | "smart"
      | null;
    if (storedType) {
      setOtpType(storedType);
    }
  }, []);

  const handleOtpTypeChange = (type: "email" | "smart") => {
    setOtpType(type);
    localStorage.setItem(AUTH_STORAGE_KEYS.OTP_TYPE, type);
  };

  // Load platforms on mount
  useEffect(() => {
    loadPlatforms();
  }, []);

  // Check all platform statuses on mount to restore existing sessions
  useEffect(() => {
    const checkAllStatuses = async () => {
      if (platforms.length === 0) return;

      for (const platform of platforms) {
        try {
          const status = await tradingService.getStatus(platform.id);
          if (
            status &&
            (status.status === "connected" || status.status === "pending_otp")
          ) {
            setSelectedPlatform(platform);
            setSession(status);
            setStep(status.status === "connected" ? "connected" : "otp");
            break; // Found an active session
          }
        } catch (err) {
          console.error(`Failed to check status for ${platform.id}:`, err);
        }
      }
    };
    checkAllStatuses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platforms]);

  // OTP countdown timer
  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

  const loadPlatforms = async () => {
    try {
      const result = await tradingService.getSupportedPlatforms();
      setPlatforms(result);
    } catch (err) {
      console.error("Failed to load platforms:", err);
    }
  };

  const checkPlatformStatus = useCallback(
    async (platform: TradingPlatform) => {
      try {
        const status = await tradingService.getStatus(platform.id);
        if (status) {
          setSession(status);
          if (status.status === "connected") {
            setStep("connected");
          } else if (status.status === "pending_otp") {
            setStep("otp");
          }
        }
      } catch (err) {
        console.error("Failed to check status:", err);
      }
    },
    [tradingService],
  );

  const handleSelectPlatform = async (platform: TradingPlatform) => {
    setSelectedPlatform(platform);
    setError(null);

    // Check existing connection status
    await checkPlatformStatus(platform);

    // If not connected, go to login step
    if (!session || session.status === "disconnected") {
      setStep("login");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlatform) return;

    setError(null);
    setIsLoading(true);

    try {
      const result = await tradingService.login(
        selectedPlatform.id,
        username,
        password,
      );
      setSession(result);
      onStatusChange?.(selectedPlatform.id, result.status);

      // If platform requires OTP, check preference
      if (selectedPlatform.requires_otp) {
        // Read preference directly to ensure we have latest value
        const otpType =
          localStorage.getItem(AUTH_STORAGE_KEYS.OTP_TYPE) || "email";
        console.log(
          "[TradingPlatformConnect] Login success. OTP Type preference:",
          otpType,
        );

        if (otpType === "email") {
          await tradingService.requestOtp(selectedPlatform.id);
          setOtpSent(true);
          setOtpCountdown(120); // 2 minute countdown
        } else {
          // Smart OTP: Don't request from server, just show input
          setOtpSent(false); // No countdown needed for Smart OTP usually, or maybe let user handle it
          setOtpCountdown(0);
        }
        setStep("otp");
      } else {
        // No OTP required, we're connected
        setStep("connected");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!selectedPlatform || otpCountdown > 0) return;

    setError(null);
    setIsLoading(true);

    try {
      await tradingService.requestOtp(selectedPlatform.id);
      setOtpSent(true);
      setOtpCountdown(120);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlatform) return;

    setError(null);
    setIsLoading(true);

    try {
      // Get preferred OTP type from storage (default to email)
      const otpType =
        (localStorage.getItem(AUTH_STORAGE_KEYS.OTP_TYPE) as
          | "email"
          | "smart") || "email";

      const result = await tradingService.verifyOtp(
        selectedPlatform.id,
        otp,
        otpType,
      );
      setSession(result);
      onStatusChange?.(selectedPlatform.id, result.status);
      setStep("connected");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!selectedPlatform) return;

    setError(null);
    setIsLoading(true);

    try {
      await tradingService.logout(selectedPlatform.id);
      setSession(null);
      onStatusChange?.(selectedPlatform.id, "disconnected");

      // Reset form
      setUsername("");
      setPassword("");
      setOtp("");
      setOtpSent(false);
      setStep("select");
      setSelectedPlatform(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Logout failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setError(null);
    if (step === "otp") {
      setStep("login");
      setOtp("");
      setOtpSent(false);
    } else if (step === "login") {
      setStep("select");
      setSelectedPlatform(null);
      setUsername("");
      setPassword("");
    }
  };

  const getStatusColor = (status: TradingStatus) => {
    switch (status) {
      case "connected":
        return "#00ff88";
      case "pending_otp":
        return "#ffa500";
      case "expired":
        return "#ff3366";
      default:
        return "#6b7280";
    }
  };

  const getStatusIcon = (status: TradingStatus) => {
    switch (status) {
      case "connected":
        return <CheckCircle2 className="w-5 h-5" />;
      case "pending_otp":
        return <Clock className="w-5 h-5" />;
      case "expired":
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Link2Off className="w-5 h-5" />;
    }
  };

  const formatTimeRemaining = (expiresAt?: number) => {
    if (!expiresAt) return null;
    const now = Math.floor(Date.now() / 1000);
    const remaining = expiresAt - now;
    if (remaining <= 0) return "Expired";

    const hours = Math.floor(remaining / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    return `${hours}h ${minutes}m remaining`;
  };

  return (
    <div
      className="rounded-2xl p-6 border"
      style={{
        background: "rgba(26, 31, 58, 0.6)",
        backdropFilter: "blur(16px)",
        borderColor: "rgba(123, 97, 255, 0.2)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div
          className="p-2 rounded-lg"
          style={{ background: "rgba(0, 212, 255, 0.1)" }}
        >
          <Link2 className="w-5 h-5" style={{ color: "#00d4ff" }} />
        </div>
        <div>
          <h2
            className="text-lg font-semibold"
            style={{ color: "var(--color-text-primary)" }}
          >
            Trading Platforms
          </h2>
          <p
            className="text-sm"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Connect to your trading accounts
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div
          className="mb-4 p-3 rounded-lg text-sm border flex items-center gap-2"
          style={{
            background: "rgba(255, 51, 102, 0.1)",
            borderColor: "rgba(255, 51, 102, 0.3)",
            color: "#ff3366",
          }}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Platform Selection */}
      {step === "select" && (
        <div className="space-y-3">
          {platforms.length === 0 ? (
            <div
              className="text-center py-8"
              style={{ color: "var(--color-text-secondary)" }}
            >
              <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin" />
              Loading platforms...
            </div>
          ) : (
            platforms.map((platform) => (
              <button
                key={platform.id}
                onClick={() => handleSelectPlatform(platform)}
                className="w-full p-4 rounded-xl border text-left transition-all hover:scale-[1.02]"
                style={{
                  background: "rgba(15, 23, 42, 0.5)",
                  borderColor: "rgba(123, 97, 255, 0.2)",
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div
                      className="font-semibold"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {platform.name}
                    </div>
                    <div
                      className="text-sm"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {platform.description}
                    </div>
                  </div>
                  <div
                    className="p-2 rounded-lg"
                    style={{ background: "rgba(123, 97, 255, 0.1)" }}
                  >
                    <Link2
                      className="w-5 h-5"
                      style={{ color: "var(--color-text-secondary)" }}
                    />
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* Login Form */}
      {step === "login" && selectedPlatform && (
        <form onSubmit={handleLogin} className="space-y-4">
          <div
            className="text-center mb-4 p-3 rounded-lg"
            style={{ background: "rgba(123, 97, 255, 0.1)" }}
          >
            <div
              className="font-semibold"
              style={{ color: "var(--color-text-primary)" }}
            >
              {selectedPlatform.name}
            </div>
            <div
              className="text-sm"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Enter your {selectedPlatform.name} credentials
            </div>
          </div>

          <div>
            <Label
              htmlFor="trading-username"
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
              id="trading-username"
              type="text"
              placeholder="Your trading username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <Label
              htmlFor="trading-password"
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
              id="trading-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <Label
              htmlFor="otp-type-select"
              style={{
                color: "var(--color-text-primary)",
                marginBottom: "8px",
              }}
            >
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4" style={{ color: "#00d4ff" }} />
                OTP Preference
              </div>
            </Label>
            <Select
              value={otpType}
              onValueChange={(value) =>
                handleOtpTypeChange(value as "email" | "smart")
              }
            >
              <SelectTrigger id="otp-type-select">
                <SelectValue placeholder="Select OTP Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email OTP</SelectItem>
                <SelectItem value="smart">Smart OTP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleBack}
              disabled={isLoading}
            >
              Back
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              isLoading={isLoading}
              disabled={isLoading || !username || !password}
            >
              {isLoading ? "Connecting..." : "Connect"}
            </Button>
          </div>
        </form>
      )}

      {/* OTP Verification */}
      {step === "otp" && selectedPlatform && (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div
            className="text-center mb-4 p-4 rounded-lg"
            style={{ background: "rgba(0, 212, 255, 0.1)" }}
          >
            {/* Show different icon/text based on OTP type */}
            {localStorage.getItem(AUTH_STORAGE_KEYS.OTP_TYPE) === "smart" ? (
              <>
                <KeyRound
                  className="w-8 h-8 mx-auto mb-2"
                  style={{ color: "#00d4ff" }}
                />
                <div
                  className="font-semibold"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Enter Smart OTP
                </div>
                <div
                  className="text-sm"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Please enter the code from your Entrade X app
                </div>
              </>
            ) : (
              <>
                <Mail
                  className="w-8 h-8 mx-auto mb-2"
                  style={{ color: "#00d4ff" }}
                />
                <div
                  className="font-semibold"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Check your email
                </div>
                <div
                  className="text-sm"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  We sent an OTP to your registered email
                </div>
              </>
            )}
          </div>

          <div>
            <Label
              htmlFor="trading-otp"
              required
              style={{
                color: "var(--color-text-primary)",
                marginBottom: "8px",
              }}
            >
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4" style={{ color: "#00d4ff" }} />
                OTP Code
              </div>
            </Label>
            <Input
              id="trading-otp"
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              disabled={isLoading}
              maxLength={6}
              className="text-center text-2xl tracking-widest"
            />
          </div>

          <div className="flex items-center justify-center gap-2">
            {/* Resend button only for email OTP */}
            {localStorage.getItem(AUTH_STORAGE_KEYS.OTP_TYPE) !== "smart" && (
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isLoading || otpCountdown > 0}
                className="text-sm font-medium flex items-center gap-1 transition-colors"
                style={{
                  color:
                    otpCountdown > 0
                      ? "var(--color-text-muted)"
                      : "var(--color-accent)",
                }}
              >
                <RefreshCw
                  className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                />
                {otpCountdown > 0 ? `Resend in ${otpCountdown}s` : "Resend OTP"}
              </button>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleBack}
              disabled={isLoading}
            >
              Back
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              isLoading={isLoading}
              disabled={isLoading || !otp}
            >
              {isLoading ? "Verifying..." : "Verify OTP"}
            </Button>
          </div>
        </form>
      )}

      {/* Connected Status */}
      {step === "connected" && selectedPlatform && session && (
        <div className="space-y-4">
          <div
            className="p-4 rounded-xl border"
            style={{
              background: "rgba(0, 255, 136, 0.05)",
              borderColor: "rgba(0, 255, 136, 0.2)",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-lg"
                style={{ background: `${getStatusColor(session.status)}20` }}
              >
                <span style={{ color: getStatusColor(session.status) }}>
                  {getStatusIcon(session.status)}
                </span>
              </div>
              <div className="flex-1">
                <div
                  className="font-semibold"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {selectedPlatform.name}
                </div>
                <div
                  className="text-sm flex items-center gap-2"
                  style={{ color: getStatusColor(session.status) }}
                >
                  <span className="capitalize">
                    {session.status.replace("_", " ")}
                  </span>
                  {session.expiresAt && (
                    <span style={{ color: "var(--color-text-secondary)" }}>
                      • {formatTimeRemaining(session.expiresAt)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {session.status === "expired" && (
            <div
              className="p-3 rounded-lg text-sm"
              style={{
                background: "rgba(255, 163, 0, 0.1)",
                color: "#ffa500",
              }}
            >
              Your session has expired. Please reconnect to continue trading.
            </div>
          )}

          {/* Account Info - only show when fully connected */}
          {session.status === "connected" && (
            <TradingAccountInfo
              tradingService={tradingService}
              platform={selectedPlatform.id}
              basePath={basePath}
            />
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setStep("select");
                setSelectedPlatform(null);
              }}
              className="flex-1"
            >
              Back to Platforms
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDisconnect}
              isLoading={isLoading}
            >
              <Link2Off className="w-4 h-4 mr-2" />
              Disconnect
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
