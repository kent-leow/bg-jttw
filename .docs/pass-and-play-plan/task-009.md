# Task 009 — Private Assassination Pick & End-Game Reveal

## Goal
When good reaches 3 mission successes, the device is passed to the Assassin (without the UI ever naming who that is) for a private target pick, after which the end-game screen reveals every true role and offers rematch or end-session, both purely local to the one device.

## Prerequisites
- [x] task-004.md completed
- [x] task-005.md completed

## Tasks

### Assassination Pick
- [x] `src/pages/AssassinationPage.tsx` — modify: wrap the target-selection grid in `PassDeviceGate` with `holderName={null}` (generic "pass to the Assassin" instruction, never naming them); only the device-holder who self-identifies as the Assassin (via their already-known role from task 006's reveal) proceeds to pick a target
  - [x] `src/pages/AssassinationPage.spec.tsx` — the pass-device interstitial never displays the Assassin's name; the target grid is not present in the DOM until the gate is confirmed; selecting a target calls `onSelectTarget` exactly once

### End-Game & Rematch
- [x] `src/pages/EndGamePage.tsx` — modify: remove the now-inapplicable multi-device "revealed roles may be incomplete on non-host devices" caveat; every role is always available locally via `useLocalGameState`'s role assignments, so the full reveal is always complete
  - [x] `src/pages/EndGamePage.spec.tsx` — every player's true role is shown, sourced directly from the local role assignments; rematch and end-session actions still fire their callbacks unchanged

## Done When
- [x] The Assassination pick never exposes the Assassin's identity to bystanders before the pick is made <!-- verified 2026-08-28 -->
- [x] The end-game reveal always shows every player's true role, correctly, on the single device <!-- verified 2026-08-28 -->
- [x] All new/modified tests pass <!-- 14/14 tests pass: 4 AssassinationPage, 4 EndGamePage, 6 PassDeviceGate -->
- [x] No existing tests broken <!-- PreExisting PhotoCapture failures, not related to task-009 changes -->
