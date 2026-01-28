import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["packages/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["packages/*/src/**/*.{ts,tsx}"],
      exclude: [
        "packages/*/src/**/*.test.{ts,tsx}",
        "packages/*/src/**/*.spec.{ts,tsx}",
        "packages/*/src/types/**",
        "packages/*/src/**/*.d.ts",
      ],
    },
  },
  resolve: {
    alias: {
      "@fin-catch/shared": resolve(__dirname, "packages/shared/src"),
      "@fin-catch/ui": resolve(__dirname, "packages/ui/src"),
      "@fin-catch/ui/atoms": resolve(__dirname, "packages/ui/src/atoms"),
      "@fin-catch/ui/molecules": resolve(
        __dirname,
        "packages/ui/src/molecules",
      ),
      "@fin-catch/ui/organisms": resolve(
        __dirname,
        "packages/ui/src/organisms",
      ),
      "@fin-catch/ui/hooks": resolve(__dirname, "packages/ui/src/hooks"),
      "@fin-catch/ui/utils": resolve(__dirname, "packages/ui/src/utils"),
      "@fin-catch/ui/services": resolve(__dirname, "packages/ui/src/services"),
      "@fin-catch/ui/pages": resolve(__dirname, "packages/ui/src/pages"),
      "@fin-catch/ui/types": resolve(__dirname, "packages/ui/src/types"),
    },
  },
});
