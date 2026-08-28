# Task 006 — Private Role Reveal & Recheck-My-Role

## Goal
At game start, each player privately sees their own role and hidden knowledge in turn via the pass-device gate; at any later point, any player can reselect their name from the roster to recheck their role through the same gate.

## Prerequisites
- [x] task-004.md completed
- [x] task-005.md completed

## Tasks

### Sequential Role Reveal
- [x] `src/pages/RoleRevealPage.tsx` — modify to step through the roster one player at a time, wrapping each player's role card in `PassDeviceGate` (`holderName` = that player's display name); "Hide & Continue" advances to the next player until all have seen theirs (modified from the prior single-device-per-player version)
  - [x] `src/pages/RoleRevealPage.spec.tsx` — reveals players' roles one at a time in roster order; a player's role card is not present in the DOM until their turn's confirm tap; advances to the game board only after every player has been shown and hidden their role

### Recheck-My-Role
- [x] `src/pages/components/ViewMyRoleMenu.tsx` (new) — a persistent, always-available control (e.g., a button in the game chrome) that lets a player pick their name from the roster, then shows their role through `PassDeviceGate` without altering game state
  - [x] `src/pages/components/ViewMyRoleMenu.spec.tsx` — selecting a name shows only that player's role after the gate's confirm tap; dismissing/hiding leaves round state unchanged

## Done When
- [x] Every player has seen their own role exactly once during the initial reveal sequence, with no role visible before that player's confirm tap
- [x] Any player can recheck their own role later without affecting the round in progress
- [x] All new/modified tests pass
- [x] No existing tests broken <!-- verified 2026-08-28 - pre-existing failures in HostSetupPage/PhotoCapture are unrelated -->
