# Task 010 — End-to-End App Wiring, i18n, & Docs

## Goal
`App.tsx` assembles setup → role reveal → round loop → assassination → end-game entirely through `useLocalGameState` and the pass-device components from tasks 002–009, with no leftover WebRTC/crypto wiring, updated bilingual strings, and refreshed docs — a full game is playable start to finish on one device.

## Prerequisites
- [ ] task-002.md completed
- [ ] task-003.md completed
- [ ] task-004.md completed
- [ ] task-005.md completed
- [ ] task-006.md completed
- [ ] task-007.md completed
- [ ] task-008.md completed
- [ ] task-009.md completed

## Tasks

### App Assembly
- [ ] `src/App.tsx` — modify: replace `HostOrchestrator`/`RoomHub`/crypto wiring and `dispatchToOrchestrator`/`bridgeTransportIntoLocalHub`/key-export helpers with `useLocalGameState`-driven wiring; `GameChrome` renders role reveal, `ViewMyRoleMenu` entry point, game board (proposal/voting/mission sequence), mission result, assassination, and end-game purely from local state (modified)
  - [ ] `src/App.spec.tsx` — a full game (setup → role reveal → several rounds → win condition → end-game) can be driven end-to-end on one simulated device
- [ ] `src/app.integration.spec.tsx` — update to reflect the single-device flow (no second simulated device/transport)

### Localization
- [ ] `src/i18n/locales/en.json` — remove QR/join/host-scan-specific keys (`hostSetup.qrInstruction`, `hostSetup.scanInstruction`, `hostSetup.scanReply`, `hostSetup.connectionFailed`, `hostSetup.invalidReply`, `joinPage.*`, `landing.joinGame`); add keys for roster setup (name/photo entry), pass-device gate ("Pass to {name}", "Tap when ready", "Hide & Continue"), recheck-my-role menu, and the generic Assassin pass instruction
- [ ] `src/i18n/locales/zh.json` — mirror the same key additions/removals
  - [ ] `src/i18n/localeParity.spec.ts` — existing parity test continues to pass against the updated key sets

### Docs
- [ ] `README.md` — update Structure section: `src/connection/`/`src/crypto/` bullets removed; note the single-device pass-and-play model
- [ ] `.docs/initial-plan/plan.md` — add a note pointing to `.docs/pass-and-play-plan/plan.md` as the superseding pivot for AC1–AC3/AC6 (no rewrite of the original content, just a pointer)

## Done When
- [ ] A complete game can be played start to finish (setup, role reveal, N rounds, win condition, assassination if applicable, end-game reveal, rematch) on a single simulated device in the integration test
- [ ] No component still imports anything from the deleted `src/connection/`/`src/crypto/` folders
- [ ] All new/modified tests pass
- [ ] No existing tests broken
