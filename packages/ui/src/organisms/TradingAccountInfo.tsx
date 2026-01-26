import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowRightLeft,
  Banknote,
  ChevronDown,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  TrendingUp,
  User,
  Wallet,
} from "lucide-react";
import type {
  ITradingAuthService,
  TradingAccountBalance,
  TradingAccountInfo as TradingAccountInfoType,
  TradingPlatformId,
  TradingSubAccount,
} from "@fin-catch/shared";
import { Button } from "@fin-catch/ui/atoms";

/**
 * Props for TradingAccountInfo component
 */
interface TradingAccountInfoProps {
  /** Trading auth service instance */
  tradingService: ITradingAuthService;
  /** Platform to show account info for */
  platform: TradingPlatformId;
  /** Base path for navigation (e.g. /fin-catch) */
  basePath?: string;
}

/**
 * Format currency value
 */
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("vi-VN", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * TradingAccountInfo component
 *
 * Displays account information for a connected trading platform:
 * - Account info (name, email, phone)
 * - Sub-account selector
 * - Balance information for selected sub-account
 */
export const TradingAccountInfo: React.FC<TradingAccountInfoProps> = ({
  tradingService,
  platform,
  basePath,
}) => {
  const navigate = useNavigate();

  // Account info state
  const [accountInfo, setAccountInfo] = useState<TradingAccountInfoType | null>(
    null,
  );
  const [subAccounts, setSubAccounts] = useState<TradingSubAccount[]>([]);
  const [selectedAccount, setSelectedAccount] =
    useState<TradingSubAccount | null>(null);
  const [balance, setBalance] = useState<TradingAccountBalance | null>(null);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);

  // Load account info and sub-accounts on mount
  useEffect(() => {
    loadAccountData();
  }, [platform]);

  // Load balance when selected account changes
  useEffect(() => {
    if (selectedAccount) {
      loadBalance(selectedAccount.id);
    }
  }, [selectedAccount]);

  const loadAccountData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Load account info and sub-accounts in parallel
      const [info, accounts] = await Promise.all([
        tradingService.getAccountInfo(platform),
        tradingService.getAccounts(platform),
      ]);

      setAccountInfo(info);
      setSubAccounts(accounts);

      // Auto-select first non-derivative account if available
      const defaultAccount =
        accounts.find((a) => !a.derivativeAccount) || accounts[0];
      if (defaultAccount) {
        setSelectedAccount(defaultAccount);
      }
    } catch (err) {
      console.error("Failed to load account data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load account data",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const loadBalance = useCallback(
    async (accountId: string) => {
      setIsLoadingBalance(true);

      try {
        const balanceData = await tradingService.getAccountBalance(
          platform,
          accountId,
        );
        setBalance(balanceData);
      } catch (err) {
        console.error("Failed to load balance:", err);
        setBalance(null);
      } finally {
        setIsLoadingBalance(false);
      }
    },
    [platform, tradingService],
  );

  const handleRefresh = () => {
    loadAccountData();
  };

  const handleSelectAccount = (account: TradingSubAccount) => {
    setSelectedAccount(account);
    setShowAccountDropdown(false);
  };

  if (isLoading) {
    return (
      <div
        className="rounded-2xl p-6 border"
        style={{
          background: "rgba(26, 31, 58, 0.6)",
          backdropFilter: "blur(16px)",
          borderColor: "rgba(123, 97, 255, 0.2)",
        }}
      >
        <div className="flex items-center justify-center py-8">
          <Loader2
            className="w-6 h-6 animate-spin"
            style={{ color: "#00d4ff" }}
          />
          <span
            className="ml-2"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Loading account info...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="rounded-2xl p-6 border"
        style={{
          background: "rgba(26, 31, 58, 0.6)",
          backdropFilter: "blur(16px)",
          borderColor: "rgba(255, 51, 102, 0.3)",
        }}
      >
        <div
          className="flex items-center gap-3 text-sm"
          style={{ color: "#ff3366" }}
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
        <Button variant="secondary" onClick={handleRefresh} className="mt-4">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl p-6 border space-y-6"
      style={{
        background: "rgba(26, 31, 58, 0.6)",
        backdropFilter: "blur(16px)",
        borderColor: "rgba(123, 97, 255, 0.2)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
      }}
    >
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-lg"
            style={{ background: "rgba(0, 255, 136, 0.1)" }}
          >
            <Wallet className="w-5 h-5" style={{ color: "#00ff88" }} />
          </div>
          <div>
            <h2
              className="text-lg font-semibold"
              style={{ color: "var(--color-text-primary)" }}
            >
              Account Info
            </h2>
            <p
              className="text-sm"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {platform.toUpperCase()} trading account
            </p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          className="p-2 rounded-lg transition-colors hover:bg-white/10"
          title="Refresh"
        >
          <RefreshCw
            className="w-4 h-4"
            style={{ color: "var(--color-text-secondary)" }}
          />
        </button>
      </div>

      {/* Account Info Card */}
      {accountInfo && (
        <div
          className="p-4 rounded-xl border"
          style={{
            background: "rgba(15, 23, 42, 0.5)",
            borderColor: "rgba(123, 97, 255, 0.2)",
          }}
        >
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <User className="w-4 h-4" style={{ color: "#00d4ff" }} />
              <div>
                <div
                  className="text-sm"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Name
                </div>
                <div
                  className="font-medium"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {accountInfo.name}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Banknote className="w-4 h-4" style={{ color: "#00d4ff" }} />
              <div>
                <div
                  className="text-sm"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Custody Code
                </div>
                <div
                  className="font-medium font-mono"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {accountInfo.custodyCode}
                </div>
              </div>
            </div>

            {accountInfo.email && (
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4" style={{ color: "#00d4ff" }} />
                <div>
                  <div
                    className="text-sm"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Email
                  </div>
                  <div
                    className="font-medium"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {accountInfo.email}
                  </div>
                </div>
              </div>
            )}

            {accountInfo.mobile && (
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4" style={{ color: "#00d4ff" }} />
                <div>
                  <div
                    className="text-sm"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Phone
                  </div>
                  <div
                    className="font-medium"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {accountInfo.mobile}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sub-Account Selector */}
      {subAccounts.length > 0 && (
        <div className="relative">
          <label
            className="block text-sm mb-2"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Sub-Account
          </label>
          <button
            onClick={() => setShowAccountDropdown(!showAccountDropdown)}
            className="w-full p-3 rounded-xl border text-left flex items-center justify-between transition-colors"
            style={{
              background: "rgba(15, 23, 42, 0.5)",
              borderColor: showAccountDropdown
                ? "rgba(0, 212, 255, 0.5)"
                : "rgba(123, 97, 255, 0.2)",
            }}
          >
            <div>
              <div
                className="font-medium"
                style={{ color: "var(--color-text-primary)" }}
              >
                {selectedAccount?.custodyCode || "Select account"}
              </div>
              {selectedAccount && (
                <div
                  className="text-sm"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {selectedAccount.accountTypeName}
                  {selectedAccount.derivativeAccount && " (Derivatives)"}
                </div>
              )}
            </div>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${showAccountDropdown ? "rotate-180" : ""}`}
              style={{ color: "var(--color-text-secondary)" }}
            />
          </button>

          {showAccountDropdown && (
            <div
              className="absolute z-10 w-full mt-2 rounded-xl border overflow-hidden"
              style={{
                background: "rgba(26, 31, 58, 0.95)",
                backdropFilter: "blur(16px)",
                borderColor: "rgba(123, 97, 255, 0.3)",
              }}
            >
              {subAccounts.map((account) => (
                <button
                  key={account.id}
                  onClick={() => handleSelectAccount(account)}
                  className="w-full p-3 text-left transition-colors hover:bg-white/5"
                  style={{
                    background:
                      selectedAccount?.id === account.id
                        ? "rgba(0, 212, 255, 0.1)"
                        : undefined,
                  }}
                >
                  <div
                    className="font-medium"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {account.custodyCode}
                  </div>
                  <div
                    className="text-sm"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {account.accountTypeName}
                    {account.derivativeAccount && " (Derivatives)"}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Balance Card */}
      {selectedAccount && (
        <div
          className="p-4 rounded-xl border"
          style={{
            background: "rgba(15, 23, 42, 0.5)",
            borderColor: "rgba(123, 97, 255, 0.2)",
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4" style={{ color: "#00ff88" }} />
            <span
              className="font-medium"
              style={{ color: "var(--color-text-primary)" }}
            >
              Balance
            </span>
          </div>

          {isLoadingBalance ? (
            <div className="flex items-center justify-center py-4">
              <Loader2
                className="w-4 h-4 animate-spin"
                style={{ color: "#00d4ff" }}
              />
              <span
                className="ml-2 text-sm"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Loading balance...
              </span>
            </div>
          ) : balance ? (
            <div className="space-y-4">
              {/* Main Values */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div
                    className="text-sm"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Net Asset Value
                  </div>
                  <div
                    className="text-xl font-semibold"
                    style={{ color: "#00ff88" }}
                  >
                    {formatCurrency(balance.netAssetValue)}
                  </div>
                </div>
                <div>
                  <div
                    className="text-sm"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Stock Value
                  </div>
                  <div
                    className="text-xl font-semibold"
                    style={{ color: "#00d4ff" }}
                  >
                    {formatCurrency(balance.stockValue)}
                  </div>
                </div>
              </div>

              {/* Cash Details */}
              <div
                className="pt-4 border-t"
                style={{ borderColor: "rgba(123, 97, 255, 0.2)" }}
              >
                <div
                  className="text-sm font-medium mb-3"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Cash
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex justify-between">
                    <span
                      className="text-sm"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      Total
                    </span>
                    <span
                      className="text-sm font-medium"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {formatCurrency(balance.totalCash)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span
                      className="text-sm"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      Available
                    </span>
                    <span
                      className="text-sm font-medium"
                      style={{ color: "#00ff88" }}
                    >
                      {formatCurrency(balance.availableCash)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span
                      className="text-sm"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      Withdrawable
                    </span>
                    <span
                      className="text-sm font-medium"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {formatCurrency(balance.withdrawableCash)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span
                      className="text-sm"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      Receiving
                    </span>
                    <span
                      className="text-sm font-medium"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {formatCurrency(balance.receivingAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Debt Details */}
              {(balance.totalDebt > 0 || balance.marginDebt > 0) && (
                <div
                  className="pt-4 border-t"
                  style={{ borderColor: "rgba(123, 97, 255, 0.2)" }}
                >
                  <div
                    className="text-sm font-medium mb-3"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Debt
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex justify-between">
                      <span
                        className="text-sm"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        Total Debt
                      </span>
                      <span
                        className="text-sm font-medium"
                        style={{ color: "#ff3366" }}
                      >
                        {formatCurrency(balance.totalDebt)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span
                        className="text-sm"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        Margin Debt
                      </span>
                      <span
                        className="text-sm font-medium"
                        style={{ color: "#ff3366" }}
                      >
                        {formatCurrency(balance.marginDebt)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Other */}
              {(balance.cashDividendReceiving > 0 ||
                balance.depositInterest > 0) && (
                <div
                  className="pt-4 border-t"
                  style={{ borderColor: "rgba(123, 97, 255, 0.2)" }}
                >
                  <div
                    className="text-sm font-medium mb-3"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Pending
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {balance.cashDividendReceiving > 0 && (
                      <div className="flex justify-between">
                        <span
                          className="text-sm"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          Dividends
                        </span>
                        <span
                          className="text-sm font-medium"
                          style={{ color: "#ffa500" }}
                        >
                          {formatCurrency(balance.cashDividendReceiving)}
                        </span>
                      </div>
                    )}
                    {balance.depositInterest > 0 && (
                      <div className="flex justify-between">
                        <span
                          className="text-sm"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          Interest
                        </span>
                        <span
                          className="text-sm font-medium"
                          style={{ color: "#ffa500" }}
                        >
                          {formatCurrency(balance.depositInterest)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div
              className="text-center py-4"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Unable to load balance
            </div>
          )}
        </div>
      )}

      {/* Start Trading Button */}
      {selectedAccount && (
        <div className="pt-4">
          <Button
            variant="primary"
            onClick={() => {
              const path = basePath
                ? `${basePath}/trading/operations`
                : "/trading/operations";
              navigate(
                `${path}?platform=${platform}&account=${selectedAccount.id}`,
              );
            }}
            className="w-full"
          >
            <ArrowRightLeft className="w-4 h-4 mr-2" />
            Start Trading
          </Button>
        </div>
      )}
    </div>
  );
};
