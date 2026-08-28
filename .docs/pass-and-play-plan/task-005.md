# Task 005 — Local Game Orchestrator

## Goal
A transport-free orchestrator drives the same `engine/roundLoop` state machine previously wired through `HostOrchestrator`/`RoomHub`, but purely in local React state on one device — no encryption, no broadcast — exposing the actions and current state the UI needs for every phase.

## Prerequisites
- [x] task-002.md completed

## Tasks

### Orchestrator Hook
- [x] `src/state/useLocalGameState.ts` (new, replaces the deleted `usePlayerGameState.ts`) — wraps `assignRoles`, `buildRolePool`, `getRoleSplit`, `computeHiddenKnowledge`, and `roundLoop`'s `createInitialRoundLoopState`/`proposeTeam`/`submitVotesAndAdvance`/`submitMissionCardsAndAdvance`/`resolveAssassinationAndFinish` directly (no crypto, no `RoomHub`); persists to `localGameSnapshot` after every state change (via task 002); exposes: current `RoundLoopState`, per-player role/hidden-knowledge lookup, and action functions (`startGame(roster)`, `proposeTeam`, `castVote`, `submitMissionCard`, `submitAssassinationGuess`, `rematch`, `endSession`)
  - [x] `src/state/useLocalGameState.spec.ts` (new) — `startGame` deals roles and initializes round state for a given roster; `proposeTeam`/`castVote`/`submitMissionCard`/`submitAssassinationGuess` advance the round loop identically to the existing `roundLoop` unit tests; every action persists a snapshot; `rematch` re-deals roles for the same roster; `endSession` clears the snapshot

## Done When
- [x] The full round loop (proposal → vote → mission → repeat → win condition → assassination) runs correctly against this hook with no networking code involved <!-- verified 2026-08-28 -->
- [x] All new/modified tests pass <!-- verified 2026-08-28 -->
- [x] No existing tests broken <!-- verified 2026-08-28 -->
