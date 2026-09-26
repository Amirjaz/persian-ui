import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      // Components import core through its public specifier; point it at the source in tests.
      "@amirjaz/persian-ui/core": fileURLToPath(new URL("./src/core/index.ts", import.meta.url)),
    },
  },
  test: {
    include: ["src/**/*.test.ts", "src/**/*.test.tsx", "test/**/*.test.ts"],
    environment: "node",
    // Iran observed DST until 1401; running in Asia/Tehran keeps date-arithmetic regressions visible.
    env: { TZ: "Asia/Tehran" },
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      // Test files, plus files with no runtime code (the re-export barrel and type-only modules).
      exclude: ["src/**/*.test.{ts,tsx}", "src/core/index.ts", "src/**/types.ts"],
      reporter: [["text", { skipFull: false }], "html"],
      thresholds: {
        "src/core/**": { lines: 100, branches: 100, functions: 100, statements: 100 },
      },
    },
  },
});
