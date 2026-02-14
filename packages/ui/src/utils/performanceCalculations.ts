import {
  CurrencyCode,
  EntryPerformance,
  getLastTradingTimestamp,
  PortfolioEntry,
  PortfolioPerformance,
} from "@fin-catch/shared";
import {
  fetchStockHistory,
  fetchGoldPrice,
  listCouponPayments,
} from "@fin-catch/ui/services";
import { convertCurrency } from "./currency";

/**
 * Calculate the current market value of a bond based on present value formula
 * PV = Σ[C / (1 + r)^t] + [FV / (1 + r)^n]
 */
const calculateBondPresentValue = (
  faceValue: number,
  couponRate: number,
  ytm: number,
  maturityDate: number,
  couponFrequency: "annual" | "semiannual" | "quarterly" | "monthly",
): number => {
  const now = Math.floor(Date.now() / 1000);
  const timeToMaturityYears = (maturityDate - now) / (365 * 24 * 60 * 60);
  // If bond has matured or is about to mature, return face value
  if (timeToMaturityYears <= 0) {
    return faceValue;
  }

  // Convert YTM from percentage to decimal
  const ytmDecimal = ytm / 100;

  // Determine periods per year
  let periodsPerYear: number;
  switch (couponFrequency) {
    case "annual":
      periodsPerYear = 1;
      break;
    case "semiannual":
      periodsPerYear = 2;
      break;
    case "quarterly":
      periodsPerYear = 4;
      break;
    case "monthly":
      periodsPerYear = 12;
      break;
  }

  // Calculate periodic coupon payment
  const periodicCouponRate = couponRate / 100 / periodsPerYear;
  const periodicCoupon = faceValue * periodicCouponRate;

  // Calculate periodic YTM
  const periodicYTM = ytmDecimal / periodsPerYear;

  // Calculate number of remaining periods
  const remainingPeriods = Math.ceil(timeToMaturityYears * periodsPerYear);

  // Calculate present value of coupon payments
  let pvCoupons = 0;
  for (let t = remainingPeriods; t > 0; t--) {
    if (t > 1) {
      pvCoupons += periodicCoupon / Math.pow(1 + periodicYTM, t);
    } else {
      pvCoupons +=
        periodicCoupon /
        (1 + periodicYTM * getTargetDateProgressRatio(maturityDate));
    }
  }

  // Calculate present value of face value
  let pvFaceValue: number;
  if (remainingPeriods > 1) {
    pvFaceValue = faceValue / Math.pow(1 + periodicYTM, remainingPeriods);
  } else {
    pvFaceValue =
      faceValue / (1 + periodicYTM * getTargetDateProgressRatio(maturityDate));
  }

  // Total present value
  return pvCoupons + pvFaceValue;
};

const getTargetDateProgressRatio = (
  targetTimestampInSeconds: number,
): number => {
  const targetTimestampInMs = targetTimestampInSeconds * 1000;

  const now = new Date();
  const targetDate = new Date(targetTimestampInMs);

  if (targetDate.getTime() < now.getTime()) {
    return 0;
  }

  const diffInMilliseconds = targetDate.getTime() - now.getTime();

  const daysRemaining = Math.ceil(diffInMilliseconds / (1000 * 60 * 60 * 24));

  const ratio = daysRemaining / 365;

  // Round to 3 decimal places and convert back to number
  return Number(ratio.toFixed(3));
};

