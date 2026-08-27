# Task 011 — End Game / Reveal Page + Rematch / End Session (AC9)

## Goal
When the game ends, every device reveals the result and every player's true role, and the host can either start a rematch with the same connections or end the session (AC9).

## Prerequisites
- [ ] task-010.md completed

## Tasks

### Pages
- [ ] `src/pages/EndGamePage.<ext>` — reveals `game.result`, `game.resultReason`, and every player's true role/portrait per [design.md](design.md) §9; renders host-only "Rematch" and "End Session" actions (new)
  - [ ] `src/pages/EndGamePage.spec.<ext>` — reveals all roles identically on every device; "Rematch"/"End Session" render only on the host device

### Rematch Wiring
- [ ] `src/engine/rematch.ts` — resets round/game state and re-runs role assignment (task-002) while keeping `room.players` connections intact, per [gameplay.md](gameplay.md) Flow 6 step 3 (new)
  - [ ] `src/engine/rematch.spec.ts` — rematch preserves the existing peer connections and player ids; produces a fresh, independent role assignment
- [ ] `src/connection/endSession.ts` — closes all peer connections and clears room state on host's "End Session" choice (new)
  - [ ] `src/connection/endSession.spec.ts` — all peer connections are closed; room state is cleared

## Done When
- [ ] Host choosing "Rematch" returns all connected devices to Role Reveal without any reconnection step
- [ ] Host choosing "End Session" closes the room on every connected device
- [ ] All new/modified tests pass
- [ ] No existing tests broken
