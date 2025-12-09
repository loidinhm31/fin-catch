import { useState, useEffect } from "react";

export interface ChartDimensions {
  height: number;
  fontSize: number;
  tickFontSize: number;
  labelFontSize: number;
  legendFontSize: number;
  brushHeight: number;
  showBrush: boolean;
  showLegend: boolean;
  angleXAxis: number;
  marginLeft: number;
  marginRight: number;
  marginBottom: number;
}

export const useResponsiveChart = () => {
  const [dimensions, setDimensions] = useState<ChartDimensions>({
    height: 500,
    fontSize: 12,
    tickFontSize: 12,
    labelFontSize: 14,
    legendFontSize: 12,
    brushHeight: 30,
    showBrush: true,
    showLegend: true,
    angleXAxis: -45,
    marginLeft: 20,
    marginRight: 30,
    marginBottom: 80,
  });

  // Fullscreen dimensions - always larger and more detailed
  const [fullscreenDimensions, setFullscreenDimensions] = useState<ChartDimensions>({
    height: 600,
    fontSize: 13,
    tickFontSize: 13,
    labelFontSize: 15,
    legendFontSize: 13,
    brushHeight: 40,
    showBrush: true,
    showLegend: true,
    angleXAxis: -45,
    marginLeft: 30,
    marginRight: 40,
    marginBottom: 90,
  });

  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const updateDimensions = () => {
      const width = window.innerWidth;

      // Mobile: < 640px
      if (width < 640) {
        setIsMobile(true);
        setIsTablet(false);
        setDimensions({
          height: 300,
          fontSize: 10,
          tickFontSize: 9,
          labelFontSize: 11,
          legendFontSize: 10,
          brushHeight: 40,
          showBrush: false,
          showLegend: true,
          angleXAxis: -90,
          marginLeft: 10,
          marginRight: 10,
          marginBottom: 60,
        });
        // Fullscreen on mobile - much larger
        setFullscreenDimensions({
          height: 500,
          fontSize: 12,
          tickFontSize: 11,
          labelFontSize: 13,
          legendFontSize: 11,
          brushHeight: 45,
          showBrush: true,
          showLegend: true,
          angleXAxis: -45,
          marginLeft: 20,
          marginRight: 20,
          marginBottom: 80,
        });
      }
      // Tablet: 640px - 1024px
      else if (width < 1024) {
        setIsMobile(false);
        setIsTablet(true);
        setDimensions({
          height: 400,
          fontSize: 11,
          tickFontSize: 11,
          labelFontSize: 12,
          legendFontSize: 11,
          brushHeight: 35,
          showBrush: true,
          showLegend: true,
          angleXAxis: -45,
          marginLeft: 15,
          marginRight: 20,
          marginBottom: 70,
        });
        // Fullscreen on tablet - larger
        setFullscreenDimensions({
          height: 600,
          fontSize: 13,
          tickFontSize: 12,
          labelFontSize: 14,
          legendFontSize: 12,
          brushHeight: 40,
          showBrush: true,
          showLegend: true,
          angleXAxis: -45,
          marginLeft: 25,
          marginRight: 30,
          marginBottom: 85,
        });
      }
      // Desktop: > 1024px
      else {
        setIsMobile(false);
        setIsTablet(false);
        setDimensions({
          height: 500,
          fontSize: 12,
          tickFontSize: 12,
          labelFontSize: 14,
          legendFontSize: 12,
          brushHeight: 30,
          showBrush: true,
          showLegend: true,
          angleXAxis: -45,
          marginLeft: 20,
          marginRight: 30,
          marginBottom: 80,
        });
        // Fullscreen on desktop - even larger
        setFullscreenDimensions({
          height: 700,
          fontSize: 14,
          tickFontSize: 14,
          labelFontSize: 16,
          legendFontSize: 14,
          brushHeight: 40,
          showBrush: true,
          showLegend: true,
          angleXAxis: -45,
          marginLeft: 30,
          marginRight: 40,
          marginBottom: 90,
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  return {
    dimensions,
    fullscreenDimensions,
    isMobile,
    isTablet,
    isDesktop: !isMobile && !isTablet,
  };
};
