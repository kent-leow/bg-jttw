# Task 008 — Private Mission-Card Submission

## Goal
Once a team is approved, each team member privately submits Success or Fail in turn via the pass-device gate, with no individual submission ever shown — only the aggregate mission result.

## Prerequisites
- [ ] task-004.md completed
- [ ] task-005.md completed

## Tasks

### Mission Card Sequence
- [ ] `src/pages/components/MissionCardSequence.tsx` (new) — steps through only the approved team's members, one at a time, wrapping each member's Success/Fail choice in `PassDeviceGate`; collects submissions locally and only calls `onAllCardsSubmitted(cards)` once every team member has submitted
  - [ ] `src/pages/components/MissionCardSequence.spec.tsx` — non-team-members are never stepped through; a submitted card is never rendered/exposed after submission; `onAllCardsSubmitted` fires only once every team member has submitted, with the correct card map

### Mission Result Wiring
- [ ] `src/pages/GameBoardPage.tsx` — modify: on a passed vote, hand off to `MissionCardSequence` before showing `MissionResultPage`'s aggregate result (modified, continuing from task 007's changes)
  - [ ] `src/pages/GameBoardPage.spec.tsx` — approved team proceeds through mission-card collection before the mission result is shown; mission result reflects only the aggregate (per `engine/missionResolution`'s fail threshold), never individual cards

## Done When
- [ ] A full team-approval → mission-card-collection → aggregate-result cycle runs on one device with no individual submission ever exposed
- [ ] All new/modified tests pass
- [ ] No existing tests broken
