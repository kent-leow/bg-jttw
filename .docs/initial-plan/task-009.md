# Task 009 — Main Game Board: Team Proposal & Voting UI

## Goal
The current leader can propose a team of the correct size, every player can vote Approve/Reject, the host sees a live "x/y voted" indicator, and a "Next" action only unlocks once all votes are in (AC5).

## Prerequisites
- [ ] task-003.md completed
- [ ] task-008.md completed

## Tasks

### Pages
- [ ] `src/pages/GameBoardPage.<ext>` — hosts the round-loop UI: current leader marker, team-proposal panel (tap portraits to select `teamProposal.ts`-validated team size), vote panel (Approve/Reject), host-only live "x/y voted" indicator, host-only "Next" action gated on all votes received per [design.md](design.md) §6 (new)
  - [ ] `src/pages/GameBoardPage.spec.<ext>` — team proposal panel rejects a selection of the wrong size; "Next" is absent/disabled until every connected player has voted; non-host devices never see the "x/y voted" indicator or "Next" action
- [ ] `src/pages/components/PlayerPortraitChip.<ext>` — reusable circular ink-outlined portrait chip used for leader marking and team selection (new)
  - [ ] `src/pages/components/PlayerPortraitChip.spec.<ext>` — reflects selected/leader/disabled visual states from props

## Done When
- [ ] A full simulated round (propose → vote → reveal) advances only the host's device via "Next", and updates every connected device's board state identically
- [ ] All new/modified tests pass
- [ ] No existing tests broken
