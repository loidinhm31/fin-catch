export const formatCurrencyValue = (value: number): string => {
  return new Intl.NumberFormat("en-EN", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Format currency value in compact notation for chart axes (K, M, B)
 * Use this for Y-axis ticks to save space
 */
export const formatCurrencyCompact = (value: number): string => {
  if (value >= 1000000000) {
    return (value / 1000000000).toFixed(1) + "B";
  } else if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + "M";
  } else if (value >= 1000) {
    return (value / 1000).toFixed(1) + "K";
  }
  return value.toFixed(0);
};

export const formatPercent = (value: number): string => {
  return value.toFixed(2) + "%";
};

export const formatPercentage = (value: number): string => {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
};

export const formatVolume = (value: number): string => {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + "M";
  } else if (value >= 1000) {
    return (value / 1000).toFixed(1) + "K";
  }
  return value.toFixed(0);
};

export const formatChartDate = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleDateString();
};
