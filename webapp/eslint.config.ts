import eslint from "@eslint/js";
import { defineConfig } from "eslint/config";
import prettier from "eslint-config-prettier";
import vue from "eslint-plugin-vue";
import tseslint from "typescript-eslint";

export default defineConfig(
  {
    ignores: ["coverage/**", "dist/**", "node_modules/**", "reports/**", "src/generated/**"],
  },
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  ...vue.configs["flat/recommended"],
  {
    files: ["**/*.ts", "**/*.vue"],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: [".vue"],
      },
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-confusing-void-expression": "off",
      "vue/block-lang": ["error", { script: { lang: "ts" } }],
      "vue/component-name-in-template-casing": ["error", "PascalCase"],
      "vue/multi-word-component-names": "off",
    },
  },
  {
    files: ["vite.config.ts", "vitest.config.ts", "eslint.config.ts", "scripts/**/*.ts"],
    rules: {
      "@typescript-eslint/no-console": "off",
    },
  },
  prettier,
);
