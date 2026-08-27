export type SupportedPlayerCount = 5 | 6 | 7 | 8 | 9 | 10;

export interface RoleSplit {
  readonly playerCount: SupportedPlayerCount;
  readonly good: number;
  readonly evil: number;
  /** Required team size for missions 1-5 (index 0 = Mission 1). */
  readonly missionSizes: readonly [number, number, number, number, number];
  /** Number of Fail cards required to fail missions 1-5 (index 0 = Mission 1). */
  readonly failThresholds: readonly [number, number, number, number, number];
}

// Reference Table — Mission Sizes, Fail Thresholds, Good/Evil Split (gameplay.md).
const ROLE_SPLIT_TABLE: Readonly<Record<SupportedPlayerCount, RoleSplit>> = {
  5: { playerCount: 5, good: 3, evil: 2, missionSizes: [2, 3, 2, 3, 3], failThresholds: [1, 1, 1, 1, 1] },
  6: { playerCount: 6, good: 4, evil: 2, missionSizes: [2, 3, 4, 3, 4], failThresholds: [1, 1, 1, 1, 1] },
  7: { playerCount: 7, good: 4, evil: 3, missionSizes: [2, 3, 3, 4, 4], failThresholds: [1, 1, 1, 2, 1] },
  8: { playerCount: 8, good: 5, evil: 3, missionSizes: [3, 4, 4, 5, 5], failThresholds: [1, 1, 1, 2, 1] },
  9: { playerCount: 9, good: 6, evil: 3, missionSizes: [3, 4, 4, 5, 5], failThresholds: [1, 1, 1, 2, 1] },
  10: { playerCount: 10, good: 6, evil: 4, missionSizes: [3, 4, 4, 5, 5], failThresholds: [1, 1, 1, 2, 1] },
};

function isSupportedPlayerCount(playerCount: number): playerCount is SupportedPlayerCount {
  return Number.isInteger(playerCount) && playerCount >= 5 && playerCount <= 10;
}

export function getRoleSplit(playerCount: number): RoleSplit {
  if (!isSupportedPlayerCount(playerCount)) {
    throw new Error(`Unsupported player count: ${playerCount}. Must be an integer between 5 and 10.`);
  }
  return ROLE_SPLIT_TABLE[playerCount];
}
