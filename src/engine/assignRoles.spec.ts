import { describe, expect, it } from "vitest";
import { assignRoles } from "./assignRoles";
import { buildRolePool } from "./rolePool";
import { getRoleSplit } from "./roleSplitTable";

// Deterministic seeded PRNG (mulberry32) so shuffling is reproducible in tests.
function seededRng(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("assignRoles", () => {
  it("assigns exactly one role per player, matching the pool's own duplicates", () => {
    const split = getRoleSplit(8);
    const pool = buildRolePool(split);
    const playerIds = Array.from({ length: 8 }, (_, i) => `player-${i}`);

    const assignments = assignRoles(playerIds, pool, seededRng(1));

    expect(assignments).toHaveLength(8);
    expect(new Set(assignments.map((a) => a.playerId)).size).toBe(8);
    const assignedRoleNames = assignments.map((a) => a.role.name).sort();
    const poolRoleNames = pool.map((r) => r.name).sort();
    expect(assignedRoleNames).toEqual(poolRoleNames);
  });

  it("is non-deterministic across runs without a fixed seed, but deterministic with the same seed", () => {
    const split = getRoleSplit(10);
    const pool = buildRolePool(split);
    const playerIds = Array.from({ length: 10 }, (_, i) => `player-${i}`);

    const runA = assignRoles(playerIds, pool, seededRng(42));
    const runB = assignRoles(playerIds, pool, seededRng(42));
    expect(runA.map((a) => a.role.name)).toEqual(runB.map((a) => a.role.name));

    const runC = assignRoles(playerIds, pool, seededRng(7));
    expect(runA.map((a) => a.role.name)).not.toEqual(runC.map((a) => a.role.name));
  });

  it("throws when player count does not match pool size", () => {
    const pool = buildRolePool(getRoleSplit(5));
    expect(() => assignRoles(["p1", "p2"], pool, seededRng(1))).toThrow();
  });
});
