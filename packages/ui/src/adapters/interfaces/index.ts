/**
 * Service interfaces re-exported from @repo/shared
 *
 * This file provides backward compatibility for existing imports.
 * All service interfaces are now defined in the shared package.
 */
export type {
  IPortfolioService,
  IPortfolioEntryService,
  ICouponPaymentService,
  IDataService,
  IAuthService,
  ISyncService,
} from "@repo/shared";
