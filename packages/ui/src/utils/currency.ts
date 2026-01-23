import { finCatchAPI } from "@repo/ui/services";
import type {
  CURRENCY_SYMBOLS,
  CurrencyCode,
  ExchangeRateRequest,
  ExchangeRateResponse,
} from "@repo/shared";

/**
 * Cache for exchange rates to avoid repeated API calls
 */
interface ExchangeRateCache {
  rate: number;
  timestamp: number;
  expiresAt: number;
}

const exchangeRateCache = new Map<string, ExchangeRateCache>();
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get the cache key for an exchange rate
 */
function getCacheKey(from: CurrencyCode, to: CurrencyCode): string {
  return `${from}_${to}`;
}

/**
 * Fetch exchange rate for a currency to VND
 * @param currency Currency code to get VND rate for
 * @param date Optional date for historical rate
 * @returns Exchange rate to VND (e.g., 1 USD = 24,500 VND)
 */
async function getCurrencyToVNDRate(
  currency: CurrencyCode,
  date?: Date,
): Promise<number> {
  // VND to VND is always 1
  if (currency === "VND") {
    return 1;
  }

  const now = date || new Date();
  const timestamp = Math.floor(now.getTime() / 1000);

  const request: ExchangeRateRequest = {
    currency_code: currency,
    from: timestamp - 3600, // 1 hour before
    to: timestamp,
  };

  const response: ExchangeRateResponse =
    await finCatchAPI.fetchExchangeRate(request);

  if (response.status === "ok" && response.data && response.data.length > 0) {
    // Get the most recent rate - use sell rate for conversions
    const latestRate = response.data[response.data.length - 1];
    return latestRate.sell;
  } else {
    throw new Error(
      response.error || `Failed to fetch exchange rate for ${currency}`,
    );
  }
}

/**
 * Fetch the latest exchange rate between two currencies
 * Note: Backend provides rates to VND, so conversions go through VND
 * @param fromCurrency Source currency code
 * @param toCurrency Target currency code
 * @param date Optional date for historical rate (defaults to now)
 * @returns The exchange rate, or 1 if currencies are the same
 */
export async function getExchangeRate(
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode,
  date?: Date,
): Promise<number> {
  // If same currency, no conversion needed
  if (fromCurrency === toCurrency) {
    return 1;
  }

  // Check cache first (only for current rates)
  if (!date) {
    const cacheKey = getCacheKey(fromCurrency, toCurrency);
    const cached = exchangeRateCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.rate;
    }
  }

  try {
    let rate: number;

    // Handle VND conversions
    if (toCurrency === "VND") {
      // From foreign currency to VND (direct)
      rate = await getCurrencyToVNDRate(fromCurrency, date);
    } else if (fromCurrency === "VND") {
      // From VND to foreign currency (inverse)
      const toVNDRate = await getCurrencyToVNDRate(toCurrency, date);
      rate = 1 / toVNDRate;
    } else {
      // From foreign currency A to foreign currency B (through VND)
      // Example: USD to EUR = (USD to VND) / (EUR to VND)
      const fromToVND = await getCurrencyToVNDRate(fromCurrency, date);
      const toToVND = await getCurrencyToVNDRate(toCurrency, date);
      rate = fromToVND / toToVND;
    }

    // Cache the rate if it's current
    if (!date) {
      const cacheKey = getCacheKey(fromCurrency, toCurrency);
      exchangeRateCache.set(cacheKey, {
        rate,
        timestamp: Date.now(),
        expiresAt: Date.now() + CACHE_DURATION_MS,
      });
    }

    return rate;
  } catch (error) {
    console.error(
      `Error fetching exchange rate from ${fromCurrency} to ${toCurrency}:`,
      error,
    );
    throw error;
  }
}

/**
 * Convert an amount from one currency to another
 * @param amount Amount to convert
 * @param fromCurrency Source currency code
 * @param toCurrency Target currency code
 * @param date Optional date for historical conversion
 * @returns The converted amount
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode,
  date?: Date,
): Promise<number> {
  const rate = await getExchangeRate(fromCurrency, toCurrency, date);
  return amount * rate;
}

/**
 * Format a currency value with its symbol
 * @param amount Amount to format
 * @param currency Currency code
 * @param decimals Number of decimal places (default: 2)
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  currency: CurrencyCode,
  decimals: number = 2,
): string {
  const symbols: typeof CURRENCY_SYMBOLS = {
    USD: "$",
    VND: "₫",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
    CNY: "¥",
    KRW: "₩",
    THB: "฿",
    SGD: "S$",
  };

  const symbol = symbols[currency];
  const formatted = amount.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  // For VND and currencies that typically show symbol after
  if (currency === "VND") {
    return `${formatted}${symbol}`;
  }

  // For most currencies, show symbol before
  return `${symbol}${formatted}`;
}

/**
 * Get multiple exchange rates in a batch
 * @param conversions Array of conversion pairs
 * @returns Map of conversion keys to rates
 */
export async function getExchangeRateBatch(
  conversions: Array<{ from: CurrencyCode; to: CurrencyCode; date?: Date }>,
): Promise<Map<string, number>> {
  const results = new Map<string, number>();

  // Process all conversions in parallel
  await Promise.all(
    conversions.map(async ({ from, to, date }) => {
      try {
        const rate = await getExchangeRate(from, to, date);
        const key = getCacheKey(from, to);
        results.set(key, rate);
      } catch (error) {
        console.error(`Failed to get rate for ${from} to ${to}:`, error);
        // Set to 0 to indicate failure
        results.set(getCacheKey(from, to), 0);
      }
    }),
  );

  return results;
}

/**
 * Clear the exchange rate cache
 */
export function clearExchangeRateCache(): void {
  exchangeRateCache.clear();
}

/**
 * Validate if a currency code is supported
 */
export function isSupportedCurrency(
  currency: string,
): currency is CurrencyCode {
  const supportedCurrencies: CurrencyCode[] = [
    "USD",
    "VND",
    "EUR",
    "GBP",
    "JPY",
    "CNY",
    "KRW",
    "THB",
    "SGD",
  ];
  return supportedCurrencies.includes(currency as CurrencyCode);
}
