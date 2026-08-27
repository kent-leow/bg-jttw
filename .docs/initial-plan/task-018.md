# Task 018 — App Composition Root & Routing

## Goal
Opening the deployed site presents the real Landing page and lets a host or joiner play a full game end to end; today `src/App.tsx` is still the placeholder text ("Landing page arrives in a later task") and none of `AppRoot`/`LandingPage`/`HostSetupPage`/`JoinPage`/`LobbyPage`/`RoleRevealPage`/`GameBoardPage`/`MissionResultPage`/`AssassinationPage`/`EndGamePage` are ever mounted by the real entry point — every one of them only exists behind its own isolated unit test.

## Prerequisites
- [ ] task-016.md completed
- [ ] task-017.md completed
- [ ] task-012.md completed
- [ ] task-013.md completed
- [ ] task-014.md completed

## Tasks

### Composition Root
- [ ] `src/App.tsx` — replace the placeholder with a page-router driven by a phase derived from local role (host/joiner, via `localIdentity`) and the current `RoundLoopState`/`AppRootStatus`: `AppRoot` → `LandingPage` → `HostSetupPage`/`JoinPage` → `LobbyPage` → `RoleRevealPage` → `GameBoardPage` → `MissionResultPage` → `AssassinationPage` (evil-win/rejection paths skip straight to `EndGamePage`) → `EndGamePage` (edit)
  - [ ] `src/App.spec.tsx` — replaces `src/main.spec.tsx`'s placeholder-only assertion: choosing Host from Landing reaches `HostSetupPage`; choosing Join reaches `JoinPage`; a completed lobby advances to `RoleRevealPage`
- [ ] `src/App.tsx` — for the host path, construct a `hostOrchestrator` (task-016) bound to a `RoomHub` and wire `HostSetupPage`/`GameBoardPage`/`AssassinationPage`/`EndGamePage` callback props to its actions (edit, same file)
  - [ ] `src/App.spec.tsx` — a host completing role assignment sees `RoleRevealPage` render before `GameBoardPage`
- [ ] `src/App.tsx` — for the joiner path, wire `usePlayerGameState` (task-017) output into the same page sequence so a joiner's screen advances from the same broadcasts the host emits (edit, same file)
  - [ ] `src/App.spec.tsx` — a joiner's rendered page advances when a simulated host broadcast changes phase, without any local "next" action available to them
- [ ] `src/main.tsx` — no longer needs `main.spec.tsx`'s placeholder mount assertion once `App.spec.tsx` supersedes it; remove `src/main.spec.tsx` (delete) and confirm `src/App.spec.tsx` covers a bare mount

## Done When
- [ ] Running the dev server and manually completing Host Setup → role reveal → one full round → end game reveal works in a real browser with two tabs/devices sharing a QR handshake (manual verification, documented in the PR/commit)
- [ ] `src/App.tsx` no longer contains the "Landing page arrives in a later task" placeholder text
- [ ] All new/modified tests pass
- [ ] No existing tests broken
