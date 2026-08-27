# Task 001 — Project Scaffolding & Tooling

## Goal
A static, Vercel-deployable frontend project skeleton exists with the directory layout, build tooling, and test runner that every later task builds on.

## Prerequisites
- [ ] None

## Tasks

### Tooling
- [ ] `package.json` — initialize project; pick and pin `<TBD: frontend framework/bundler, e.g. Vite + TypeScript>` and a unit test runner `<TBD: e.g. Vitest>`, all versions pinned (new)
- [ ] `tsconfig.json` — strict TypeScript config (new)
- [ ] `vercel.json` (or bundler static-export config) — configure static-only output, no serverless functions/API routes (new)
- [ ] `.eslintrc`/`.prettierrc` (or equivalent) — lint/format rules matching guidelines (new)

### Project Structure
- [ ] `src/engine/` — folder for framework-agnostic game-logic modules (new)
- [ ] `src/connection/` — folder for WebRTC/QR connection-service modules (new)
- [ ] `src/crypto/` — folder for per-player secret-info encryption modules (new)
- [ ] `src/state/` — folder for local-storage identity/persistence modules (new)
- [ ] `src/i18n/` — folder for translation infra and locale files (new)
- [ ] `src/theme/` — folder for ink-wash design system and three.js scene modules (new)
- [ ] `src/pages/` — folder for page-level UI components (new)
- [ ] `src/main.<ext>` — app entry point rendering a placeholder landing route (new)
  - [ ] `src/main.spec.<ext>` — app entry point mounts without throwing

### CI/Build Verification
- [ ] `README.md` — document install/dev/build/test commands (new)

## Done When
- [ ] `npm install` (or equivalent) completes cleanly
- [ ] Dev server starts and serves a placeholder page
- [ ] Production build produces a static-only output directory with no server/API routes
- [ ] Test runner executes and passes the placeholder test
- [ ] All new/modified tests pass
- [ ] No existing tests broken
