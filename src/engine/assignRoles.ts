import type { RoleAssignment, RoleDefinition } from "./types";

function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const temp = result[i]!;
    result[i] = result[j]!;
    result[j] = temp;
  }
  return result;
}

export function assignRoles(
  playerIds: readonly string[],
  pool: readonly RoleDefinition[],
  rng: () => number = Math.random,
): RoleAssignment[] {
  if (playerIds.length !== pool.length) {
    throw new Error(
      `Player count (${playerIds.length}) does not match role pool size (${pool.length}).`,
    );
  }
  const shuffledPool = shuffle(pool, rng);
  return playerIds.map((playerId, index) => ({ playerId, role: shuffledPool[index]! }));
}
