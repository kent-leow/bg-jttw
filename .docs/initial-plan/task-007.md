# Task 007 — Lobby / Waiting Room Page

## Goal
Every connected player sees a live, updating player list while seats fill, and the host gains a "Start Game" action once all seats are filled (AC1 completion, [gameplay.md](gameplay.md) Flow 2 step 2).

## Prerequisites
- [x] task-005.md completed
- [x] task-006.md completed

## Tasks

### Pages
- [x] `src/pages/LobbyPage.<ext>` — renders connected players as character-silhouette portrait chips per [design.md](design.md) §4; subscribes to `roomHub` public broadcasts to update the list live; host-only "Start Game" button (new)
  - [x] `src/pages/LobbyPage.spec.<ext>` — portrait row grows as `roomHub` emits new-player events; "Start Game" is disabled until `room.players.length == room.playerCount`; "Start Game" is not rendered at all for non-host devices

## Done When
- [x] All connected devices show the same player list in real time as seats fill
- [x] Only the host device can trigger game start, and only once seats are full
- [x] All new/modified tests pass
- [x] No existing tests broken
