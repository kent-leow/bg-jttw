# Task 003 — Core Game Engine: Round Loop, Win Conditions & Assassination

## Goal
Pure logic exists that drives the full round loop (team proposal → vote → mission resolution) through to a win/loss result, including the assassination phase, fully unit tested against [gameplay.md](gameplay.md) Flow 4 and Flow 5.

## Prerequisites
- [ ] task-002.md completed

## Tasks

### Engine — Team Proposal & Vote
- [ ] `src/engine/teamProposal.ts` — validates a leader's team selection against the required mission size (new)
  - [ ] `src/engine/teamProposal.spec.ts` — rejects proposals with wrong player count; accepts a valid-size proposal
- [ ] `src/engine/voteResolution.ts` — tallies Approve/Reject votes; a tie resolves as Reject (new)
  - [ ] `src/engine/voteResolution.spec.ts` — majority-approve passes; tie and majority-reject both fail

### Engine — Rejection Counter & Hammer Rule
- [ ] `src/engine/rejectionCounter.ts` — increments/resets `round.rejectionCount`; triggers immediate EvilWin at 5 consecutive rejections per [gameplay.md](gameplay.md) Flow 4 step 3.2 (new)
  - [ ] `src/engine/rejectionCounter.spec.ts` — resets to 0 on approval; reaches EvilWin exactly on the 5th consecutive rejection, not before

### Engine — Mission Resolution
- [ ] `src/engine/missionResolution.ts` — collects Success/Fail cards from the team, enforces Good-aligned players can only submit Success, applies the per-mission fail threshold (2 for Mission 4 at 7+ players, else 1) (new)
  - [ ] `src/engine/missionResolution.spec.ts` — Good-aligned submission of Fail is rejected at the point of submission; mission fails exactly when fail count meets threshold; individual cards are never exposed in the returned result

### Engine — Overall Win Check
- [ ] `src/engine/winCheck.ts` — determines EvilWin at 3 failed missions, or transition to Assassination Phase at 3 successes (new)
  - [ ] `src/engine/winCheck.spec.ts` — 3 fails → EvilWin before 3 successes possible; 3 successes → routes to assassination, not an immediate GoodWin

### Engine — Assassination Phase
- [ ] `src/engine/assassination.ts` — resolves the Assassin's Merlin guess into final GoodWin/EvilWin + reason per [gameplay.md](gameplay.md) Flow 5 (new)
  - [ ] `src/engine/assassination.spec.ts` — correct Merlin guess → EvilWin; incorrect guess → GoodWin; result reason is set in both cases

### Engine — Round Loop Orchestration
- [ ] `src/engine/roundLoop.ts` — composes proposal → vote → rejection/hammer → mission resolution → win check → assassination into the single state machine described in [gameplay.md](gameplay.md) Flow 4 (new)
  - [ ] `src/engine/roundLoop.spec.ts` — full simulated game reaches EvilWin via 3 fails, EvilWin via hammer rule, GoodWin via missions+assassination, and EvilWin via missions+assassination

## Done When
- [ ] A simulated 5-player and 10-player game each run end-to-end through `roundLoop` to a final `game.result`
- [ ] All new/modified tests pass
- [ ] No existing tests broken
