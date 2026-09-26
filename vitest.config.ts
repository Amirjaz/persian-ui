import { fileURLToPath } from "node:url";
import { playwright } from "@vitest/browser-playwright";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const fromRoot = (path: string) => fileURLToPath(new URL(path, import.meta.url));

/** React 18 and a Testing Library bound to it, installed by the test/react18 workspace package. */
const react18 = (name: string) => fromRoot(`./test/react18/node_modules/${name}`);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Components import core through its public specifier; point it at the source in tests.
      "@amirjaz/persian-ui/core": fromRoot("./src/core/index.ts"),
    },
  },
  test: {
    // Iran observed DST until 1401; running in Asia/Tehran keeps date-arithmetic regressions visible.
    env: { TZ: "Asia/Tehran" },
    // axe-core accessibility scans are slow in jsdom, especially with projects running in parallel.
    testTimeout: 15_000,
    projects: [
      {
        extends: true,
        test: {
          name: "core",
          environment: "node",
          include: ["src/core/**/*.test.ts", "test/**/*.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "react",
          environment: "jsdom",
          include: ["src/react/**/*.test.{ts,tsx}"],
          setupFiles: ["./test/setup-dom.ts"],
        },
      },
      {
        // The same component tests against React 18.3, the oldest supported version.
        extends: true,
        resolve: {
          alias: [
            { find: /^react$/, replacement: react18("react") },
            { find: /^react\/(.*)$/, replacement: `${react18("react")}/$1` },
            { find: /^react-dom$/, replacement: react18("react-dom") },
            { find: /^react-dom\/(.*)$/, replacement: `${react18("react-dom")}/$1` },
            { find: /^@testing-library\/react$/, replacement: react18("@testing-library/react") },
            { find: /^@testing-library\/user-event$/, replacement: react18("@testing-library/user-event") },
          ],
        },
        test: {
          name: "react18",
          environment: "jsdom",
          include: ["src/react/**/*.test.tsx"],
          setupFiles: ["./test/setup-dom.ts"],
        },
      },
      {
        // Real layout, in the Edge (or Chrome: PUI_BROWSER_CHANNEL=chrome) already installed on the machine.
        extends: true,
        test: {
          name: "browser",
          include: ["test/browser/**/*.browser.test.tsx"],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({
              launchOptions: { channel: process.env.PUI_BROWSER_CHANNEL ?? "msedge" },
            }),
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      // Test files, plus files with no runtime code (re-export barrels and type-only modules).
      exclude: ["src/**/*.test.{ts,tsx}", "src/core/index.ts", "src/react/index.ts", "src/**/types.ts"],
      reporter: [["text", { skipFull: false }], "html"],
      thresholds: {
        "src/core/**": { lines: 100, branches: 100, functions: 100, statements: 100 },
        "src/react/**": { lines: 90, branches: 90, functions: 90, statements: 90 },
      },
    },
  },
});
