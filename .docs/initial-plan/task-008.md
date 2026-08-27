# Task 008 — Role Reveal Page

## Goal
Each player's device privately reveals only that player's own role and hidden knowledge, decrypted locally, with nothing readable by the host or other players (AC3, AC4 role delivery).

## Prerequisites
- [x] task-005.md completed
- [x] task-007.md completed

## Tasks

### Wiring
- [x] `src/pages/RoleRevealPage.<ext>` — on game start, decrypts this device's role blob via `decryptOwnPayload()`, then renders the assigned character portrait, bilingual role name, and any hidden-knowledge list per [design.md](design.md) §5 (new)
  - [x] `src/pages/RoleRevealPage.spec.<ext>` — renders only the current device's own role/hidden knowledge; a payload encrypted for a different player id never renders on this device (asserts decrypt failure is handled, not thrown to the UI)

## Done When
- [x] Simulated multi-device test confirms each device shows a distinct role and only its own hidden knowledge
- [x] All new/modified tests pass
- [x] No existing tests broken
