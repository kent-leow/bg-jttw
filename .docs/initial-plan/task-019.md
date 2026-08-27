# Task 019 — Full-Playthrough Integration Test

## Goal
An automated test proves a complete game is actually playable end to end through the wired app (task-018), not just through each page's/module's isolated unit tests, closing the gap where every prior task's "Done When" only exercised mocked/simulated pieces in isolation.

## Prerequisites
- [ ] task-018.md completed

## Tasks

### Integration Test
- [ ] `src/app.integration.spec.tsx` — drives a simulated 5-player game through `App` end to end: host setup with 5 players, all 5 join via simulated QR/data-channel handshakes, role reveal, at least one rejected proposal (leader rotation + rejection counter visible), one approved proposal through mission resolution, repeated to 3 mission successes, assassination phase, and a correct/incorrect guess reaching the matching `GameResult` on every player's rendered `EndGamePage` (new)
- [ ] `src/app.integration.spec.tsx` — same driver continued: host clicks rematch and a second game reaches role reveal for all 5 players without any player re-scanning a QR code (edit, same file)
- [ ] `src/app.integration.spec.tsx` — a mid-game simulated reload for one non-host player (via `localIdentity`, task-012) restores that player's exact prior page rather than restarting them at Landing (edit, same file)

## Done When
- [ ] `src/app.integration.spec.tsx` passes covering AC1, AC2, AC3, AC5, AC6, and AC9 in a single continuous run against the real composed `App`, with no engine/connection/crypto module individually mocked out (fake WebRTC/camera/QR I/O boundaries only)
- [ ] All new/modified tests pass
- [ ] No existing tests broken
