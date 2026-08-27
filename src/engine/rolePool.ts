import type { Alignment, RoleDefinition, RoleName } from "./types";

/**
 * Named-role inclusion priority. Since the Good/Evil split table (roleSplitTable.ts) caps Evil
 * at 2 players for 5-6p and 3 for 7-9p, not all named Evil roles can always fit (Morgana +
 * Mordred + Oberon + Assassin = 4 named Evil roles, only guaranteed to all fit at 10p). Named
 * roles are therefore included in fixed priority order, capped at each side's count, with
 * remaining seats filled by generic Loyal Servant / Minion — mirroring official Avalon's
 * optional-role expansion (Mordred/Oberon added only as player count grows).
 */
const GOOD_NAMED_PRIORITY: readonly RoleName[] = ["Merlin", "Percival"];
const EVIL_NAMED_PRIORITY: readonly RoleName[] = ["Assassin", "Morgana", "Mordred", "Oberon"];

function buildSide(
  namedPriority: readonly RoleName[],
  alignment: Alignment,
  count: number,
  fillerName: RoleName,
): RoleDefinition[] {
  if (!Number.isInteger(count) || count < 0) {
    throw new Error(`Invalid ${alignment} count: ${count}. Must be a non-negative integer.`);
  }
  const named = namedPriority.slice(0, Math.min(namedPriority.length, count));
  const fillerCount = count - named.length;
  const roles: RoleDefinition[] = named.map((name) => ({ name, alignment }));
  for (let i = 0; i < fillerCount; i += 1) {
    roles.push({ name: fillerName, alignment });
  }
  return roles;
}

export function buildRolePool(split: { good: number; evil: number }): RoleDefinition[] {
  const goodRoles = buildSide(GOOD_NAMED_PRIORITY, "Good", split.good, "LoyalServant");
  const evilRoles = buildSide(EVIL_NAMED_PRIORITY, "Evil", split.evil, "Minion");
  return [...goodRoles, ...evilRoles];
}
