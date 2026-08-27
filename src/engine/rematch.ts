import { assignRoles } from "./assignRoles";
import { buildRolePool } from "./rolePool";
import { createInitialRoundLoopState, type RoundLoopState } from "./roundLoop";
import { getRoleSplit, type SupportedPlayerCount } from "./roleSplitTable";
import type { RoleAssignment } from "./types";

export interface RematchResult {
  readonly roleAssignments: readonly RoleAssignment[];
  readonly roundLoopState: RoundLoopState;
}

/**
 * Resets round/game state and re-runs role assignment for a rematch, keeping the existing
 * `room.players` connections intact (no reconnection/QR handshake needed) per gameplay.md Flow 6.
 */
export function rematch(playerIds: readonly string[], rng: () => number = Math.random): RematchResult {
  const split = getRoleSplit(playerIds.length as SupportedPlayerCount);
  const pool = buildRolePool(split);
  const roleAssignments = assignRoles(playerIds, pool, rng);
  const roundLoopState = createInitialRoundLoopState(roleAssignments);
  return { roleAssignments, roundLoopState };
}
