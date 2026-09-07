import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Disables ESLint rules that conflict with Prettier formatting.
  prettier,
  {
    rules: {
      // Rules.md section 1: `any` is not allowed unless genuinely unavoidable.
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Prisma-generated client is not hand-written source.
    "lib/generated/**",
  ]),
]);

export default eslintConfig;
