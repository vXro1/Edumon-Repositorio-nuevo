# Copilot Instructions for Edumon-Repositorio-nuevo

This file helps future Copilot/Copilot CLI sessions understand how to build, test, lint, and navigate the repository.

---

## Build, test, and lint commands

- Install deps: `npm install`
- Development server: `npm run dev` (runs `vite`)
- Build: `npm run build` (runs `vite build`)
- Preview build: `npm run preview` (runs `vite preview`)
- Lint: `npm run lint` (runs `eslint .`)
- Tests (simple Node test runner): `npm run test` (runs `node ./src/routes/run-tests.js`)

Running a focused/single check (no formal test runner):
- Example: check admin permissions directly:
  - `node -e "const {getPermissionsForRole}=require('./src/security/roleMatrix'); console.log(getPermissionsForRole('admin').includes('MANAGE_USERS') ? 'OK' : 'FAIL')"`
- To add single-test support, prefer converting the existing `src/routes/run-tests.js` to accept an argument or adopt a small test runner like Vitest/Jest.

---

## High-level architecture (big picture)

- Tooling: Vite + React (React 19) is the primary stack (see `package.json`). TailwindCSS + PostCSS for styles.
- Entry point: `src/main.jsx` mounts the app and imports global styles and fonts.
- App root: `src/App.jsx` composes context providers (AuthProvider, SearchProvider) and renders `AppRoutes`.
- Routing: client routing lives under `src/routes` (see `src/routes/AppRoutes`), using `react-router-dom`.
- Features: modular feature directories under `src/features` (e.g., auth) provide domain logic and context providers.
- State: zustand is used for app state where applicable (`src/store` / `src/features/*`).
- Services & utils: `src/services`, `src/lib`, and `src/utils` contain external API wrappers, helpers and shared logic.
- Security: permission model and role matrix are implemented under `src/security` (exports used by small test runner).
- Static & assets: `src/assets`, `src/styles` (includes Tailwind config and Edumon-specific CSS components).

Note: README contains Next.js template text; the actual project uses Vite + React (follow `package.json` scripts).

---

## Key conventions and patterns specific to this repo

- Lightweight test approach: tests are a plain Node script (`src/routes/run-tests.js`) with asserts; no test framework installed. Keep tests small or migrate to a standard test runner for richer tooling.
- Feature scaffolding: each feature folder commonly contains `components`, `context` (AuthContext pattern used), and service hooks. Look for `features/<name>/context` for provider patterns.
- Route conventions: `src/routes` mixes route components and route helpers. Prefer updating `AppRoutes` for navigation changes.
- Fonts and CSS: fonts are imported from `@fontsource` in `src/main.jsx` and additional CSS lives in `src/styles/Edumonstylecomponents.css`.
- Dev-only utilities: `src/main.jsx` conditionally imports `./utils/testApi` under `import.meta.env.DEV` — useful for local mocks.
- Environment files: `.env` and `.env.example` exist; prefer `.env` for local secrets and do not commit sensitive values.

---

## Existing docs & AI config scan

- README.md: basic getting-started notes (contains Next.js boilerplate remnants).
- No CLAUDE.md, AGENTS.md, .cursorrules, .windsurfrules, CONVENTIONS.md, AIDER_CONVENTIONS.md, or .clinerules were found.
- There is a `.github/modernize/` directory with migration plans and summaries; review those for recent repo changes.

---

## When updating this file

- Update when architecture, test strategy, or scripts change. Keep commands in sync with `package.json`.
- If the project adopts Playwright/Vitest/Jest or CI test runners, add the exact run/debug commands and any MCP server hints.

---

(End of Copilot instructions)
