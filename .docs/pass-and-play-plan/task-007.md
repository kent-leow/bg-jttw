# Task 007 — Team Proposal & Private Voting

## Goal
The current leader proposes a mission team directly on the shared device, then every player privately casts Approve/Reject in turn via the pass-device gate, with the full set of votes revealed together only once everyone has voted.

## Prerequisites
- [ ] task-004.md completed
- [ ] task-005.md completed

## Tasks

### Team Proposal
- [ ] `src/pages/GameBoardPage.tsx` — modify: team-proposal selection (leader picks players directly, unchanged — not secret) is followed by a sequential private-voting stage instead of showing every player's vote buttons at once; remove the old per-device `isLeader`/`isHost` simultaneous-UI branching in favor of a single-device sequential flow
  - [ ] `src/pages/GameBoardPage.spec.tsx` — leader can select and submit a valid team; an invalid team size shows the existing validation error unchanged

### Private Voting
- [ ] `src/pages/components/VotingSequence.tsx` (new) — steps through the roster one player at a time, wrapping each player's Approve/Reject choice in `PassDeviceGate`; collects all votes locally and only calls `onAllVotesCast(votes)` once every player has voted
  - [ ] `src/pages/components/VotingSequence.spec.tsx` — a player's vote is not visible to/changeable by subsequent players; `onAllVotesCast` fires only after every player has voted, with the correct vote map; votes reveal together (all shown at once) only after that point

## Done When
- [ ] A full team-proposal-then-vote cycle runs on one device with no vote visible before all have been cast
- [ ] Vote resolution (majority/tie-is-reject, rejection counter) behaves identically to the existing `engine/voteResolution`/`rejectionCounter` tests
- [ ] All new/modified tests pass
- [ ] No existing tests broken
