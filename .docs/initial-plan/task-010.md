# Task 010 — Mission Resolution Reveal & Assassination Phase UI

## Goal
Mission outcomes are revealed to everyone as an aggregate Success/Fail only, and — once 3 missions succeed — the Assassin privately picks a Merlin guess while everyone else sees a shared suspense screen (AC5, [gameplay.md](gameplay.md) Flow 4 step 4.6, Flow 5).

## Prerequisites
- [x] task-003.md completed
- [x] task-009.md completed

## Tasks

### Pages
- [x] `src/pages/MissionResultPage.<ext>` — renders the aggregate Success/Fail result from `missionResolution.ts`, never individual submitted cards, per [design.md](design.md) §7 (new)
  - [x] `src/pages/MissionResultPage.spec.<ext>` — renders only the aggregate result; component receives no per-player card data as input (type-level/prop check)
- [x] `src/pages/AssassinationPage.<ext>` — on the Assassin's device only, shows a target-selection grid wired to `assassination.ts`; all other devices show a shared suspense screen per [design.md](design.md) §8 (new)
  - [x] `src/pages/AssassinationPage.spec.<ext>` — target grid renders only on the device whose role is Assassin; non-Assassin devices render the suspense screen instead

## Done When
- [x] A simulated game reaching 3 successes routes the Assassin's device to target selection and all others to the suspense screen, then resolves to the correct final result
- [x] All new/modified tests pass
- [x] No existing tests broken
