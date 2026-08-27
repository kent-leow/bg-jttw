# Task 001 — Project Scaffolding & Tooling

## Goal
A static, Vercel-deployable frontend project skeleton exists with the directory layout, build tooling, and test runner that every later task builds on.

## Prerequisites
- [x] None

## Tasks

### Tooling
- [x] `package.json` — initialize project; pick and pin `<TBD: frontend framework/bundler, e.g. Vite + TypeScript>` and a unit test runner `<TBD: e.g. Vitest>`, all versions pinned (new)
- [x] `tsconfig.json` — strict TypeScript config (new)
- [x] `vercel.json` (or bundler static-export config) — configure static-only output, no serverless functions/API routes (new)
- [x] `.eslintrc`/`.prettierrc` (or equivalent) — lint/format rules matching guidelines (new)

### Project Structure
- [x] `src/engine/` — folder for framework-agnostic game-logic modules (new)
- [x] `src/connection/` — folder for WebRTC/QR connection-service modules (new)
- [x] `src/crypto/` — folder for per-player secret-info encryption modules (new)
- [x] `src/state/` — folder for local-storage identity/persistence modules (new)
- [x] `src/i18n/` — folder for translation infra and locale files (new)
- [x] `src/theme/` — folder for ink-wash design system and three.js scene modules (new)
- [x] `src/pages/` — folder for page-level UI components (new)
- [x] `src/main.<ext>` — app entry point rendering a placeholder landing route (new)
  - [x] `src/main.spec.<ext>` — app entry point mounts without throwing

### CI/Build Verification
- [x] `README.md` — document install/dev/build/test commands (new)

## Done When
- [x] `npm install` (or equivalent) completes cleanly
- [x] Dev server starts and serves a placeholder page
- [x] Production build produces a static-only output directory with no server/API routes
- [x] Test runner executes and passes the placeholder test
- [x] All new/modified tests pass
- [x] No existing tests broken
