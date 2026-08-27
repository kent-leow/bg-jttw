# Task 002 — Core Game Engine: Role Pool & Role Assignment

## Goal
Pure, framework-agnostic logic exists that builds the correct role pool for a given player count, shuffles and assigns roles, and computes each player's hidden knowledge, fully unit tested.

## Prerequisites
- [ ] task-001.md completed

## Tasks

### Engine — Reference Tables
- [ ] `src/engine/roleSplitTable.ts` — good/evil counts, mission sizes, and fail thresholds for 5–10 players per [gameplay.md](gameplay.md) Reference Table (new)
  - [ ] `src/engine/roleSplitTable.spec.ts` — returns correct split/mission-size/fail-threshold row for every player count 5–10; throws/rejects for out-of-range counts

### Engine — Role Pool
- [ ] `src/engine/rolePool.ts` — builds the named-role + Loyal Servant/Minion pool sized to a given good/evil split per [gameplay.md](gameplay.md) Reference — Role Pool (new)
  - [ ] `src/engine/rolePool.spec.ts` — pool always contains exactly Merlin, Percival, Morgana, Mordred, Oberon, Assassin plus filler roles matching good/evil counts, for every player count 5–10

### Engine — Assignment
- [ ] `src/engine/assignRoles.ts` — shuffles the role pool and assigns one role per player id (new)
  - [ ] `src/engine/assignRoles.spec.ts` — every player receives exactly one role; no role duplicated beyond the pool's own duplicates; shuffling is non-deterministic across runs (seeded for test determinism)

### Engine — Hidden Knowledge
- [ ] `src/engine/hiddenKnowledge.ts` — computes each player's visible hidden-knowledge set per [gameplay.md](gameplay.md) Flow 3 step 4.5 (Merlin sees evil except Mordred; Percival sees Merlin+Morgana unlabeled; Minions of Mordred see each other except Oberon; others see nothing) (new)
  - [ ] `src/engine/hiddenKnowledge.spec.ts` — covers each role's knowledge set exactly, including the Percival ambiguity (Merlin/Morgana unordered) and Oberon's isolation from other evil players

## Done When
- [ ] `assignRoles` + `hiddenKnowledge` composed together produce a correct, fully-typed role assignment for any player count 5–10
- [ ] All new/modified tests pass
- [ ] No existing tests broken
