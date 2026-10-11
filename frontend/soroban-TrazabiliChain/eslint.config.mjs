import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "next-env.d.ts",
    "packages/hello_world/**",
  ]),
  // Bloque con reglas y opciones recomendadas adicionales
  {
    linterOptions: {
      reportUnusedDisableDirectives: "warn", // Advierte sobre comentarios eslint-disable que ya no son necesarios
    },
    rules: {
      // Buenas prácticas recomendadas para TypeScript y React
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
  prettier,
]);
