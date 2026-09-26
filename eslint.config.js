import js from "@eslint/js";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist", "coverage"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [js.configs.recommended, tseslint.configs.recommended],
  },
  {
    files: ["src/react/**/*.{ts,tsx}", "test/**/*.tsx", "playground/**/*.tsx"],
    extends: [reactHooks.configs.flat["recommended-latest"], jsxA11y.flatConfigs.recommended],
    languageOptions: { globals: globals.browser },
    rules: {
      // Only real DOM autofocus; our calendar's `autoFocus` prop moves focus into
      // the date picker dialog when it opens, as the WAI-ARIA pattern requires.
      "jsx-a11y/no-autofocus": ["error", { ignoreNonDOM: true }],
    },
  },
  {
    files: ["scripts/**/*.mjs", "*.config.{js,ts}"],
    extends: [js.configs.recommended],
    languageOptions: { globals: globals.node },
  },
]);
