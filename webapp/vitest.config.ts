import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.spec.ts"],
    passWithNoTests: false,
    reporters: ["default"],
    coverage: {
      provider: "v8",
      reportsDirectory: "reports/coverage",
      reporter: ["text", "json", "lcov"],
      include: ["src/app/**/*.ts", "src/content/**/*.ts", "src/i18n/**/*.ts", "src/types/**/*.ts"],
    },
  },
});
