/**
 * Calculate optimal X-axis tick interval based on data points and context
 * @param dataLength - Number of data points
 * @param isFullscreen - Whether chart is in fullscreen/modal mode
 * @param isMobile - Whether on mobile device
 * @param isTablet - Whether on tablet device
 * @returns Interval value or "preserveStartEnd"
 */
export const calculateXAxisInterval = (
  dataLength: number,
  isFullscreen: boolean,
  isMobile: boolean,
  isTablet: boolean = false,
): number | "preserveStartEnd" | "preserveStart" => {
  // For very small datasets, show all ticks
  if (dataLength <= 5) {
    return 0;
  }

  // Mobile devices - always show minimal ticks
  if (isMobile) {
    if (isFullscreen) {
      // In fullscreen modal on mobile, show a few more ticks
      if (dataLength <= 10) return 1;
      if (dataLength <= 30) return Math.floor(dataLength / 6);
      if (dataLength <= 60) return Math.floor(dataLength / 5);
      return Math.floor(dataLength / 4);
    }
    // Regular mobile view - very minimal
    return "preserveStartEnd";
  }

  // Tablet devices
  if (isTablet) {
    if (isFullscreen) {
      // In fullscreen modal on tablet, show moderate number of ticks
      if (dataLength <= 15) return 0;
      if (dataLength <= 30) return 1;
      if (dataLength <= 60) return 2;
      if (dataLength <= 120) return Math.floor(dataLength / 12);
      return Math.floor(dataLength / 10);
    }
    // Regular tablet view
    if (dataLength <= 20) return 0;
    if (dataLength <= 60) return 2;
    return Math.floor(dataLength / 15);
  }

  // Desktop devices
  if (isFullscreen) {
    // In fullscreen modal on desktop, show good number of ticks but not overwhelming
    if (dataLength <= 20) return 0;
    if (dataLength <= 40) return 1;
    if (dataLength <= 90) return 2;
    if (dataLength <= 180) return Math.floor(dataLength / 15);
    if (dataLength <= 365) return Math.floor(dataLength / 20);
    return Math.floor(dataLength / 25);
  }

  // Regular desktop view - show reasonable number of ticks
  if (dataLength <= 30) return 0;
  if (dataLength <= 60) return 2;
  if (dataLength <= 120) return Math.floor(dataLength / 15);
  if (dataLength <= 180) return Math.floor(dataLength / 12);
  return Math.floor(dataLength / 10);
};

/**
 * Calculate how many ticks should be displayed on X-axis
 * Useful for understanding the visual density
 */
export const calculateExpectedTicks = (
  dataLength: number,
  interval: number | "preserveStartEnd" | "preserveStart",
): number => {
  if (interval === "preserveStartEnd") return 2;
  if (interval === "preserveStart") return Math.min(dataLength, 3);
  if (interval === 0) return dataLength;
  return Math.ceil(dataLength / (interval + 1));
};
