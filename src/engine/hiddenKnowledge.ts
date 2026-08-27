import type { RoleAssignment, RoleName } from "./types";

export interface HiddenKnowledge {
  readonly playerId: string;
  /** Merlin only: all Evil-aligned player ids except Mordred. */
  readonly evilPlayerIds?: readonly string[];
  /** Percival only: Merlin's and Morgana's ids, unordered (Percival cannot tell which is which). */
  readonly merlinOrMorganaPlayerIds?: readonly string[];
  /** Minions of Mordred only (Morgana, Mordred, Assassin, generic Minion): fellow minion ids, excluding Oberon and self. */
  readonly fellowMinionPlayerIds?: readonly string[];
}

// Roles that "know each other" per gameplay.md Flow 3 step 4.5, deliberately excluding Oberon.
const MINION_OF_MORDRED_ROLES: readonly RoleName[] = ["Morgana", "Mordred", "Assassin", "Minion"];

export function computeHiddenKnowledge(assignments: readonly RoleAssignment[]): HiddenKnowledge[] {
  const mordred = assignments.find((a) => a.role.name === "Mordred");
  const merlin = assignments.find((a) => a.role.name === "Merlin");
  const morgana = assignments.find((a) => a.role.name === "Morgana");
  const evilPlayerIdsExceptMordred = assignments
    .filter((a) => a.role.alignment === "Evil" && a.playerId !== mordred?.playerId)
    .map((a) => a.playerId);
  const minionPlayerIds = assignments
    .filter((a) => MINION_OF_MORDRED_ROLES.includes(a.role.name))
    .map((a) => a.playerId);

  return assignments.map((assignment): HiddenKnowledge => {
    if (assignment.role.name === "Merlin") {
      return { playerId: assignment.playerId, evilPlayerIds: evilPlayerIdsExceptMordred };
    }
    if (assignment.role.name === "Percival") {
      const ids = [merlin?.playerId, morgana?.playerId].filter((id): id is string => id !== undefined);
      return { playerId: assignment.playerId, merlinOrMorganaPlayerIds: ids };
    }
    if (MINION_OF_MORDRED_ROLES.includes(assignment.role.name)) {
      return {
        playerId: assignment.playerId,
        fellowMinionPlayerIds: minionPlayerIds.filter((id) => id !== assignment.playerId),
      };
    }
    return { playerId: assignment.playerId };
  });
}
