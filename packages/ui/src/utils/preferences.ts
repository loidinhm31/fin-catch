import { CurrencyCode } from "@repo/shared";

/**
 * User preferences stored in localStorage
 */
interface UserPreferences {
  displayCurrency?: CurrencyCode;
}

const PREFERENCES_KEY = "fin-catch-preferences";

/**
 * Load user preferences from localStorage
 */
export function loadPreferences(): UserPreferences {
  try {
    const stored = localStorage.getItem(PREFERENCES_KEY);
    if (stored) {
      return JSON.parse(stored) as UserPreferences;
    }
  } catch (error) {
    console.error("Failed to load preferences:", error);
  }
  return {};
}

/**
 * Save user preferences to localStorage
 */
export function savePreferences(preferences: UserPreferences): void {
  try {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.error("Failed to save preferences:", error);
  }
}

/**
 * Get a specific preference value
 */
export function getPreference<K extends keyof UserPreferences>(
  key: K,
): UserPreferences[K] | undefined {
  const prefs = loadPreferences();
  return prefs[key];
}

/**
 * Set a specific preference value
 */
export function setPreference<K extends keyof UserPreferences>(
  key: K,
  value: UserPreferences[K],
): void {
  const prefs = loadPreferences();
  prefs[key] = value;
  savePreferences(prefs);
}

/**
 * Clear all preferences
 */
export function clearPreferences(): void {
  try {
    localStorage.removeItem(PREFERENCES_KEY);
  } catch (error) {
    console.error("Failed to clear preferences:", error);
  }
}
