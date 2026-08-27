import { describe, expect, it } from "vitest";
import { buildRolePool } from "./rolePool";
import { getRoleSplit } from "./roleSplitTable";

describe("buildRolePool", () => {
  it.each([5, 6, 7, 8, 9, 10] as const)(
    "for %i players: total pool size matches the split, and named roles follow the capped-priority rule",
    (playerCount) => {
      const split = getRoleSplit(playerCount);
      const pool = buildRolePool(split);

      expect(pool).toHaveLength(playerCount);
      expect(pool.filter((r) => r.alignment === "Good")).toHaveLength(split.good);
      expect(pool.filter((r) => r.alignment === "Evil")).toHaveLength(split.evil);

      // Merlin + Percival always fit (min Good count across 5-10p is 3).
      expect(pool.some((r) => r.name === "Merlin")).toBe(true);
      expect(pool.some((r) => r.name === "Percival")).toBe(true);

      // Evil named roles are included in fixed priority order, capped at the Evil count.
      const expectedEvilNamed = ["Assassin", "Morgana", "Mordred", "Oberon"].slice(0, Math.min(4, split.evil));
      for (const name of expectedEvilNamed) {
        expect(pool.some((r) => r.name === name)).toBe(true);
      }
      const notExpectedEvilNamed = ["Assassin", "Morgana", "Mordred", "Oberon"].filter(
        (name) => !expectedEvilNamed.includes(name),
      );
      for (const name of notExpectedEvilNamed) {
        expect(pool.some((r) => r.name === name)).toBe(false);
      }

      const namedGoodCount = 2;
      const namedEvilCount = expectedEvilNamed.length;
      expect(pool.filter((r) => r.name === "LoyalServant")).toHaveLength(split.good - namedGoodCount);
      expect(pool.filter((r) => r.name === "Minion")).toHaveLength(split.evil - namedEvilCount);
    },
  );

  it("throws for a negative side count", () => {
    expect(() => buildRolePool({ good: -1, evil: 2 })).toThrow();
  });
});
