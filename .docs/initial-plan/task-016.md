# Task 016 — Host Game Orchestrator

## Goal
A single host-side module drives the whole authoritative game state machine — role assignment, encrypted secret delivery, the team-proposal/vote/mission round loop, assassination, and rematch — by composing the existing pure `engine/` functions with `RoomHub` broadcasts and per-player encrypted relays; today every engine function exists in isolation and nothing calls them in sequence against real connected peers.

## Prerequisites
- [x] task-015.md completed

## Tasks

### Orchestrator
- [x] `src/connection/hostOrchestrator.ts` — on `startGame(playerIds)`: builds the role pool, calls `assignRoles`, computes `computeHiddenKnowledge`, encrypts each player's `{ role, hiddenKnowledge }` via `encryptForPlayer` using that player's known public key, and relays each envelope to its player via `roomHub.relayToPlayer` (new)
  - [x] `src/connection/hostOrchestrator.spec.ts` — each connected player receives an envelope decryptable only with their own private key; role/hidden-knowledge contents match `assignRoles`/`computeHiddenKnowledge` output
- [x] `src/connection/hostOrchestrator.ts` — round-loop actions: `proposeTeam`, `castVote` (broadcasts live "x/y voted" progress via `roomHub.broadcastPublicState`, resolves via `resolveVotes`/`applyProposalVoteOutcome` once all expected votes are in), `submitMissionCard` (broadcasts the revealed result via `resolveMission` once the full team has submitted), advancing `RoundLoopState` via `roundLoop.ts` helpers after each resolution (edit, same file)
  - [x] `src/connection/hostOrchestrator.spec.ts` — vote progress broadcast reflects each cast vote; mission result is broadcast only after every team member has submitted, never before; rejected proposals rotate the leader and increment the rejection counter per `rejectionCounter.ts`
- [x] `src/connection/hostOrchestrator.ts` — game-end actions: on reaching 3 mission successes, broadcasts an `Assassination` phase transition; `submitAssassinationGuess` resolves via `resolveAssassination` and broadcasts the final `GameResult` and all revealed roles; `requestRematch` calls `rematch.ts` and re-broadcasts a fresh initial state (edit, same file)
  - [x] `src/connection/hostOrchestrator.spec.ts` — 3rd mission success transitions to `Assassination` before any win is declared; correct/incorrect assassin guess broadcasts the matching `GameResult`; 5 consecutive rejected proposals broadcasts an evil win without reaching mission resolution; rematch broadcasts new encrypted role envelopes to the same connected players without any reconnection call

## Done When
- [x] A simulated host with 5–10 connected peers can be driven through role assignment, a full round loop, an evil-via-rejections win, a mission-failure win, and an assassination-phase win, each ending in the correct broadcast `GameResult` and role reveal
- [x] All new/modified tests pass
- [x] No existing tests broken
