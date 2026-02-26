/**
 * Tests for Phase 01 sync layer hardening:
 * - Conflict-aware markSynced (Issue B)
 * - Retry/backoff wrapper (Issue C)
 */

import { describe, it, expect, vi } from "vitest";

// Mock db singleton so IndexedDBSyncStorage can be imported in jsdom
vi.mock("@fin-catch/ui/adapters/web", () => ({
  db: {},
  getCurrentTimestamp: () => Math.floor(Date.now() / 1000),
  SYNC_META_KEYS: { CHECKPOINT: "checkpoint", LAST_SYNC_AT: "lastSyncAt" },
}));

// Mock QmSyncClient construction so IndexedDBSyncAdapter doesn't fail on init
vi.mock("@fin-catch/shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@fin-catch/shared")>();
  return {
    ...actual,
    createSyncClientConfig: vi.fn(() => ({})),
    QmSyncClient: vi.fn().mockImplementation(() => ({
      isAuthenticated: vi.fn().mockReturnValue(false),
      setTokens: vi.fn(),
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    })),
  };
});

import { withRetry } from "./IndexedDBSyncAdapter";

// Zero-delay sleep for fast tests
const noSleep = () => Promise.resolve();

// ============================================================================
// withRetry unit tests
// ============================================================================

describe("withRetry", () => {
  it("resolves immediately on first success", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    const result = await withRetry(fn, 3, noSleep);
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on transient error and eventually succeeds", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("network timeout"))
      .mockRejectedValueOnce(new Error("network timeout"))
      .mockResolvedValue("ok");

    const result = await withRetry(fn, 3, noSleep);
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("throws after exhausting all attempts", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("fail-1"))
      .mockRejectedValueOnce(new Error("fail-2"));

    await expect(withRetry(fn, 2, noSleep)).rejects.toThrow("fail-2");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("does NOT retry on 401 auth error", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("HTTP 401 Unauthorized"));

    await expect(withRetry(fn, 3, noSleep)).rejects.toThrow("401");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("does NOT retry on 403 auth error", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("status 403 Forbidden"));

    await expect(withRetry(fn, 3, noSleep)).rejects.toThrow("403");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("DOES retry when message contains 401 as part of a non-HTTP string", async () => {
    // e.g. "Record 4010 failed" — old string.includes would suppress retry, regex won't
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("Record 4010 failed"))
      .mockResolvedValue("ok");

    const result = await withRetry(fn, 3, noSleep);
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

// ============================================================================
// Conflict filtering integration test (mocked storage + client)
// ============================================================================

describe("IndexedDBSyncAdapter — conflict-aware markSynced", () => {
  it("does not mark conflicted records as synced", async () => {
    // Inline mock to avoid Dexie import issues in jsdom
    const markSynced = vi.fn().mockResolvedValue(undefined);
    const saveCheckpoint = vi.fn().mockResolvedValue(undefined);
    const saveLastSyncAt = vi.fn().mockResolvedValue(undefined);
    const applyRemoteChanges = vi.fn().mockResolvedValue(undefined);
    const mockStorage = {
      getPendingChanges: vi.fn().mockResolvedValue([
        { tableName: "portfolios", rowId: "row-1", data: {}, version: 1, deleted: false },
        { tableName: "portfolios", rowId: "row-2", data: {}, version: 1, deleted: false },
        { tableName: "portfolios", rowId: "row-3", data: {}, version: 1, deleted: false },
      ]),
      getCheckpoint: vi.fn().mockResolvedValue(undefined),
      markSynced,
      saveCheckpoint,
      saveLastSyncAt,
      applyRemoteChanges,
      getPendingChangesCount: vi.fn().mockResolvedValue(0),
      getLastSyncAt: vi.fn().mockResolvedValue(undefined),
    };

    const mockClient = {
      isAuthenticated: vi.fn().mockReturnValue(true),
      setTokens: vi.fn(),
      delta: vi.fn().mockResolvedValue({
        push: {
          synced: 2,
          conflicts: [
            { tableName: "portfolios", rowId: "row-2", clientVersion: 1, serverVersion: 2 },
          ],
          failures: [],
          serverTimestamp: "2026-01-01T00:00:00Z",
        },
        pull: {
          records: [],
          checkpoint: { timestamp: 0, offset: 0 },
          hasMore: false,
        },
      }),
    };

    // Build adapter with injected mocks bypassing constructor
    const { IndexedDBSyncAdapter } = await import("./IndexedDBSyncAdapter");
    const adapter = new IndexedDBSyncAdapter({
      getConfig: () => ({ serverUrl: "http://test", appId: "test", apiKey: "key" }),
      getTokens: async () => ({ accessToken: "tok", refreshToken: "ref", userId: "u1" }),
    });

    // Replace private fields with mocks
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (adapter as any).storage = mockStorage;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (adapter as any).client = mockClient;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (adapter as any).lastConfigHash = "http://test|test|key";

    const result = await adapter.syncNow();

    expect(result.success).toBe(true);
    expect(result.conflicts).toBe(1);

    // markSynced should be called with row-1 and row-3, NOT row-2 (conflicted)
    expect(markSynced).toHaveBeenCalledTimes(1);
    const calledWith = markSynced.mock.calls[0][0] as Array<{ tableName: string; rowId: string }>;
    expect(calledWith).toHaveLength(2);
    expect(calledWith.map((r) => r.rowId)).toEqual(
      expect.arrayContaining(["row-1", "row-3"]),
    );
    expect(calledWith.map((r) => r.rowId)).not.toContain("row-2");
  });

  it("skips markSynced when all records are conflicts", async () => {
    const markSynced = vi.fn().mockResolvedValue(undefined);
    const mockStorage = {
      getPendingChanges: vi.fn().mockResolvedValue([
        { tableName: "portfolios", rowId: "row-1", data: {}, version: 1, deleted: false },
      ]),
      getCheckpoint: vi.fn().mockResolvedValue(undefined),
      markSynced,
      saveCheckpoint: vi.fn().mockResolvedValue(undefined),
      saveLastSyncAt: vi.fn().mockResolvedValue(undefined),
      applyRemoteChanges: vi.fn().mockResolvedValue(undefined),
      getPendingChangesCount: vi.fn().mockResolvedValue(0),
      getLastSyncAt: vi.fn().mockResolvedValue(undefined),
    };

    const mockClient = {
      isAuthenticated: vi.fn().mockReturnValue(true),
      setTokens: vi.fn(),
      delta: vi.fn().mockResolvedValue({
        push: {
          synced: 0,
          conflicts: [
            { tableName: "portfolios", rowId: "row-1", clientVersion: 1, serverVersion: 2 },
          ],
          failures: [],
          serverTimestamp: "2026-01-01T00:00:00Z",
        },
        pull: {
          records: [],
          checkpoint: { timestamp: 0, offset: 0 },
          hasMore: false,
        },
      }),
    };

    const { IndexedDBSyncAdapter } = await import("./IndexedDBSyncAdapter");
    const adapter = new IndexedDBSyncAdapter({
      getConfig: () => ({ serverUrl: "http://test", appId: "test", apiKey: "key" }),
      getTokens: async () => ({ accessToken: "tok", refreshToken: "ref", userId: "u1" }),
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (adapter as any).storage = mockStorage;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (adapter as any).client = mockClient;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (adapter as any).lastConfigHash = "http://test|test|key";

    await adapter.syncNow();
    expect(markSynced).not.toHaveBeenCalled();
  });
});
