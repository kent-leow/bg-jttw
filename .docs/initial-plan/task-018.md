# Task 018 — App Composition Root & Routing

## Goal
Opening the deployed site presents the real Landing page and lets a host or joiner play a full game end to end; today `src/App.tsx` is still the placeholder text ("Landing page arrives in a later task") and none of `AppRoot`/`LandingPage`/`HostSetupPage`/`JoinPage`/`LobbyPage`/`RoleRevealPage`/`GameBoardPage`/`MissionResultPage`/`AssassinationPage`/`EndGamePage` are ever mounted by the real entry point — every one of them only exists behind its own isolated unit test.

## Prerequisites
- [x] task-016.md completed
- [x] task-017.md completed
- [x] task-012.md completed
- [x] task-013.md completed
- [x] task-014.md completed

## Tasks

### Composition Root
- [x] `src/App.tsx` — replace the placeholder with a page-router driven by a phase derived from local role (host/joiner, via `localIdentity`) and the current `RoundLoopState`/`AppRootStatus`: `AppRoot` → `LandingPage` → `HostSetupPage`/`JoinPage` → `LobbyPage` → `RoleRevealPage` → `GameBoardPage` → `MissionResultPage` → `AssassinationPage` (evil-win/rejection paths skip straight to `EndGamePage`) → `EndGamePage` (edit)
  - [x] `src/App.spec.tsx` — replaces `src/main.spec.tsx`'s placeholder-only assertion: choosing Host from Landing reaches `HostSetupPage`; choosing Join reaches `JoinPage`; a completed lobby advances to `RoleRevealPage`
- [x] `src/App.tsx` — for the host path, construct a `hostOrchestrator` (task-016) bound to a `RoomHub` and wire `HostSetupPage`/`GameBoardPage`/`AssassinationPage`/`EndGamePage` callback props to its actions (edit, same file)
  - [x] `src/App.spec.tsx` — a host completing role assignment sees `RoleRevealPage` render before `GameBoardPage`
- [x] `src/App.tsx` — for the joiner path, wire `usePlayerGameState` (task-017) output into the same page sequence so a joiner's screen advances from the same broadcasts the host emits (edit, same file)
  - [x] `src/App.spec.tsx` — a joiner's rendered page advances when a simulated host broadcast changes phase, without any local "next" action available to them
- [x] `src/main.tsx` — no longer needs `main.spec.tsx`'s placeholder mount assertion once `App.spec.tsx` supersedes it; remove `src/main.spec.tsx` (delete) and confirm `src/App.spec.tsx` covers a bare mount

## Done When
- [ ] Running the dev server and manually completing Host Setup → role reveal → one full round → end game reveal works in a real browser with two tabs/devices sharing a QR handshake <!-- blocked: no GUI browser/camera available in this automated environment; covered instead by App.spec.tsx driving the same flow with fake WebRTC/camera I/O -->
- [x] `src/App.tsx` no longer contains the "Landing page arrives in a later task" placeholder text
- [x] All new/modified tests pass
- [x] No existing tests broken

## Changelog
- 2026-08-27: Implemented App.tsx composition root wiring Host/Join flows through HostOrchestrator/usePlayerGameState. Discovered and worked around two pre-existing integration gaps from earlier tasks (fixed only within App.tsx, no other files edited):
  1. HostSetupPage's seat counter (task-006) counts joiner connections only, not the host's own seat, contradicting gameplay.md Flow 1 step 5. Compensated in App.tsx's onStartGame handler (+1) rather than editing HostSetupPage.tsx/its passing spec.
  2. RoomHub (task-005) supports only one registered peer per playerId; LobbyPage's (task-007) and usePlayerGameState's (task-017) own hub subscriptions collided when both used the same player id for the same device, silently dropping the host's/joiner's own role envelope. Fixed by giving LobbyPage a distinct suffixed self-id in App.tsx.
  3. Known limitation: EndGamePage's full role reveal is complete only on the host's own device; non-host devices only know their own role, since PublicGameStateView never carries other players' secret roles (would require extending hostOrchestrator.ts/usePlayerGameState.ts broadcast schema, out of this task's file scope).
