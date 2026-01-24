import { createContext, type ReactNode, useContext } from "react";
import type {
  IAuthService,
  ICouponPaymentService,
  IDataService,
  IPortfolioEntryService,
  IPortfolioService,
  ISyncService,
} from "@fin-catch/shared/services";

/**
 * Platform services interface for dependency injection
 * Different platforms (Tauri, Web) provide different implementations
 */
export interface IPlatformServices {
  portfolio: IPortfolioService;
  portfolioEntry: IPortfolioEntryService;
  couponPayment: ICouponPaymentService;
  data: IDataService;
  auth: IAuthService;
  sync: ISyncService;
}

/**
 * Platform context for injecting platform-specific services
 */
export const PlatformContext = createContext<IPlatformServices | null>(null);

/**
 * Hook to access platform services
 * @throws Error if used outside of PlatformProvider
 */
export const usePlatformServices = (): IPlatformServices => {
  const services = useContext(PlatformContext);
  if (!services) {
    throw new Error(
      "usePlatformServices must be used within a PlatformProvider",
    );
  }
  return services;
};

/**
 * Platform provider props
 */
export interface PlatformProviderProps {
  services: IPlatformServices;
  children: ReactNode;
}

/**
 * Platform provider component
 * Wrap your app with this and provide platform-specific service implementations
 */
export const PlatformProvider = ({
  services,
  children,
}: PlatformProviderProps) => {
  return (
    <PlatformContext.Provider value={services}>
      {children}
    </PlatformContext.Provider>
  );
};
