# Task 012 — Rejoin & Local Identity Persistence (AC6)

## Goal
A player whose device reloads mid-game is recognized by their previously assigned identity and rejoins the room in their prior state, per [gameplay.md](gameplay.md) Flow 7.

## Prerequisites
- [ ] task-005.md completed
- [ ] task-007.md completed

## Tasks

### Persistence
- [ ] `src/state/localIdentity.ts` — reads/writes `{ playerId, roomId, lastKnownState }` to this device's local browser storage (new)
  - [ ] `src/state/localIdentity.spec.ts` — round-trips stored identity across a simulated reload; returns `null` when no identity is stored

### Rejoin Flow
- [ ] `src/connection/reestablishConnection.ts` — attempts to reconnect a stored `playerId` to `roomId` via the host hub per Flow 7 step 3.1 (new)
  - [ ] `src/connection/reestablishConnection.spec.ts` — succeeds and restores current game/round state when the host is reachable; returns `reconnected == false` and surfaces an explicit "host unreachable" message when it is not
- [ ] `src/pages/AppRoot.<ext>` — on load, checks `localIdentity` first; routes to rejoin flow if found, otherwise to the normal new-player flow (Flow 2) (new)
  - [ ] `src/pages/AppRoot.spec.<ext>` — no stored identity routes to Join/Host entry; stored identity + reachable host restores the correct in-progress page; stored identity + unreachable host shows the reconnect-failed message

## Done When
- [ ] Simulated page reload for a mid-game player restores their exact prior screen/state without re-scanning any QR code
- [ ] All new/modified tests pass
- [ ] No existing tests broken
