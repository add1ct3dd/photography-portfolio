import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  // Global ignore patterns
  {
    ignores: [
      "node_modules/",
      "_site/",
      "assets/js/**",      // Generated JavaScript files from TypeScript
    ],
  },
  // JavaScript configuration
  {
    files: ["**/*.{js,mjs,cjs}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: {
      globals: {
        ...globals.browser,
        browser: "readonly",    // Global from browser.min.js
        breakpoints: "readonly", // Global from breakpoints.min.js
        EXIF: "readonly",        // Global from exif.js
        icons: "readonly",       // Global from icons.js
      },
    },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
  // TypeScript configuration
  {
    files: ["assets/ts/**/*.ts"],
    extends: [...tseslint.configs.recommended],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "warn", // Allow any but warn
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
  // Gulp configuration (Node.js environment)
  {
    files: ["gulpfile.mjs"],
    languageOptions: {
      globals: globals.node,
    },
  },
]);
