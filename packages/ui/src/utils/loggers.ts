import { logger } from "@fin-catch/shared";

/**
 * Domain-specific logger wrappers for consistent logging across services
 */
export const serviceLogger = {
  /**
   * Log HTTP-related messages
   */
  http: (msg: string, ...args: unknown[]) => logger.info("HTTP", msg, ...args),
  httpError: (msg: string, ...args: unknown[]) =>
    logger.error("HTTP", msg, ...args),
  httpDebug: (msg: string, ...args: unknown[]) =>
    logger.debug("HTTP", msg, ...args),

  /**
   * Log Tauri IPC messages
   */
  tauri: (msg: string, ...args: unknown[]) =>
    logger.info("Tauri IPC", msg, ...args),
  tauriError: (msg: string, ...args: unknown[]) =>
    logger.error("Tauri IPC", msg, ...args),
  tauriDebug: (msg: string, ...args: unknown[]) =>
    logger.debug("Tauri IPC", msg, ...args),

  /**
   * Log SSE (Server-Sent Events) messages
   */
  sse: (msg: string, ...args: unknown[]) => logger.info("SSE", msg, ...args),
  sseError: (msg: string, ...args: unknown[]) =>
    logger.error("SSE", msg, ...args),
  sseDebug: (msg: string, ...args: unknown[]) =>
    logger.debug("SSE", msg, ...args),

  /**
   * Log authentication-related messages
   */
  auth: (msg: string, ...args: unknown[]) => logger.info("Auth", msg, ...args),
  authError: (msg: string, ...args: unknown[]) =>
    logger.error("Auth", msg, ...args),
  authDebug: (msg: string, ...args: unknown[]) =>
    logger.debug("Auth", msg, ...args),

  /**
   * Log service factory messages
   */
  factory: (msg: string, ...args: unknown[]) =>
    logger.info("ServiceFactory", msg, ...args),
  factoryError: (msg: string, ...args: unknown[]) =>
    logger.error("ServiceFactory", msg, ...args),
  factoryDebug: (msg: string, ...args: unknown[]) =>
    logger.debug("ServiceFactory", msg, ...args),

  /**
   * Log market data adapter messages
   */
  market: (msg: string, ...args: unknown[]) =>
    logger.info("MarketData", msg, ...args),
  marketError: (msg: string, ...args: unknown[]) =>
    logger.error("MarketData", msg, ...args),
  marketDebug: (msg: string, ...args: unknown[]) =>
    logger.debug("MarketData", msg, ...args),

  /**
   * Log trading adapter messages
   */
  trading: (msg: string, ...args: unknown[]) =>
    logger.info("TradingAuth", msg, ...args),
  tradingError: (msg: string, ...args: unknown[]) =>
    logger.error("TradingAuth", msg, ...args),
  tradingDebug: (msg: string, ...args: unknown[]) =>
    logger.debug("TradingAuth", msg, ...args),

  /**
   * Log QM Server messages
   */
  qmServer: (msg: string, ...args: unknown[]) =>
    logger.info("QmServer", msg, ...args),
  qmServerError: (msg: string, ...args: unknown[]) =>
    logger.error("QmServer", msg, ...args),
  qmServerDebug: (msg: string, ...args: unknown[]) =>
    logger.debug("QmServer", msg, ...args),

  /**
   * Log sync adapter messages
   */
  sync: (msg: string, ...args: unknown[]) => logger.info("Sync", msg, ...args),
  syncError: (msg: string, ...args: unknown[]) =>
    logger.error("Sync", msg, ...args),
  syncDebug: (msg: string, ...args: unknown[]) =>
    logger.debug("Sync", msg, ...args),

  /**
   * Log portfolio adapter messages
   */
  portfolio: (msg: string, ...args: unknown[]) =>
    logger.info("Portfolio", msg, ...args),
  portfolioError: (msg: string, ...args: unknown[]) =>
    logger.error("Portfolio", msg, ...args),
  portfolioDebug: (msg: string, ...args: unknown[]) =>
    logger.debug("Portfolio", msg, ...args),
};
