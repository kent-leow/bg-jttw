# Task 017 — Player Client Game State Hook

## Goal
A joining (non-host) player's device turns `RoomHub` broadcasts and its own encrypted relay into live page props, and sends its actions back to the host — today every page (`LobbyPage` excepted) only receives props from a caller that doesn't exist yet, so a joiner has no way to see game state update or act on it.

## Prerequisites
- [ ] task-016.md completed

## Tasks

### State Hook
- [ ] `src/state/usePlayerGameState.ts` — subscribes to `RoomHub` broadcast messages for this player and tracks the latest public `RoundLoopState`-derived view (players, phase, leader, votes progress, mission results) (new)
  - [ ] `src/state/usePlayerGameState.spec.ts` — reflects each successive broadcast; unsubscribes from the hub on unmount
- [ ] `src/state/usePlayerGameState.ts` — decrypts this player's own role/hidden-knowledge envelope via `decryptOwnPayload` as soon as a direct relay message addressed to them arrives, exposing it once (edit, same file)
  - [ ] `src/state/usePlayerGameState.spec.ts` — decrypted role/hidden-knowledge becomes available only after this player's own envelope arrives, not another player's
- [ ] `src/state/usePlayerGameState.ts` — exposes action senders (`proposeTeam`, `castVote`, `submitMissionCard`, `submitAssassinationGuess`) that transmit through the connected transport to the host orchestrator (edit, same file)
  - [ ] `src/state/usePlayerGameState.spec.ts` — each action sender transmits a correctly shaped message that the host orchestrator (task-016) accepts

## Done When
- [ ] A simulated non-host player's hook state updates in response to every host broadcast and correctly decrypts only its own secret envelope
- [ ] All new/modified tests pass
- [ ] No existing tests broken
