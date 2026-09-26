import { defineConfig } from "tsup";

// tsup's declaration build sets `baseUrl` internally, which TypeScript 6
// deprecates. Silence that for the .d.ts build only, not for our tsconfig.
const dts = { compilerOptions: { ignoreDeprecations: "6.0" } };

// Phase 1 builds only the React-free core entry. The components entry
// (with the "use client" banner) and the stylesheets are added in Phase 3.
export default defineConfig([
  {
    entry: { "core/index": "src/core/index.ts" },
    format: ["esm", "cjs"],
    dts,
    sourcemap: true,
    clean: true,
    target: "es2020",
    outDir: "dist",
  },
]);