export const calculatePortfolioPerformance = async (
  entries: PortfolioEntry[],
  displayCurrency: CurrencyCode,
): Promise<PortfolioPerformance | null> => {
  if (entries.length === 0) return null;

  try {
    const entriesPerformance: EntryPerformance[] = [];

    for (const entry of entries) {
      let currentPrice = 0;
      let currentPriceCurrency: CurrencyCode = entry.currency || "USD";
      let priceScale = 1;

      if (entry.assetType === "stock") {
        const tradingTs = getLastTradingTimestamp();
        const response = await fetchStockHistory({
          symbol: entry.symbol,
          resolution: "1D" as const,
          from: tradingTs - 86400 - 1,
          to: tradingTs,
          source: entry.source as any,
        });

        if (response.data && response.data.length > 0) {
          const rawPrice = response.data[response.data.length - 1].close;
          priceScale = (response.metadata?.price_scale as number) ?? 1;
          currentPrice = rawPrice * priceScale;
        }
      } else if (entry.assetType === "gold") {
        const goldSource = entry.source as "sjc";
        if (!goldSource || goldSource !== "sjc") {
          console.warn(
            `Invalid gold source for entry ${entry.id}: ${entry.source}`,
          );
          continue;
        }

        const response = await fetchGoldPrice({
          gold_price_id: entry.symbol,
          from: Math.floor(Date.now() / 1000) - 86400,
          to: Math.floor(Date.now() / 1000),
          source: goldSource,
        });

        if (response.data && response.data.length > 0) {
          const rawPrice = response.data[response.data.length - 1].sell;
          priceScale = (response.metadata?.price_scale as number) ?? 1;
          currentPrice = rawPrice * priceScale;
          currentPriceCurrency = "VND";
        }
      } else if (entry.assetType === "bond") {
        // For bonds, calculate present value if we have all required data
        if (
          entry.faceValue &&
          entry.couponRate !== undefined &&
          entry.ytm !== undefined &&
          entry.maturityDate &&
          entry.couponFrequency
        ) {
          // Calculate current market value using present value formula
          currentPrice = calculateBondPresentValue(
            entry.faceValue,
            entry.couponRate,
            entry.ytm,
            entry.maturityDate,
            entry.couponFrequency,
          );
        } else if (
          entry.currentMarketPrice !== undefined &&
          entry.currentMarketPrice > 0
        ) {
          // Fallback to manual currentMarketPrice if calculation data is not available
          currentPrice = entry.currentMarketPrice;
        } else if (entry.faceValue) {
          // Fallback to faceValue
          currentPrice = entry.faceValue;
        } else {
          // Final fallback to purchase price
          currentPrice = entry.purchasePrice;
        }
        currentPriceCurrency = entry.currency || "USD";
        priceScale = 1; // No scaling for bonds
      }

      const currentPriceInDisplayCurrency = await convertCurrency(
        currentPrice,
        currentPriceCurrency,
        displayCurrency,
      );

      let scaledPurchasePrice: number;
      if (entry.assetType === "stock") {
        // Purchase price was entered by user in actual price, no scaling needed
        scaledPurchasePrice = entry.purchasePrice;
      } else {
        const userUnit = entry.unit || "tael";
        if (userUnit === "mace") {
          scaledPurchasePrice = entry.purchasePrice * 10;
        } else if (userUnit === "tael") {
          scaledPurchasePrice = entry.purchasePrice;
        } else if (userUnit === "gram") {
          scaledPurchasePrice = entry.purchasePrice * 37.5;
        } else {
          scaledPurchasePrice = entry.purchasePrice;
        }
      }

      const purchasePriceInDisplayCurrency = await convertCurrency(
        scaledPurchasePrice,
        entry.currency || "USD",
        displayCurrency,
      );

      const feesInDisplayCurrency = entry.transactionFees
        ? await convertCurrency(
            entry.transactionFees,
            entry.currency || "USD",
            displayCurrency,
          )
        : 0;

      const exchangeRate =
        currentPriceCurrency !== displayCurrency
          ? currentPriceInDisplayCurrency / (currentPrice || 1)
          : 1.0;

      let quantityInTaels = entry.quantity;
      if (entry.assetType === "gold") {
        const userUnit = entry.unit || "tael";
        if (userUnit === "mace") {
          quantityInTaels = entry.quantity / 10;
        } else if (userUnit === "gram") {
          quantityInTaels = entry.quantity / 37.5;
        }
      }

      const currentValue = currentPriceInDisplayCurrency * quantityInTaels;
      const totalCost =
        purchasePriceInDisplayCurrency * quantityInTaels +
        feesInDisplayCurrency;

      // Fetch and sum coupon payments for bonds
      let couponIncomeInDisplayCurrency = 0;
      if (entry.assetType === "bond" && entry.id) {
        try {
          const couponPayments = await listCouponPayments(entry.id);
          for (const payment of couponPayments) {
            const convertedAmount = await convertCurrency(
              payment.amount,
              payment.currency,
              displayCurrency,
            );
            couponIncomeInDisplayCurrency += convertedAmount;
          }
        } catch (err) {
          console.warn(
            `Failed to fetch coupon payments for entry ${entry.id}:`,
            err,
          );
        }
      }

      // Calculate gain/loss including coupon income for bonds
      const gainLoss = currentValue - totalCost + couponIncomeInDisplayCurrency;
      const gainLossPercentage =
        totalCost > 0 ? (gainLoss / totalCost) * 100 : 0;

      let priceSource: string;
      if (entry.assetType === "bond") {
        if (
          entry.faceValue &&
          entry.couponRate !== undefined &&
          entry.ytm !== undefined &&
          entry.maturityDate &&
          entry.couponFrequency
        ) {
          priceSource = "calculated";
        } else if (entry.currentMarketPrice) {
          priceSource = "manual";
        } else {
          priceSource = "faceValue";
        }
      } else {
        priceSource = entry.source || "unknown";
      }

      entriesPerformance.push({
        entry,
        currentPrice: currentPriceInDisplayCurrency,
        purchasePrice: purchasePriceInDisplayCurrency,
        currentValue: currentValue,
        totalCost: totalCost,
        gainLoss: gainLoss,
        gainLossPercentage: gainLossPercentage,
        priceSource: priceSource,
        currency: displayCurrency,
        exchangeRate: exchangeRate,
      });
    }

    const totalValue = entriesPerformance.reduce(
      (sum, e) => sum + e.currentValue,
      0,
    );
    const totalCost = entriesPerformance.reduce(
      (sum, e) => sum + e.totalCost,
      0,
    );
    const totalGainLoss = totalValue - totalCost;
    const totalGainLossPercentage =
      totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

    return {
      totalValue: totalValue,
      totalCost: totalCost,
      totalGainLoss: totalGainLoss,
      totalGainLossPercentage: totalGainLossPercentage,
      currency: displayCurrency,
      entriesPerformance: entriesPerformance,
    };
  } catch (err) {
    console.error("Failed to calculate performance:", err);
    return null;
  }
};
