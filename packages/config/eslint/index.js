/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-type-checked",
    "prettier",
  ],
  plugins: ["@typescript-eslint"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  rules: {
    // TypeScript
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/consistent-type-imports": [
      "error",
      { prefer: "type-imports", fixStyle: "inline-type-imports" },
    ],
    "@typescript-eslint/no-non-null-assertion": "warn",

    // General
    "no-console": ["warn", { allow: ["warn", "error"] }],
    "prefer-const": "error",
    "no-var": "error",
  },
  overrides: [
    // Allow require() in config files
    {
      files: ["*.config.js", "*.config.ts", "*.config.cjs"],
      rules: {
        "@typescript-eslint/no-var-requires": "off",
      },
    },
  ],
  ignorePatterns: [
    "node_modules/",
    "dist/",
    ".next/",
    ".expo/",
    "coverage/",
    "*.generated.ts",
  ],
};
