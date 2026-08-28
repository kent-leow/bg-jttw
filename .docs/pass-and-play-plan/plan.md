# Journey to the West — Pivot to Single-Device Pass-and-Play

## Summary
Replaces the WebRTC/QR multi-device connection layer (found not to reliably sync game state) with a single-device "pass-and-play" model: one host device is used for the entire game. The host enters every player's name (and optionally captures a photo) at setup, then the same device is physically passed around so each player can privately view their role, vote, submit mission cards, or make the Assassin's pick, without any cross-device networking.

## Scope
**In scope**
- Removing all WebRTC/QR/encryption connection machinery (`src/connection/`, `src/crypto/`) and the pages/components built only for it (join flow, host QR-scan flow, cross-device lobby broadcast, reconnect-after-refresh-across-devices)
- Single-device roster setup: host enters each player's display name and optionally captures their photo via the device camera (gated behind an explicit user action, matching the existing camera-gating pattern)
- A reusable "pass-the-device" privacy gate: an interstitial screen naming who should be holding the device, that only reveals secret content after an explicit confirm tap, and re-hides it before returning control to the game
- Sequential, private role reveal for each player at game start, using the pass-device gate
- "View My Role" available at any later point in the game, gated the same way, for any player who wants to recheck their own role
- Team proposal (leader picks the team directly on the shared device) and private per-player voting (each player privately taps Approve/Reject via the pass-device gate; the full set of votes reveals together only once everyone has voted)
- Private per-player mission-card submission (Success/Fail) for team members only, via the pass-device gate; individual submissions are never revealed, only the aggregate mission result (unchanged from existing `engine/missionResolution` behavior)
- Private Assassin target pick via the pass-device gate, without the UI naming the Assassin (so bystanders glancing at the screen can't learn who it is)
- Local (single-device) persistence/resume: an in-progress game survives a reload of that one device
- Updating dependent tests, i18n strings, and docs (`README.md`, `package.json`) to match

**Out of scope**
- Any cross-device networking, pairing, or backend server (still a hard constraint — this pivot makes it single-device instead of solving multi-device sync)
- Anti-cheat enforcement against a device-holder who peeks at secret info out of turn (still honor-system, in-person trusted players — same trust model as the original plan)
- Changes to the underlying rules, role mapping, mission-size tables, or `src/engine/` game logic (all framework-agnostic and transport-agnostic; reused as-is)
- Persistent accounts, matchmaking, in-app chat/voice, discussion timers, spectator mode (unchanged from the original plan's exclusions)

## Acceptance Criteria

| **AC1** | Single-device roster setup |
|---------|---------|
| Given | one person opens the website on one device |
| When  | they choose to start a game and set a player count (5–10) |
| Then  | they can enter each player's display name in turn and, optionally, capture that player's photo with the device camera (camera access requested only after an explicit user action, never automatically), producing a completed roster before the game starts |

| **AC2** | Private, sequential role reveal |
|---------|---------|
| Given | a completed roster and a game that has just started |
| When  | roles are dealt |
| Then  | the device shows a "pass to `<player>`" interstitial before each player's turn; only after that player taps to confirm does their role (and any hidden knowledge it grants) appear; a "hide & continue" action re-covers it before the device moves on to the next player |

| **AC3** | Recheck my role anytime |
|---------|---------|
| Given | a game in progress, at any phase |
| When  | a player wants to confirm their role |
| Then  | they can select their own name from the roster and go through the same pass-device confirm/reveal/hide gate to see it again, without affecting game state |

| **AC4** | Team proposal & private voting |
|---------|---------|
| Given | a round has begun and the current leader is known |
| When  | the leader selects the required number of players for the mission team directly on the shared device |
| Then  | each player then privately casts Approve/Reject through the pass-device gate (their own choice never shown to players who vote after them), and once every player has voted, all votes reveal together at once |

| **AC5** | Private mission-card submission |
|---------|---------|
| Given | an approved mission team |
| When  | each team member is handed the device in turn |
| Then  | they privately submit Success or Fail through the pass-device gate; no individual submission is ever shown to anyone, only the aggregate mission result (per existing fail-threshold rules) |

| **AC6** | Private Assassination pick |
|---------|---------|
| Given | good has reached 3 mission successes |
| When  | the Assassination Phase begins |
| Then  | the device shows a generic "pass to the Assassin" instruction (never naming who that is) and, once picked up, only that phase's target-selection UI is available; the pick is submitted without exposing it to anyone else before the final reveal |

| **AC7** | Local persistence / resume |
|---------|---------|
| Given | a game in progress on the single device |
| When  | that device's page reloads (accidentally or otherwise) |
| Then  | the in-progress roster, roles, and round state are restored from that device's own local storage, without needing to re-enter players or restart the game |

| **AC8** | Rematch or end session (single device) |
|---------|---------|
| Given | a game has just ended and the result/reveal screen is shown |
| When  | the host chooses how to proceed |
| Then  | they can either start a rematch with the same roster (fresh roles dealt, same device, no reconnect step) or end the session and clear local state |

**Carried over unchanged from [../initial-plan/plan.md](../initial-plan/plan.md)**: AC4 role-mapping table, bilingual interface (English/Chinese), and the 国风彩墨 ink-wash animated visual theme — none of these depend on the connection model and are unaffected by this pivot.

## Game Flow (End-to-End, Single Device)

### Setup
1. Host opens the site and starts a new game, choosing the player count (5–10).
2. For each seat: host types that player's display name and, optionally, taps to enable the camera and capture a photo for that player (camera never requested without this explicit tap).
3. Once every seat has a name, the host reviews the roster and starts the game.

### Role Assignment (private, sequential)
4. Roles are dealt locally (same `engine/assignRoles` + `engine/rolePool` + `engine/roleSplitTable` used previously — no encryption needed since there is no second device to keep it from).
5. For each player in turn: pass-device gate ("Pass to `<name>`, tap when ready") → reveal role + hidden knowledge (`engine/hiddenKnowledge`, unchanged) → "Hide & Pass" re-covers it.
6. Any player may return to a "View My Role" entry point at any later time during the game, re-running the same gate for their own name only.

### Round Loop (unchanged rules; `engine/roundLoop` reused as-is)
7. **Team Proposal** — current leader selects the mission's required team size directly (no pass-device gate needed; team composition isn't secret).
8. **Team Vote** — each player, in turn, goes through the pass-device gate and privately taps Approve/Reject; once all votes are in, they reveal together and resolution follows the existing majority/tie-is-reject rule.
9. **Mission Resolution** — each selected team member, in turn, goes through the pass-device gate and privately submits Success/Fail; only the aggregate result (per `engine/missionResolution`'s fail threshold) is ever shown.
10. Leadership rotates; loop repeats until a win condition is met (`engine/winCheck`, `engine/rejectionCounter`, unchanged).

### Win Conditions & Reveal
11. Evil-fails-3 or good-succeeds-3-then-Assassination resolves exactly as before (`engine/assassination`, unchanged), with the Assassination pick made privately per AC6.
12. Once the game ends, every role is revealed at once (no more secrecy needed) with the result and reason.
13. Host chooses rematch (`engine/rematch`, unchanged) or end session, both purely local/single-device.

## Removed / Replaced Components

| Removed | Reason |
|---|---|
| `src/connection/*` (all 10 modules + specs) | WebRTC/QR handshake no longer needed — single device |
| `src/crypto/*` (all 3 modules + specs) | Per-player encryption existed only to keep secrets from a host on another device; no longer applicable |
| `src/pages/JoinPage.tsx` (+spec) | No second device ever joins |
| `src/pages/components/QrDisplay.tsx`, `QrScanner.tsx` (+specs) | No QR handshake |
| `src/state/localIdentity.ts` (+spec), `src/pages/AppRoot.tsx` (+spec) | Replaced by a simpler single-device game-snapshot persistence (no `roomId`/host-reachability concept) |
| `jsqr`, `qrcode`, `@types/qrcode` (package.json deps) | Only used for QR encode/decode |

| Reused as-is | Why |
|---|---|
| `src/engine/*` (all modules) | Framework- and transport-agnostic game logic; pivot only changes how state is delivered/displayed, not the rules |
| `src/i18n/*` infra | Same bilingual requirement; only new/removed string keys change |
| `src/theme/*` | Visual theme is independent of connection model |

## Open Questions
None outstanding:
- Photo capture is optional per player, not required to start the game
- Voting must still reveal only after everyone has cast (privacy during casting), matching original AC5's simultaneity intent, now achieved via pass-device gating instead of separate devices
- Assassination pick screen must not name the Assassin, to preserve secrecy on a shared device
- Trust model remains honor-system (no in-app enforcement against someone peeking early) — consistent with the original plan's stance
- Persistence is now purely local-device (no cross-device rejoin concept applies anymore)

## Estimate
**Story Points**: not sized — split into vertical-slice tasks below (half-day to two-day each).

## Notes
- Source requirement: user request in this session, pivoting away from the original plan's WebRTC-based multi-device sync (found not to work reliably) — see [../initial-plan/plan.md](../initial-plan/plan.md) for the superseded connection approach.
- "No backend server" constraint is unaffected — this pivot removes networking entirely rather than replacing it with a server.
- The original plan's AC1–AC3 and AC6 (room hosting, joining, cross-device sync, rejoin-after-refresh-across-devices) are superseded by AC1–AC3 and AC7 above.

## Changelog
- 2026-08-28: Initial pivot plan created — single-device pass-and-play replacing the WebRTC/QR multi-device connection model.
