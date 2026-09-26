import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Dev-only playground: `pnpm dev`. Not part of the published package.
export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  plugins: [react()],
  resolve: {
    alias: {
      "@amirjaz/persian-ui/core": fileURLToPath(new URL("../src/core/index.ts", import.meta.url)),
    },
  },
  server: { port: 5199 },
});
