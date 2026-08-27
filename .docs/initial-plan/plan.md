# Journey to the West — Online Social-Deduction Party Game

## Summary
A website where players host or join a game room to play a new, Journey to the West–themed social-deduction party game (mechanically in the same family as the well-known hidden-role genre, redesigned end-to-end with its own characters, names, and presentation). Each player uses their own device/browser to connect; there is no backend server, so room hosting, joining, and live game-state updates must work through peer-to-peer connections or the host's browser acting as the source of truth.

## Scope
**In scope**
- Hosting a game room and inviting other players to join, each from their own device
- Peer-to-peer (or host-mediated, backend-free) synchronization of game state during play
- A complete, playable rule set and turn-by-turn flow for the new variant, reskinned 1:1 from the original Resistance/Avalon roles and phases
- Mapping of every original Resistance/Avalon role and story beat to an equivalent Journey to the West character, with an explanation for why each mapping fits
- End-to-end game flow: room setup, role assignment, mission/quest rounds, voting, discussion phase, win/loss resolution
- Bilingual interface (English and Chinese)
- Rejoining a room after an accidental refresh or reload
- A 国风彩墨 (Chinese ink-wash) visual theme, themed around Journey to the West, with animated, gamified presentation built on an official, properly licensed graphics package
- Starting a rematch with the same connected players after a game ends, or ending the session

**Out of scope**
- Persistent user accounts, login, or player profiles
- Any centralized backend server or database
- Matchmaking across unknown/public players (rooms are invite-based)
- In-game chat, voice, or discussion tooling (players discuss in person, face to face)
- Anti-cheat enforcement against a host who deliberately tampers with their own client (players are trusted, in-person acquaintances)
- Discussion/voting timers and spectator mode

## Acceptance Criteria

| **AC1** | Host a room |
|---------|---------|
| Given | a player opens the website |
| When  | they choose to host a new game for a group of 5–10 players (the standard Avalon/Resistance range) |
| Then  | a room is created and they receive a shareable code or QR code that lets others join it, without any backend server involved |

| **AC2** | Join a room |
|---------|---------|
| Given | a player has been shown the host's join QR code |
| When  | they scan it, and the host then scans the brief reply code their device generates in response |
| Then  | that two-way scan completes a direct connection between their device and the host's, and they appear in the player list on every connected device — no typing, pairing code re-entry, or backend server involved |

| **AC3** | Backend-free, tamper-resistant game state sync |
|---------|---------|
| Given | a room with multiple connected players |
| When  | any game action occurs (e.g., role assignment, vote, mission result) |
| Then  | all connected players' views update to reflect the new game state without any backend server storing or relaying it, and each player's secret information (e.g., their role) is unreadable by the host or any other player it isn't intended for |

| **AC4** | 1:1 reskinned rule set |
|---------|---------|
| Given | the original Resistance/Avalon rules and roles |
| When  | the Journey to the West variant is designed |
| Then  | every role, phase, and win/loss condition has a documented, equivalent counterpart, each with a clear explanation of why the chosen Journey to the West character fits that role, per the mapping below |

