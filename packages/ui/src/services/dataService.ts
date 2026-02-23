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

export async function fetchStockHistory(
  request: StockHistoryRequest,
): Promise<StockHistoryResponse> {
  return getDataService().fetchStockHistory(request);
}

export async function fetchGoldPrice(
  request: GoldPriceRequest,
): Promise<GoldPriceResponse> {
  return getDataService().fetchGoldPrice(request);
}

export async function fetchExchangeRate(
  request: ExchangeRateRequest,
): Promise<ExchangeRateResponse> {
  return getDataService().fetchExchangeRate(request);
}

export async function fetchGoldPremium(
  request: GoldPremiumRequest,
): Promise<GoldPremiumResponse> {
  return getDataService().fetchGoldPremium(request);
}

export async function getSources(): Promise<Record<string, string[]>> {
  return getDataService().getSources();
}

export async function healthCheckAll(): Promise<Record<string, boolean>> {
  return getDataService().healthCheckAll();
}

export async function healthCheckSource(sourceName: string): Promise<boolean> {
  return getDataService().healthCheckSource(sourceName);
}
