import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}", "lib/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "Literal[value=/Sprint\\s*\\d+/i]",
          message:
            "Évitez d’exposer des références internes de sprint dans les libellés visibles par l’utilisateur.",
        },
        {
          selector: "TemplateElement[value.raw=/Sprint\\s*\\d+/i]",
          message:
            "Évitez d’exposer des références internes de sprint dans les libellés visibles par l’utilisateur.",
        },
        {
          selector: "JSXText[value=/Sprint\\s*\\d+/i]",
          message:
            "Évitez d’exposer des références internes de sprint dans les libellés visibles par l’utilisateur.",
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
