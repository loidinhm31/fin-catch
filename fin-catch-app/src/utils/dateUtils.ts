import {endOfDay, format, startOfDay} from "date-fns";

/**
 * Convert JavaScript Date to Unix timestamp (seconds)
 * Normalizes to start of day (00:00:00) in UTC (GMT+0)
 */
export const dateToUnixTimestamp = (date: Date): number => {
  // Create a new date at start of day in UTC
  const utcDate = new Date(Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    0, // hours
    0, // minutes
    0, // seconds
    0  // milliseconds
  ));

  return Math.floor(utcDate.getTime() / 1000);
};

/**
 * Convert Unix timestamp (seconds) to JavaScript Date
 */
export const unixTimestampToDate = (timestamp: number): Date => {
  return new Date(timestamp * 1000);
};

/**
 * Format date for display
 */
export const formatDate = (date: Date, formatString: string = "yyyy-MM-dd"): string => {
  return format(date, formatString);
};

/**
 * Format datetime for display
 */
export const formatDateTime = (date: Date, formatString: string = "yyyy-MM-dd HH:mm:ss"): string => {
  return format(date, formatString);
};

/**
 * Get start of day timestamp (Unix seconds)
 */
export const getStartOfDayTimestamp = (date: Date): number => {
  return dateToUnixTimestamp(startOfDay(date));
};

/**
 * Get end of day timestamp (Unix seconds)
 */
export const getEndOfDayTimestamp = (date: Date): number => {
  return dateToUnixTimestamp(endOfDay(date));
};

/**
 * Format timestamp for chart display
 */
export const formatTimestampForChart = (timestamp: number, resolution: string): string => {
  const date = unixTimestampToDate(timestamp);

  switch (resolution) {
    case "1":
    case "5":
    case "15":
    case "30":
    case "60":
      return format(date, "HH:mm");
    case "1D":
      return format(date, "MMM dd");
    case "1W":
      return format(date, "MMM dd");
    case "1M":
      return format(date, "MMM yyyy");
    default:
      return format(date, "yyyy-MM-dd");
  }
};

/**
 * Get default date range (last 30 days)
 */
export const getDefaultDateRange = (): { from: Date; to: Date } => {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);

  return { from, to };
};

/**
 * Validate date range
 */
export const isValidDateRange = (from: Date, to: Date): boolean => {
  return from < to;
};

/**
 * Get ordinal suffix for a day number (1st, 2nd, 3rd, 4th, etc.)
 */
const getOrdinalSuffix = (day: number): string => {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
};

/**
 * Format date with ordinal suffix: "24th, June, 2024"
 */
export const formatDateWithOrdinal = (date: Date): string => {
  const day = date.getDate();
  const month = format(date, 'MMMM'); // Full month name
  const year = date.getFullYear();

  return `${day}${getOrdinalSuffix(day)}, ${month}, ${year}`;
};
