# Task 002 — Local Game Snapshot Persistence & Resume

## Goal
A single-device game in progress can survive a page reload: the roster, roles, and round state are saved to local storage as the game proceeds and are restored automatically on reload, without any host-reachability or per-device-identity concept.

## Prerequisites
- [ ] task-001.md completed

## Tasks

### Persistence
- [ ] `src/state/localGameSnapshot.ts` (new) — `readSnapshot()`, `writeSnapshot(snapshot)`, `clearSnapshot()` against a single local-storage key; snapshot shape holds the roster, dealt role assignments, and current `RoundLoopState` (from `src/engine/roundLoop.ts`)
  - [ ] `src/state/localGameSnapshot.spec.ts` (new) — round-trips a snapshot through write/read; returns `null` on missing/corrupt data; `clearSnapshot` removes it

### App Entry Resume Flow
- [ ] `src/pages/AppRoot.tsx` (new, replaces deleted version) — on mount, reads the snapshot; renders `renderNewSetup()` if none exists, or `renderResumedGame(snapshot)` if one does
  - [ ] `src/pages/AppRoot.spec.tsx` (new) — renders new-setup path when no snapshot exists; renders resumed-game path with the stored snapshot when one exists; corrupt/missing snapshot falls back to new-setup without throwing

## Done When
- [ ] Reloading the page mid-game (simulated in tests via a pre-populated snapshot) restores the prior roster/roles/round state instead of restarting setup
- [ ] Starting a new game with no prior snapshot goes straight to setup
- [ ] All new/modified tests pass
- [ ] No existing tests broken
