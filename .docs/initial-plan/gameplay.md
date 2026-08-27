# Gameplay Flow — The Resistance: Journey to the West

Companion to [plan.md](plan.md). Encodes the complete game state machine, every branch, and every rule variation, using the step-prefix convention below.

### Step Prefixes

| Prefix | Meaning |
|--------|---------|
| `DO:` | Execute action |
| `IF:` | Conditional (→ action) |
| `LOOP:` | Iterate collection |
| `CALL:` | Invoke skill(params) → outputs |
| `EMIT:` | Output to user/file |
| `STORE:` | Save value |
| `STOP:` | Halt with reason |

---

## State Variables

```
room.playerCount          # 5–10, set at host setup
room.players[]            # { id, displayName, role, isLeader, connected }
room.leaderIndex           # index into room.players
round.missionNumber        # 1–5
round.rejectionCount       # resets to 0 whenever a proposal is approved or a mission resolves
round.teamProposal[]       # player ids selected for the current mission
round.votes{}              # playerId -> Approve | Reject
round.missionCards{}       # playerId -> Success | Fail (team members only)
round.missionResults[]     # ordered list of Success | Fail, one per completed mission
game.result                 # null | GoodWin | EvilWin
game.resultReason           # human-readable reason, set whenever game.result is set
game.assassinTarget         # playerId chosen in the Assassination Phase
```

## Reference Table — Mission Sizes, Fail Thresholds, Good/Evil Split

| Players | Good | Evil | M1 | M2 | M3 | M4 (fail threshold) | M5 |
|---|---|---|---|---|---|---|---|
| 5 | 3 | 2 | 2 | 3 | 2 | 3 (1) | 3 |
| 6 | 4 | 2 | 2 | 3 | 4 | 3 (1) | 4 |
| 7 | 4 | 3 | 2 | 3 | 3 | 4 (2) | 4 |
| 8 | 5 | 3 | 3 | 4 | 4 | 5 (2) | 5 |
| 9 | 6 | 3 | 3 | 4 | 4 | 5 (2) | 5 |
| 10 | 6 | 4 | 3 | 4 | 4 | 5 (2) | 5 |

## Reference — Role Pool

Named roles (Journey to the West names per [plan.md](plan.md) AC4 mapping) are included in fixed priority order, capped at each side's count from the Good/Evil Split table above — Good priority: Merlin, Percival (both always fit; minimum Good count across 5-10p is 3); Evil priority: Assassin, Morgana, Mordred, Oberon (only all four fit at 10p, since Evil is 2 for 5-6p and 3 for 7-9p). Remaining seats are filled with unnamed Loyal Servants (good) / Minions (evil) until the pool matches the Good/Evil counts in the table above.

---

## Flow 1 — Room Creation

1. `DO:` host opens the site and selects "Host Game"
2. `DO:` host sets `room.playerCount` (5–10)
3. `CALL:` generateConnectionOffer() → hostOffer
4. `EMIT:` display hostOffer as a QR code on the host's screen
5. `STORE:` `room.players` = `[{ id: hostId, displayName: hostName, role: null, isLeader: false, connected: true }]`
6. `DO:` proceed to Flow 2

## Flow 2 — Player Join (repeats once per joining player)

1. `LOOP:` while `room.players.length < room.playerCount`:
   1. `DO:` joining player scans the host's QR code → obtains `hostOffer`
   2. `CALL:` generateJoinAnswer(hostOffer) → joinerAnswer
   3. `EMIT:` display `joinerAnswer` as a QR code on the joining player's screen
   4. `DO:` host scans the joiner's QR code → obtains `joinerAnswer`
   5. `CALL:` completeConnection(joinerAnswer) → connectionEstablished
   6. `IF:` `connectionEstablished == false` → `EMIT:` show a connection-failed message to both devices; retry this player from step 2.1
   7. `IF:` `connectionEstablished == true`:
      - `STORE:` append `{ id: newPlayerId, displayName, role: null, isLeader: false, connected: true }` to `room.players`
      - `EMIT:` broadcast the updated player list to every connected device
