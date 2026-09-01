import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";

const ALL_GLOBALS = {
  // Browser
  window:          "readonly",
  document:        "readonly",
  console:         "readonly",
  alert:           "readonly",
  confirm:         "readonly",
  prompt:          "readonly",
  setTimeout:      "readonly",
  clearTimeout:    "readonly",
  setInterval:     "readonly",
  clearInterval:   "readonly",
  localStorage:    "readonly",
  sessionStorage:  "readonly",
  fetch:           "readonly",
  FormData:        "readonly",
  URLSearchParams: "readonly",
  URL:             "readonly",
  File:            "readonly",
  FileReader:      "readonly",
  Blob:            "readonly",
  Event:           "readonly",
  MutationObserver:"readonly",
  navigator:       "readonly",
  location:        "readonly",
  AbortController: "readonly",
  AbortSignal:     "readonly",
  Notification:         "readonly",
  IntersectionObserver: "readonly",
  performance:     "readonly",
  requestAnimationFrame: "readonly",
  cancelAnimationFrame:  "readonly",
  crypto:          "readonly",
  // Node (vite.config, tailwind.config, postcss.config)
  __dirname:       "readonly",
  __filename:      "readonly",
  process:         "readonly",
  module:          "readonly",
  require:         "readonly",
  exports:         "writable",
  Buffer:          "readonly",
  global:          "readonly",
};

export default [
  // Ignores globales
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "build/**",
      ".vite/**",
    ],
  },

  // Archivos JS/JSX regulares
  {
    files: ["**/*.{js,jsx}"],
    plugins: { react: reactPlugin, "react-hooks": reactHooksPlugin },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: ALL_GLOBALS,
    },
    settings: { react: { version: "detect" } },
    rules: {
      "react/react-in-jsx-scope": "off",
      "react/prop-types":         "off",
      // Sin esto, no-unused-vars no reconoce que un componente/identificador
      // usado solo dentro de JSX (ej. <Foo />) está "en uso".
      "react/jsx-uses-vars":  "error",
      "react-hooks/rules-of-hooks":   "error",
      "react-hooks/exhaustive-deps":  "warn",
      "no-empty":       ["error", { allowEmptyCatch: true }],
      "no-unused-vars": ["warn",  { varsIgnorePattern: "^_", argsIgnorePattern: "^_" }],
      "no-undef":       "error",
      "no-console":     "off",
    },
  },

  // Config files (CommonJS)
  {
    files: ["tailwind.config.js", "postcss.config.js", "postcss.config.cjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",
      globals: ALL_GLOBALS,
    },
    rules: {
      "no-undef": "error",
    },
  },
];
