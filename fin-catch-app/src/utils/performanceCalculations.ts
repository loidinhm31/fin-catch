import {
  CurrencyCode,
  EntryPerformance,
  PortfolioEntry,
  PortfolioPerformance,
} from "@/types";
import { finCatchAPI } from "@/services/api";
import { convertCurrency } from "./currency";

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

      if (entry.asset_type === "stock") {
        const response = await finCatchAPI.fetchStockHistory({
          symbol: entry.symbol,
          resolution: "1D" as const,
          from: Math.floor(Date.now() / 1000) - 86400,
          to: Math.floor(Date.now() / 1000),
          source: entry.source as any,
        });

        if (response.data && response.data.length > 0) {
          const rawPrice = response.data[response.data.length - 1].close;
          priceScale = (response.metadata?.price_scale as number) ?? 1;
          currentPrice = rawPrice * priceScale;
        }
      } else if (entry.asset_type === "gold") {
        const goldSource = entry.source as "sjc";
        if (!goldSource || goldSource !== "sjc") {
          console.warn(
            `Invalid gold source for entry ${entry.id}: ${entry.source}`,
          );
          continue;
        }

        const response = await finCatchAPI.fetchGoldPrice({
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
      }

      const currentPriceInDisplayCurrency = await convertCurrency(
        currentPrice,
        currentPriceCurrency,
        displayCurrency,
      );

      let scaledPurchasePrice: number;
      if (entry.asset_type === "stock") {
        // Purchase price was entered by user in actual price, no scaling needed
        scaledPurchasePrice = entry.purchase_price;
      } else {
        const userUnit = entry.unit || "tael";
        if (userUnit === "mace") {
          scaledPurchasePrice = entry.purchase_price * 10;
        } else if (userUnit === "tael") {
          scaledPurchasePrice = entry.purchase_price;
        } else if (userUnit === "gram") {
          scaledPurchasePrice = entry.purchase_price * 37.5;
        } else {
          scaledPurchasePrice = entry.purchase_price;
        }
      }

      const purchasePriceInDisplayCurrency = await convertCurrency(
        scaledPurchasePrice,
        entry.currency || "USD",
        displayCurrency,
      );

      const feesInDisplayCurrency = entry.transaction_fees
        ? await convertCurrency(
            entry.transaction_fees,
            entry.currency || "USD",
            displayCurrency,
          )
        : 0;

      const exchangeRate =
        currentPriceCurrency !== displayCurrency
          ? currentPriceInDisplayCurrency / (currentPrice || 1)
          : 1.0;

      let quantityInTaels = entry.quantity;
      if (entry.asset_type === "gold") {
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
      const gainLoss = currentValue - totalCost;
      const gainLossPercentage =
        totalCost > 0 ? (gainLoss / totalCost) * 100 : 0;

      entriesPerformance.push({
        entry,
        current_price: currentPriceInDisplayCurrency,
        purchase_price: purchasePriceInDisplayCurrency,
        current_value: currentValue,
        total_cost: totalCost,
        gain_loss: gainLoss,
        gain_loss_percentage: gainLossPercentage,
        price_source: entry.source || "unknown",
        currency: displayCurrency,
        exchange_rate: exchangeRate,
      });
    }

    const totalValue = entriesPerformance.reduce(
      (sum, e) => sum + e.current_value,
      0,
    );
    const totalCost = entriesPerformance.reduce(
      (sum, e) => sum + e.total_cost,
      0,
    );
    const totalGainLoss = totalValue - totalCost;
    const totalGainLossPercentage =
      totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

    return {
      total_value: totalValue,
      total_cost: totalCost,
      total_gain_loss: totalGainLoss,
      total_gain_loss_percentage: totalGainLossPercentage,
      currency: displayCurrency,
      entries_performance: entriesPerformance,
    };
  } catch (err) {
    console.error("Failed to calculate performance:", err);
    return null;
  }
};
