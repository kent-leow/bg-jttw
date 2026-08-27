import { describe, expect, it } from "vitest";
import { assignRoles } from "./assignRoles";
import { buildRolePool } from "./rolePool";
import {
  createInitialRoundLoopState,
  proposeTeam,
  resolveAssassinationAndFinish,
  submitMissionCardsAndAdvance,
  submitVotesAndAdvance,
  type RoundLoopState,
} from "./roundLoop";
import { getRoleSplit } from "./roleSplitTable";
import type { RoleAssignment } from "./types";
import type { Vote as VoteType } from "./voteResolution";

const FIVE_PLAYER_ASSIGNMENTS: RoleAssignment[] = [
  { playerId: "p0", role: { name: "Merlin", alignment: "Good" } },
  { playerId: "p1", role: { name: "Percival", alignment: "Good" } },
  { playerId: "p2", role: { name: "LoyalServant", alignment: "Good" } },
  { playerId: "p3", role: { name: "Assassin", alignment: "Evil" } },
  { playerId: "p4", role: { name: "Morgana", alignment: "Evil" } },
];

function approveAll(playerIds: readonly string[]): Record<string, VoteType> {
  return Object.fromEntries(playerIds.map((id) => [id, "Approve" as const]));
}

function rejectAll(playerIds: readonly string[]): Record<string, VoteType> {
  return Object.fromEntries(playerIds.map((id) => [id, "Reject" as const]));
}

describe("roundLoop", () => {
  it("reaches EvilWin via 3 failed missions", () => {
    let state = createInitialRoundLoopState(FIVE_PLAYER_ASSIGNMENTS);
    const allIds = FIVE_PLAYER_ASSIGNMENTS.map((a) => a.playerId);

    for (let mission = 1; mission <= 3; mission += 1) {
      const size = getRoleSplit(5).missionSizes[mission - 1]!;
      const team = ["p3", ...allIds.filter((id) => id !== "p3").slice(0, size - 1)];
      expect(proposeTeam(state, team).valid).toBe(true);
      state = submitVotesAndAdvance(state, approveAll(allIds));
      expect(state.phase).toBe("MissionResolution");
      const cards = Object.fromEntries(
        team.map((id) => [id, id === "p3" ? ("Fail" as const) : ("Success" as const)]),
      );
      state = submitMissionCardsAndAdvance(state, team, cards);
    }

    expect(state.phase).toBe("GameOver");
    expect(state.result).toBe("EvilWin");
    expect(state.resultReason).toBe("3 failed missions");
  });

  it("reaches EvilWin via the hammer rule (5 consecutive rejections)", () => {
    let state = createInitialRoundLoopState(FIVE_PLAYER_ASSIGNMENTS);
    const allIds = FIVE_PLAYER_ASSIGNMENTS.map((a) => a.playerId);
    const size = getRoleSplit(5).missionSizes[0]!;
    const team = allIds.slice(0, size);

    for (let i = 0; i < 5; i += 1) {
      expect(proposeTeam(state, team).valid).toBe(true);
      state = submitVotesAndAdvance(state, rejectAll(allIds));
    }

    expect(state.phase).toBe("GameOver");
    expect(state.result).toBe("EvilWin");
    expect(state.resultReason).toBe("5 consecutive rejected proposals");
  });

  function playThreeSuccessfulMissions(): RoundLoopState {
    let state = createInitialRoundLoopState(FIVE_PLAYER_ASSIGNMENTS);
    const allIds = FIVE_PLAYER_ASSIGNMENTS.map((a) => a.playerId);
    const goodIds = FIVE_PLAYER_ASSIGNMENTS.filter((a) => a.role.alignment === "Good").map((a) => a.playerId);

    for (let mission = 1; mission <= 3; mission += 1) {
      const size = getRoleSplit(5).missionSizes[mission - 1]!;
      const team = goodIds.slice(0, size);
      state = submitVotesAndAdvance(state, approveAll(allIds));
      const cards = Object.fromEntries(team.map((id) => [id, "Success" as const]));
      state = submitMissionCardsAndAdvance(state, team, cards);
    }
    return state;
  }

  it("reaches GoodWin via 3 successful missions + a failed assassination guess", () => {
    const state = playThreeSuccessfulMissions();
    expect(state.phase).toBe("Assassination");

    const final = resolveAssassinationAndFinish(state, "p4"); // not Merlin (p0)
    expect(final.result).toBe("GoodWin");
    expect(final.resultReason).toBe("Assassin failed to identify Merlin");
  });

  it("reaches EvilWin via 3 successful missions + a correct assassination guess", () => {
    const state = playThreeSuccessfulMissions();
    expect(state.phase).toBe("Assassination");

    const final = resolveAssassinationAndFinish(state, "p0"); // Merlin
    expect(final.result).toBe("EvilWin");
    expect(final.resultReason).toBe("Assassin correctly identified Merlin");
  });

  it("runs a full simulated 5-player game end-to-end to a final game.result", () => {
    let state = createInitialRoundLoopState(FIVE_PLAYER_ASSIGNMENTS);
    const allIds = FIVE_PLAYER_ASSIGNMENTS.map((a) => a.playerId);
    const alignmentByPlayerId = new Map(FIVE_PLAYER_ASSIGNMENTS.map((a) => [a.playerId, a.role.alignment]));

    while (state.phase !== "GameOver" && state.phase !== "Assassination") {
      const size = getRoleSplit(5).missionSizes[state.missionNumber - 1]!;
      const team = allIds.slice(0, size);
      state = submitVotesAndAdvance(state, approveAll(allIds));
      if (state.phase === "MissionResolution") {
        const cards = Object.fromEntries(
          team.map((id) => [id, alignmentByPlayerId.get(id) === "Evil" ? ("Fail" as const) : ("Success" as const)]),
        );
        state = submitMissionCardsAndAdvance(state, team, cards);
      }
    }
    if (state.phase === "Assassination") {
      state = resolveAssassinationAndFinish(state, "p0");
    }

    expect(state.result).not.toBeNull();
  });

  it("runs a full simulated 10-player game end-to-end to a final game.result", () => {
    const split = getRoleSplit(10);
    const pool = buildRolePool(split);
    const allIds = Array.from({ length: 10 }, (_, i) => `player-${i}`);
    const roleAssignments = assignRoles(allIds, pool, () => 0.42);
    const alignmentByPlayerId = new Map(roleAssignments.map((a) => [a.playerId, a.role.alignment]));

    let state = createInitialRoundLoopState(roleAssignments);
    while (state.phase !== "GameOver" && state.phase !== "Assassination") {
      const size = getRoleSplit(10).missionSizes[state.missionNumber - 1]!;
      const team = allIds.slice(0, size);
      state = submitVotesAndAdvance(state, approveAll(allIds));
      if (state.phase === "MissionResolution") {
        const cards = Object.fromEntries(
          team.map((id) => [id, alignmentByPlayerId.get(id) === "Evil" ? ("Fail" as const) : ("Success" as const)]),
        );
        state = submitMissionCardsAndAdvance(state, team, cards);
      }
    }
    if (state.phase === "Assassination") {
      state = resolveAssassinationAndFinish(state, allIds[0]!);
    }

    expect(state.result).not.toBeNull();
  });
});