2. `DO:` once `room.players.length == room.playerCount`, enable the host's "Start Game" action
3. `DO:` host triggers "Start Game" → proceed to Flow 3

## Flow 3 — Role Assignment

1. `CALL:` lookupRoleSplit(room.playerCount) → { goodCount, evilCount, missionSizes[], failThresholds[] }
2. `DO:` build the role pool per the Reference — Role Pool section, sized to `goodCount` / `evilCount`
3. `DO:` shuffle the role pool
4. `LOOP:` for each `player` in `room.players`:
   1. `STORE:` `player.role` = next role popped from the shuffled pool
   2. `CALL:` encryptRoleInfo(player.id, roleData) → encryptedBlob
   3. `EMIT:` deliver `encryptedBlob` addressed only to `player.id` — the host relays it but cannot decrypt it
   4. `DO:` player's own device decrypts locally
   5. `EMIT:` show that player their role card plus any hidden knowledge it grants:
      - Merlin → sees all Evil-aligned players except Mordred
      - Percival → sees Merlin and Morgana, without knowing which is which
      - Minions of Mordred (incl. Morgana, Mordred, Assassin) → see each other, except Oberon
      - Oberon, Loyal Servants, generic Minions → no extra knowledge
5. `STORE:` `room.leaderIndex` = random index into `room.players`
6. `STORE:` `round.missionNumber = 1`, `round.rejectionCount = 0`, `round.missionResults = []`
7. `DO:` proceed to Flow 4

## Flow 4 — Round Loop

`LOOP:` while `game.result == null`:

1. **Team Proposal**
   1. `DO:` leader = `room.players[room.leaderIndex]`
   2. `EMIT:` prompt leader to select `missionSizes[round.missionNumber]` players
   3. `STORE:` `round.teamProposal` = leader's selection
   4. `EMIT:` broadcast the proposed team to all players

2. **Team Vote**
   1. `LOOP:` for each `player` in `room.players`:
      - `DO:` player casts Approve/Reject
      - `STORE:` `round.votes[player.id]` = vote
      - `EMIT:` update host's live "x/y voted" progress indicator
   2. `EMIT:` once all votes are in, enable the host's "next" action; on "next", reveal all votes to all players

3. **Vote Resolution**
   1. `IF:` Approve count > Reject count (a tie counts as Reject):
      - `STORE:` `round.rejectionCount = 0`
      - `DO:` proceed to step 4 (Mission Resolution)
   2. `IF:` NOT (Approve count > Reject count):
      - `STORE:` `round.rejectionCount += 1`
      - `STORE:` `room.leaderIndex = (room.leaderIndex + 1) mod room.playerCount`
      - `IF:` `round.rejectionCount == 5`:
        - `STORE:` `game.result = EvilWin`; `game.resultReason = "5 consecutive rejected proposals"`
        - `STOP:` reason = `game.resultReason`
      - `IF:` `round.rejectionCount < 5` → `DO:` return to step 1 (Team Proposal) for the same `round.missionNumber`

4. **Mission Resolution**
   1. `LOOP:` for each `player` in `round.teamProposal`:
      - `IF:` `player.role` is Good-aligned → `DO:` player may only submit `Success`
      - `IF:` `player.role` is Evil-aligned → `DO:` player submits `Success` or `Fail`
      - `STORE:` `round.missionCards[player.id]` = submitted card
   2. `DO:` `fails` = count of `Fail` cards submitted
   3. `STORE:` `threshold` = `failThresholds[round.missionNumber]`
   4. `IF:` `fails >= threshold` → `STORE:` append `Fail` to `round.missionResults`
   5. `IF:` `fails < threshold` → `STORE:` append `Success` to `round.missionResults`
   6. `EMIT:` reveal the mission result (Success/Fail only, never individual cards) to all players
   7. `STORE:` `round.rejectionCount = 0`; `room.leaderIndex = (room.leaderIndex + 1) mod room.playerCount`; `round.missionNumber += 1`

