import reactPlugin from "eslint-plugin-react";

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
      "src/_archive_*/**",
      "src/_archive_auth_components/**",
      "src/_archive_layouts/**",
    ],
  },

  // Archivos JS/JSX regulares
  {
    files: ["**/*.{js,jsx}"],
    plugins: { react: reactPlugin },
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
