/**
 * Sync Module for Web Application
 *
 * Provides IndexedDB-based sync with qm-center-server.
 */

// Client
export {
  QmSyncClient,
  createSyncClientConfig,
  fetchHttpClient,
  type HttpClientFn,
} from "@repo/shared";

// Storage
export { IndexedDBSyncStorage } from "./IndexedDBSyncStorage";

// Adapter
export {
  IndexedDBSyncAdapter,
  createIndexedDBSyncAdapter,
  type IndexedDBSyncAdapterConfig,
  type TokenProvider,
  type TokenSaver,
} from "./IndexedDBSyncAdapter";