5. **Round Win Check**
   1. `DO:` `successCount` = count of `Success` in `round.missionResults`; `failCount` = count of `Fail`
   2. `IF:` `failCount == 3` → `STORE:` `game.result = EvilWin`; `game.resultReason = "3 failed missions"`; `STOP:` reason = `game.resultReason`
   3. `IF:` `successCount == 3` → `DO:` proceed to Flow 5 (Assassination Phase)
   4. `IF:` neither → `DO:` continue `LOOP:` from step 1 (Team Proposal) for the next `round.missionNumber`

## Flow 5 — Assassination Phase

1. `DO:` identify the player whose role is Assassin
2. `EMIT:` privately prompt the Assassin to select one player believed to be Merlin
3. `STORE:` `game.assassinTarget` = selected player
4. `IF:` `game.assassinTarget.role == Merlin`:
   - `STORE:` `game.result = EvilWin`; `game.resultReason = "Assassin correctly identified Merlin"`
5. `IF:` `game.assassinTarget.role != Merlin`:
   - `STORE:` `game.result = GoodWin`; `game.resultReason = "Assassin failed to identify Merlin"`
6. `STOP:` reason = `game.resultReason`

## Flow 6 — End Game / Reveal

1. `EMIT:` broadcast `game.result`, `game.resultReason`, and every player's true role to all connected devices
2. `EMIT:` offer the host a "Rematch" (return to Flow 1, keep existing connections) or "End Session" action
3. `DO:` on host's choice, either restart at Flow 1 step 2 (role assignment only, connections persist) or close the room

## Flow 7 — Rejoin (triggered whenever a player's device (re)loads the site)

1. `DO:` read `{ playerId, roomId, lastKnownState }` from this device's local browser storage
2. `IF:` no stored `playerId` found → `DO:` treat as a new player and proceed to Flow 2
3. `IF:` a stored `playerId` is found:
   1. `CALL:` reestablishConnection(roomId, playerId) → reconnected
   2. `IF:` `reconnected == true` → `EMIT:` restore this player's screen to the current game/round state
   3. `IF:` `reconnected == false` (e.g., host unreachable) → `EMIT:` show a reconnect-failed message; `STOP:` reason = "host unreachable, cannot resume without a backend"

---

## Edge Cases & Rule Variations Covered

- Tie vote always resolves as Reject (never Approve).
- Mission 4's fail threshold is 2 (not 1) whenever `room.playerCount >= 7`; every other mission/player-count combination needs only 1 Fail.
- 5 consecutive rejected proposals within the same mission ends the game immediately in Evil's favor (the "hammer" rule) — this can occur on any mission number, not just once per game.
- Good-aligned players are never permitted to submit a `Fail` card; this is enforced at the point of submission (step 4.1 of Flow 4), not just by convention.
- Mission results reveal only Success/Fail, never which player(s) submitted which card.
- Every `EMIT:` step directed at a specific player must never be readable by the host or by any other player — enforced by the encrypt/decrypt pairing in Flow 3 step 4.
- A player's own device reload is recoverable (Flow 7); a host's device becoming permanently unavailable is not — there is no backend fallback, matching the plan's accepted trust/architecture model.
- All `EMIT:` text is rendered in the active language (English or Chinese) per [plan.md](plan.md) AC7; this applies uniformly across every flow above.

## Changelog
- 2026-08-27: Corrected Reference — Role Pool: named Evil roles (Morgana, Mordred, Oberon, Assassin = 4) cannot all fit within the Evil count for 5-9 players (2 or 3 evil seats) as originally worded ("always in play"). Resolved via fixed priority-order inclusion capped at each side's count (Good: Merlin, Percival; Evil: Assassin, Morgana, Mordred, Oberon), mirroring official Avalon's optional-role expansion. Implemented in [task-002.md](task-002.md) `rolePool.ts`.
