/**
 * Tests for Phase 02 auth/security changes in QmServerAuthAdapter:
 * - Refresh dedup via doRefresh() promise
 * - logout() dispatches auth:logout event
 * - logout() invalidates statusCache
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock isTauri so constructor uses env (web mode)
vi.mock("@fin-catch/ui/utils", () => ({
  isTauri: () => false,
  serviceLogger: {
    qmServer: vi.fn(),
    qmServerDebug: vi.fn(),
    qmServerError: vi.fn(),
  },
}));

// Mock @fin-catch/shared — keep real AUTH_STORAGE_KEYS, stub env
vi.mock("@fin-catch/shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@fin-catch/shared")>();
  return {
    ...actual,
    env: {
      serverUrl: "http://localhost:3000",
      appId: "fin-catch-test",
      apiKey: "test-api-key",
    },
  };
});

import { QmServerAuthAdapter } from "./QmServerAuthAdapter";
import { AUTH_STORAGE_KEYS } from "@fin-catch/shared";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a non-expired JWT with exp = now + 60s */
function makeValidJwt(): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(
    JSON.stringify({ sub: "u1", exp: Math.floor(Date.now() / 1000) + 60 }),
  );
  return `${header}.${payload}.sig`;
}

/** Build an already-expired JWT */
function makeExpiredJwt(): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(
    JSON.stringify({ sub: "u1", exp: Math.floor(Date.now() / 1000) - 60 }),
  );
  return `${header}.${payload}.sig`;
}

/** Seed localStorage with a valid access token + a refresh token */
function seedTokens(expired = false) {
  localStorage.setItem(
    AUTH_STORAGE_KEYS.ACCESS_TOKEN,
    expired ? makeExpiredJwt() : makeValidJwt(),
  );
  localStorage.setItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, "rt-value");
}

/** Make fetch return a minimal /auth/me response */
function mockMeResponse(
  overrides?: Partial<{
    userId: string;
    username: string;
    email: string;
    apps: string[];
    isAdmin: boolean;
  }>,
) {
  (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
    ok: true,
    text: async () => "",
    json: async () => ({
      userId: "u1",
      username: "alice",
      email: "alice@example.com",
      apps: [],
      isAdmin: false,
      ...overrides,
    }),
  });
}

/** Make fetch return a refresh token response */
function mockRefreshResponse() {
  (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
    ok: true,
    text: async () => "",
    json: async () => ({
      accessToken: makeValidJwt(),
      refreshToken: "rt-new",
    }),
  });
}

// ---------------------------------------------------------------------------
// Test: refresh dedup — two concurrent getStatus() with expired token call
//       doRefresh() only once
// ---------------------------------------------------------------------------

describe("QmServerAuthAdapter — refresh dedup", () => {
  it("calls /auth/refresh exactly once when two concurrent getStatus() both find expired token", async () => {
    seedTokens(/* expired= */ true);

    // Sequence: first call → refresh (POST /auth/refresh), second fetch → GET /auth/me
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    let refreshCallCount = 0;

    fetchMock.mockImplementation((url: string) => {
      if ((url as string).includes("/auth/refresh")) {
        refreshCallCount++;
        return Promise.resolve({
          ok: true,
          text: async () => "",
          json: async () => ({
            accessToken: makeValidJwt(),
            refreshToken: "rt-new",
          }),
        });
      }
      // /auth/me
      return Promise.resolve({
        ok: true,
        text: async () => "",
        json: async () => ({
          userId: "u1",
          username: "alice",
          email: "alice@example.com",
          apps: [],
          isAdmin: false,
        }),
      });
    });

    const adapter = new QmServerAuthAdapter();

    // Both calls enter getStatus() synchronously (JS single-threaded) before any
    // microtask resolves, so both see expired token and both call doRefresh().
    // The second caller finds refreshPromise != null and joins the existing promise.
    // This covers the exact race window the dedup is protecting.
    const [s1, s2] = await Promise.all([adapter.getStatus(), adapter.getStatus()]);

    // Only one actual /auth/refresh network call despite two concurrent callers
    expect(refreshCallCount).toBe(1);

    // Both should return an authenticated status (refresh succeeded)
    expect(s1.isAuthenticated).toBe(true);
    expect(s2.isAuthenticated).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Test: logout() while refresh in-flight — tokens must NOT be re-written
// ---------------------------------------------------------------------------

describe("QmServerAuthAdapter — logout during in-flight refresh", () => {
  it("does not re-write tokens when logout() races with in-flight performRefresh()", async () => {
    seedTokens(/* expired= */ true);

    let resolveRefresh!: (value: Response) => void;
    const refreshPending = new Promise<Response>((resolve) => {
      resolveRefresh = resolve;
    });

    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockImplementation(() => refreshPending);

    const adapter = new QmServerAuthAdapter();
    // Start a refresh (will hang until resolveRefresh)
    const refreshPromise = adapter.refreshToken();

    // Logout while the fetch is still pending
    await adapter.logout();

    // Now resolve the in-flight refresh with new tokens
    resolveRefresh({
      ok: true,
      text: async () => "",
      json: async () => ({
        accessToken: makeValidJwt(),
        refreshToken: "rt-new",
      }),
    } as unknown as Response);

    await refreshPromise;

    // loggedOut flag must have prevented re-writing tokens
    expect(localStorage.getItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN)).toBeNull();
    expect(localStorage.getItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Test: logout() dispatches "auth:logout" window event
// ---------------------------------------------------------------------------

describe("QmServerAuthAdapter — logout event", () => {
  it('dispatches "auth:logout" window event on logout()', async () => {
    const received: string[] = [];
    const listener = (e: Event) => received.push(e.type);
    window.addEventListener("auth:logout", listener);

    const adapter = new QmServerAuthAdapter();
    await adapter.logout();

    window.removeEventListener("auth:logout", listener);

    expect(received).toEqual(["auth:logout"]);
  });
});

// ---------------------------------------------------------------------------
// Test: logout() clears statusCache — next getStatus() does NOT return stale
// ---------------------------------------------------------------------------

describe("QmServerAuthAdapter — logout clears cache", () => {
  it("does not serve stale cached status after logout()", async () => {
    seedTokens(/* expired= */ false);

    // Prime the cache: first getStatus() → hits /auth/me → stores cache
    mockMeResponse({ userId: "u1", username: "alice" });
    const adapter = new QmServerAuthAdapter();
    const before = await adapter.getStatus();
    expect(before.isAuthenticated).toBe(true);

    // logout() — clears tokens AND cache
    await adapter.logout();

    // After logout localStorage has no access token.
    // getStatus() must NOT return the old cached status.
    // It should immediately return isAuthenticated: false (no token path).
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockClear(); // reset call count

    const after = await adapter.getStatus();

    // No token in localStorage → unauthenticated, no server call needed
    expect(after.isAuthenticated).toBe(false);
    // fetch should not have been called (no token → early return)
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
