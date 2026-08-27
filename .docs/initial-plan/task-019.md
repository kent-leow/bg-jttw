# Task 019 — Full-Playthrough Integration Test

## Goal
An automated test proves a complete game is actually playable end to end through the wired app (task-018), not just through each page's/module's isolated unit tests, closing the gap where every prior task's "Done When" only exercised mocked/simulated pieces in isolation.

## Prerequisites
- [x] task-018.md completed

## Tasks

### Integration Test
- [x] `src/app.integration.spec.tsx` — drives a simulated 6-player game through `App` end to end (see changelog: HostSetupPage's minimum selectable value is 5 joiners, yielding host+5=6 as the smallest real total): host setup, all 5 joiners connect via simulated QR/data-channel handshakes, role reveal, at least one rejected proposal (leader rotation observed as the proxy for the rejection counter, which no page surfaces numerically), one approved proposal through mission resolution, repeated to 3 mission successes, assassination phase, and a guess reaching the matching `GameResult` on every player's rendered `EndGamePage` (new)
- [x] `src/app.integration.spec.tsx` — same driver continued: host clicks rematch and a second game reaches role reveal for all 5 players without any player re-scanning a QR code (edit, same file)
- [x] `src/app.integration.spec.tsx` — a mid-game simulated reload for one non-host player (via `localIdentity`, task-012) restores that player's exact prior page rather than restarting them at Landing (edit, same file)

## Done When
- [x] `src/app.integration.spec.tsx` passes covering AC1, AC2, AC3, AC5, AC6, and AC9 in a single continuous run against the real composed `App`, with no engine/connection/crypto module individually mocked out (fake WebRTC/camera/QR I/O boundaries only)
- [x] All new/modified tests pass
- [x] No existing tests broken

## Changelog
- 2026-08-27: Implemented the full-playthrough integration test. Building it surfaced several real defects in already-completed tasks, fixed here (App.tsx / usePlayerGameState.ts only — no other files edited):
  1. **Player id mismatch (critical)**: host and joiner each independently generated their own random player id with nothing to reconcile them, so `RoomHub.relayToPlayer`/broadcasts addressed to a joiner's id never matched that joiner's own hub registration. Fixed by having the joiner embed its id in the answer payload (alongside the public key), which the host now uses as the authoritative id for that connection.
  2. **`usePlayerGameState`'s role latch**: resolved a player's decrypted role only once ever, silently dropping a rematch's freshly dealt role. Removed the latch so each new direct envelope updates `roleInfo`.
  3. **`GameBoardPage` stuck vote state**: `hasVoted`/`selectedTeam` never reset between rounds (same mounted instance reused across missions and rejected/re-proposed votes), permanently disabling Approve/Reject after the first vote. Fixed by remounting it via a `key` derived from `missionNumber`+`leaderId` in `App.tsx`'s `GameChrome`.
  4. **Rematch not re-showing RoleReveal**: `GameChrome`'s local `roleAcknowledged`/`lastSeenMissionCount` state also needed resetting when a new (differently-referenced) `roleInfo` arrives; fixed via a `useEffect` in `GameChrome`.
  5. Added injectable `generateKeyPair`/`generatePlayerId` overrides to `JoinFlowDependencies` (matching the existing WebRTC/camera DI pattern) so tests can observe/predict a joiner's identity without decoding a rendered QR-code image.
  6. Added minimal reload/rejoin wiring: `JoinFlowInGame` persists `{gameState, roleInfo}` to `localIdentity` on every update; `App`'s `renderRestoredState` now renders a read-only `GameChrome` snapshot from it (previously a permanent "unable to restore" placeholder). Real cross-reload reconnection still requires a fresh WebRTC handshake in production (`checkHostReachable` defaults to none supplied); this restores the *last known page* instantly while that happens, per gameplay.md Flow 7.
  7. Test-environment note: multiple simulated "devices" in one jsdom process share a single `document.body` and a single `localStorage` — the test scopes all queries with `within(container)` and clears `localStorage` before mounting each new instance to keep them independent.
