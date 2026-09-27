import { defineConfig } from "tsup";

// tsup's declaration build sets `baseUrl` internally, which TypeScript 6
// deprecates. Silence that for the .d.ts build only, not for our tsconfig.
const dts = { compilerOptions: { ignoreDeprecations: "6.0" } };

const shared = {
  format: ["esm", "cjs"],
  dts,
  sourcemap: true,
  target: "es2020",
  outDir: "dist",
  // scripts/build.mjs empties dist first; the two builds run in parallel.
  clean: false,
} as const;

export default defineConfig([
  {
    ...shared,
    // React-free: callable from Server Components, server actions and Node.
    entry: { "core/index": "src/core/index.ts" },
  },
  {
    ...shared,
    entry: { index: "src/react/index.ts" },
    // Components reach core through its public entry, so apps load it once.
    external: ["react", "react-dom", "react/jsx-runtime", "@amirjaz/persian-ui/core"],
    banner: { js: '"use client";' },
  },
]);
