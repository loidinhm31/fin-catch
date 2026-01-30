import "@testing-library/jest-dom";
import { beforeEach, vi } from "vitest";

// Mock import.meta.env
const mockEnv = {
  DEV: true,
  PROD: false,
  MODE: "test",
  VITE_QM_SYNC_SERVER_URL: "http://localhost:3000",
  VITE_FIN_CATCH_APP_ID: "fin-catch-test",
  VITE_FIN_CATCH_API_KEY: "test-api-key",
};

globalThis.import = { meta: { env: mockEnv } };

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] ?? null;
    },
  };
})();

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
});

// Mock fetch
globalThis.fetch = vi.fn();

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
});
