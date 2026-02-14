import {
  ExchangeRateRequest,
  ExchangeRateResponse,
  GoldPremiumRequest,
  GoldPremiumResponse,
  GoldPriceRequest,
  GoldPriceResponse,
  StockHistoryRequest,
  StockHistoryResponse,
} from "@fin-catch/shared";
import { getDataService } from "@fin-catch/ui/adapters/factory";

function handleError(error: unknown): Error {
  if (typeof error === "string") {
    return new Error(error);
  }
  return error instanceof Error ? error : new Error("Unknown error occurred");
}

export async function fetchStockHistory(
  request: StockHistoryRequest,
): Promise<StockHistoryResponse> {
  try {
    return await getDataService().fetchStockHistory(request);
  } catch (error) {
    console.error("Error fetching stock history:", error);
    throw handleError(error);
  }
}

export async function fetchGoldPrice(
  request: GoldPriceRequest,
): Promise<GoldPriceResponse> {
  try {
    return await getDataService().fetchGoldPrice(request);
  } catch (error) {
    console.error("Error fetching gold price:", error);
    throw handleError(error);
  }
}

export async function fetchExchangeRate(
  request: ExchangeRateRequest,
): Promise<ExchangeRateResponse> {
  try {
    return await getDataService().fetchExchangeRate(request);
  } catch (error) {
    console.error("Error fetching exchange rate:", error);
    throw handleError(error);
  }
}

export async function fetchGoldPremium(
  request: GoldPremiumRequest,
): Promise<GoldPremiumResponse> {
  try {
    return await getDataService().fetchGoldPremium(request);
  } catch (error) {
    console.error("Error fetching gold premium:", error);
    throw handleError(error);
  }
}

export async function getSources(): Promise<Record<string, string[]>> {
  try {
    return await getDataService().getSources();
  } catch (error) {
    console.error("Error fetching sources:", error);
    throw handleError(error);
  }
}

export async function healthCheckAll(): Promise<Record<string, boolean>> {
  try {
    return await getDataService().healthCheckAll();
  } catch (error) {
    console.error("Error checking health:", error);
    throw handleError(error);
  }
}

export async function healthCheckSource(sourceName: string): Promise<boolean> {
  try {
    return await getDataService().healthCheckSource(sourceName);
  } catch (error) {
    console.error(`Error checking health for ${sourceName}:`, error);
    throw handleError(error);
  }
}
