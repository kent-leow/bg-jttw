import { describe, expect, it } from "vitest";
import { getRoleSplit } from "./roleSplitTable";

describe("getRoleSplit", () => {
  it.each([
    [5, 3, 2, [2, 3, 2, 3, 3], [1, 1, 1, 1, 1]],
    [6, 4, 2, [2, 3, 4, 3, 4], [1, 1, 1, 1, 1]],
    [7, 4, 3, [2, 3, 3, 4, 4], [1, 1, 1, 2, 1]],
    [8, 5, 3, [3, 4, 4, 5, 5], [1, 1, 1, 2, 1]],
    [9, 6, 3, [3, 4, 4, 5, 5], [1, 1, 1, 2, 1]],
    [10, 6, 4, [3, 4, 4, 5, 5], [1, 1, 1, 2, 1]],
  ])(
    "returns the correct split/mission-size/fail-threshold row for %i players",
    (playerCount, good, evil, missionSizes, failThresholds) => {
      const split = getRoleSplit(playerCount);
      expect(split.good).toBe(good);
      expect(split.evil).toBe(evil);
      expect(split.missionSizes).toEqual(missionSizes);
      expect(split.failThresholds).toEqual(failThresholds);
    },
  );

  it.each([4, 11, 0, -1, 5.5])("throws for out-of-range player count %s", (playerCount) => {
    expect(() => getRoleSplit(playerCount)).toThrow();
  });
});
