import { describe, expect, it } from "vitest";
import { assignRoles } from "./assignRoles";
import { computeHiddenKnowledge } from "./hiddenKnowledge";
import { buildRolePool } from "./rolePool";
import { getRoleSplit } from "./roleSplitTable";
import type { RoleAssignment } from "./types";

const assignments: RoleAssignment[] = [
  { playerId: "merlin", role: { name: "Merlin", alignment: "Good" } },
  { playerId: "percival", role: { name: "Percival", alignment: "Good" } },
  { playerId: "servant", role: { name: "LoyalServant", alignment: "Good" } },
  { playerId: "morgana", role: { name: "Morgana", alignment: "Evil" } },
  { playerId: "mordred", role: { name: "Mordred", alignment: "Evil" } },
  { playerId: "oberon", role: { name: "Oberon", alignment: "Evil" } },
  { playerId: "assassin", role: { name: "Assassin", alignment: "Evil" } },
  { playerId: "minion", role: { name: "Minion", alignment: "Evil" } },
];

describe("computeHiddenKnowledge", () => {
  const knowledge = computeHiddenKnowledge(assignments);
  const byId = new Map(knowledge.map((k) => [k.playerId, k]));

  it("Merlin sees all Evil players except Mordred", () => {
    const merlin = byId.get("merlin")!;
    expect(new Set(merlin.evilPlayerIds)).toEqual(new Set(["morgana", "oberon", "assassin", "minion"]));
    expect(merlin.evilPlayerIds).not.toContain("mordred");
  });

  it("Percival sees Merlin and Morgana, unordered/unlabeled", () => {
    const percival = byId.get("percival")!;
    expect(new Set(percival.merlinOrMorganaPlayerIds)).toEqual(new Set(["merlin", "morgana"]));
  });

  it("Minions of Mordred see each other but not Oberon", () => {
    for (const id of ["morgana", "mordred", "assassin", "minion"]) {
      const fellow = byId.get(id)!;
      expect(new Set(fellow.fellowMinionPlayerIds)).toEqual(
        new Set(["morgana", "mordred", "assassin", "minion"].filter((other) => other !== id)),
      );
      expect(fellow.fellowMinionPlayerIds).not.toContain("oberon");
    }
  });

  it("Oberon is isolated from other Evil players (no extra knowledge)", () => {
    const oberon = byId.get("oberon")!;
    expect(oberon.fellowMinionPlayerIds).toBeUndefined();
    expect(oberon.evilPlayerIds).toBeUndefined();
    expect(oberon.merlinOrMorganaPlayerIds).toBeUndefined();
  });

  it("Loyal Servants get no extra hidden knowledge", () => {
    const servant = byId.get("servant")!;
    expect(servant.evilPlayerIds).toBeUndefined();
    expect(servant.merlinOrMorganaPlayerIds).toBeUndefined();
    expect(servant.fellowMinionPlayerIds).toBeUndefined();
  });
});

describe("assignRoles + computeHiddenKnowledge composed for every supported player count", () => {
  it.each([5, 6, 7, 8, 9, 10] as const)("produces a correct assignment for %i players", (playerCount) => {
    const split = getRoleSplit(playerCount);
    const pool = buildRolePool(split);
    const playerIds = Array.from({ length: playerCount }, (_, i) => `player-${i}`);

    const roleAssignments = assignRoles(playerIds, pool);
    const hiddenKnowledgeByPlayer = computeHiddenKnowledge(roleAssignments);

    expect(roleAssignments).toHaveLength(playerCount);
    expect(hiddenKnowledgeByPlayer).toHaveLength(playerCount);
    expect(new Set(roleAssignments.map((a) => a.playerId)).size).toBe(playerCount);
  });
});