| Original role | Journey to the West character | Why it fits |
|---|---|---|
| Merlin (good, knows the evil players, must not be exposed) | Tang Sanzang (Tripitaka) | The monk the whole pilgrimage protects; demons constantly scheme to expose/capture him, mirroring "if the evil side identifies and kills this role, good loses even after winning missions" |
| Percival (good, sees Merlin and Morgana but not which is which) | Sun Wukong (Monkey King) | Famed for his golden, fire-sighted eyes that can partially perceive disguised demons, yet is still fooled by perfect impersonations in the source stories — matching "partial, not perfect, insight" |
| Loyal servants of Arthur (good, no special knowledge) | Zhu Bajie (Pigsy) and Sha Wujing (Sandy) | Loyal disciples who protect the journey without any special hidden knowledge |
| Morgana (evil, appears as Merlin to Percival) | White Bone Spirit (Bai Gu Jing) | A shapeshifting demon who disguises herself as innocent, trustworthy people to deceive the group — the archetypal "false Merlin" |
| Mordred (evil, hidden even from Merlin) | Bull Demon King (Niu Mowang) | A powerful demon king whose true threat stays concealed from even divine oversight in the source stories, matching "unseen by Merlin" |
| Oberon (evil, unknown to their own side) | Red Boy (Hong Hai'er) | Acts alone on his own scheme to capture Tang Sanzang rather than coordinating with other demons, matching "evil but disconnected from the rest of the evil team" |
| Assassin (evil, must identify and kill Merlin at the end) | Six-Eared Macaque | A near-perfect impersonator who specializes in deceiving everyone, including Buddha, into telling him apart from Sun Wukong — fits a role built entirely around correctly identifying one specific person |
| Minions of Mordred (evil, know each other) | Yaoguai (demon henchmen) | Generic demon foot-soldiers who serve and recognize the demon kings as being on the same side |

| **AC5** | Full, host-controlled game flow |
|---------|---------|
| Given | a room with the required number of players |
| When  | a game is started |
| Then  | players progress through role assignment, team proposals, voting, and mission resolution, with the host holding the sole control to advance each phase (the host sees a live "x/y voted" progress indicator and a "next" action becomes available only once all players have acted), repeating until the game reaches a win or loss condition |

| **AC6** | Rejoin after refresh |
|---------|---------|
| Given | a player is in an active room and their device reloads or refreshes the page (accidentally or otherwise) |
| When  | they reopen the website on the same device |
| Then  | they are recognized by their previously assigned unique identity and rejoin the room in their prior state |

| **AC7** | Bilingual interface |
|---------|---------|
| Given | any player using the site |
| When  | they view any screen, role, or instructional text |
| Then  | the content is available in both English and Chinese |

| **AC8** | Themed, animated presentation |
|---------|---------|
| Given | any player using the site |
| When  | they view any page, from landing through role reveal, gameplay, and end-game reveal |
| Then  | the page is presented in a 国风彩墨 (Chinese ink-wash) visual theme built around Journey to the West characters and motifs, with key moments (e.g., mission progress, role reveal, mission result, final reveal) rendered as animated, gamified scenes using an official, properly licensed graphics package |

| **AC9** | Rematch or end session |
|---------|---------|
| Given | a game has just ended and the result/reveal screen is shown |
| When  | the host chooses how to proceed |
| Then  | the host can either start a rematch with the same connected players without anyone needing to reconnect, or end the session and close the room |

## Game Flow (End-to-End)

### Setup
1. Host creates a room and sets the total player count (5–10).
2. For each joining player: the host's device shows a join QR code; the player scans it, their device generates a short reply code, and the host scans that back. This two-way scan completes a direct, backend-free connection — repeated once per joining player until all seats are filled.
3. Once all seats are filled, the host (and only the host) starts the game.

### Role Assignment
4. Roles are dealt secretly according to the good/evil split for the confirmed player count (see table below).
5. Named roles in play: Merlin, Percival, Morgana, Mordred, Oberon, Assassin. Any remaining seats are filled with unnamed Loyal Servants (good) or Minions (evil) so the totals match the split table.
6. Each player's device reveals only that player's own role plus whatever hidden knowledge it grants: Merlin sees all evil players except Mordred; Percival sees Merlin and Morgana but not which is which; Minions of Mordred know each other but not Oberon. No player's hidden information is readable by the host or by any other player — it is encrypted so only the intended device can display it.
7. A starting Leader is chosen; the Leader role rotates to the next player, in a fixed order, after every round.

### Round Loop (repeats until a win condition below is reached)
8. **Team Proposal** — the current Leader picks the number of players required for the current mission (per the table below) to form the mission team.
9. **Team Vote** — every player votes Approve or Reject. The host's screen shows a live "x/y voted" count; the "next" action only appears once all votes are in.
10. If the vote passes (majority Approve; a tie counts as Reject) → go to Mission Resolution (step 12).
11. If the vote fails → leadership passes to the next player in order and a rejection counter increases. If 5 proposals in a row are rejected within the same mission, evil wins immediately and the game ends (skip to step 15).
12. **Mission Resolution** — only the selected team secretly submits Success or Fail. Good-aligned players may only submit Success; evil-aligned players may submit either.
13. The mission fails if the number of Fail submissions meets or exceeds the required threshold for that mission (1, except Mission 4 in a 7+ player game, which needs 2); otherwise it succeeds. The result is revealed to everyone without exposing who submitted which card.
14. Leadership passes to the next player in order and the loop repeats from step 8 for the next mission.

### Win Conditions
15. If evil accumulates 3 failed missions before good reaches 3 successes → evil wins; game ends.
16. If good reaches 3 successful missions → proceed to the Assassination Phase (step 17); evil does not yet lose.
17. **Assassination Phase** — the Assassin privately picks one player believed to be Merlin.
    - Correct guess → evil wins.
    - Incorrect guess → good wins.
18. Once any win condition is met, every player's screen reveals the final result and every player's true role. The room remains open for a rematch or closes at the host's choice.

### Mission Team Sizes & Good/Evil Split (standard Avalon/Resistance tables, used as-is per the earlier decision to start from the original rules)

| Players | Good | Evil | Mission 1 | Mission 2 | Mission 3 | Mission 4 | Mission 5 |
|---|---|---|---|---|---|---|---|
| 5 | 3 | 2 | 2 | 3 | 2 | 3 | 3 |
| 6 | 4 | 2 | 2 | 3 | 4 | 3 | 4 |
| 7 | 4 | 3 | 2 | 3 | 3 | 4 (needs 2 fails) | 4 |
| 8 | 5 | 3 | 3 | 4 | 4 | 5 (needs 2 fails) | 5 |
| 9 | 6 | 3 | 3 | 4 | 4 | 5 (needs 2 fails) | 5 |
| 10 | 6 | 4 | 3 | 4 | 4 | 5 (needs 2 fails) | 5 |

## Open Questions
None outstanding — all prior questions were resolved:
- Player count: dynamic, 5–10, following the standard Avalon/Resistance rules
- Connection setup: host issues a shareable room code / QR code; devices connect directly to the host without a persistent backend, and no game data is stored by any third party during the connection step
- Hidden information trust: no host-side anti-cheat is enforced; each player's secret data is encrypted so it isn't readable by the host or other players, on the honor system (in-person, trusted players)
- Mission/team-size parameters: start from the original Avalon/Resistance tables as a baseline, to be adjusted later
- Discussion: in person only, no in-game chat/voice
- Device/browser support: mobile-first, Chrome and other major mobile browsers
- Rejoin: each player holds a unique identity in their own device's storage, enabling rejoin after an accidental refresh
- Localization: English and Chinese at launch
- Flow pacing: host-controlled, with a live vote-progress indicator and a manual "next" action; no timers or spectator mode
- Deployment: Vercel

## Estimate
**Story Points**: not sized — exceeds 5 SP as a single card. Even with all questions resolved, this initiative spans several substantial areas of work:
- Rule/character reskin design — Moderate
- Peer-to-peer room hosting & join flow (incl. room code/QR handshake) — Significant
- Encrypted, backend-free game state sync — Significant
- Host-controlled game flow UI (roles, missions, voting) — Moderate
- Rejoin/persistence via per-player local identity — Bounded
- Bilingual interface — Bounded

Recommend splitting into separate cards along these lines.

## Notes
- Source requirement: [.docs/initial-plan/raw.md](.docs/initial-plan/raw.md) — original raw ask; every item in it is reflected in Scope/AC above.
- Companion documents, both fully accounted for in this plan:
  - [gameplay.md](gameplay.md) — the complete step-by-step game state machine (setup, join, role assignment, round loop, win conditions, assassination, reveal, rejoin) underlying AC1–AC6, AC9.
  - [design.md](design.md) — the visual design reference (art direction, palette/typography, page-by-page presentation, graphics technology) underlying AC8.
- "No backend server" is a hard constraint from the request; any connection-setup mechanism must not rely on a persistent server component holding game data.
- Connection setup is a two-way QR scan (host shows a code, joiner scans and replies with a code of their own) — confirmed as the chosen approach over any relay-based alternative.
- The host acts as the central connection point for all other players (a hub), rather than every player connecting to every other player directly.
- Game state lives in each device's own browser storage; a player's own reload doesn't lose their state as long as they return on the same device.
- Mission/team-size numbers are a direct copy of the original Avalon/Resistance tables, with modification expected in a follow-up round.
- Visual theme is 国风彩墨 (Chinese ink-wash), themed around Journey to the West; animated "gamified" scenes use an official, properly licensed graphics package (not a custom/unlicensed asset pipeline).
- **Hobby project, no similar/trademarked terms in-product**: the shipped site must not use the original hidden-role game's name or similar terms (e.g., "Avalon", "The Resistance") anywhere user-facing — title, UI text, role names, and marketing copy use only Journey to the West names and generic genre language ("social-deduction", "hidden role"). The original-role mapping table under AC4 is an internal design reference only, not public-facing text.
- **Vercel deployment is static-hosting only**: no serverless functions, API routes, or any server-side component are used, to keep the "no backend server" constraint intact.
- **No tracking**: the site collects no analytics or tracking data, consistent with having no backend to send such data to.

## Changelog
- 2026-08-27: Initial plan created from raw requirements.
- 2026-08-27: Resolved all open questions (player count, connection mechanism, trust model, character mapping, rule baseline, communication, device support, rejoin, localization, flow pacing, deployment); added character mapping table, rejoin and bilingual AC, updated scope and estimate breakdown.
- 2026-08-27: Confirmed QR two-way handshake, host-hub topology, encrypted hidden info, and rejoin approach; added full end-to-end Game Flow section with official Avalon/Resistance mission-size and good/evil split tables.
- 2026-08-27: Folded in gameplay.md and design.md as companion documents; added visual theme/animated presentation to Scope and AC8.
- 2026-08-27: Renamed product away from trademarked terms (hobby project constraint); added AC9 (rematch/end session); stated Vercel as static-only hosting and no-tracking stance.
