import { describe, expect, it } from "vitest";
import { assignRoles } from "../engine/assignRoles";
import { buildRolePool } from "../engine/rolePool";
import { getRoleSplit } from "../engine/roleSplitTable";
import { decryptOwnPayload } from "../crypto/decryptOwnPayload";
import type { EncryptedEnvelope } from "../crypto/encryptForPlayer";
import { generateKeyPair } from "../crypto/keyPair";
import { HostOrchestrator, type HostOrchestratorPlayer, type PublicGameStateView } from "./hostOrchestrator";
import { RoomHub, type RoomHubMessage } from "./roomHub";

// Deterministic seeded PRNG (mulberry32), matching the pattern used across engine specs.
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

async function setupOrchestrator(allIds: readonly string[], seed: number) {
  const keyPairs = await Promise.all(allIds.map(() => generateKeyPair()));
  const players: HostOrchestratorPlayer[] = allIds.map((id, i) => ({
    playerId: id,
    publicKey: keyPairs[i]!.publicKey,
  }));
  const hub = new RoomHub();
  const broadcasts: PublicGameStateView[] = [];
  const directMessages: Record<string, unknown[]> = {};
  for (const id of allIds) {
    directMessages[id] = [];
    hub.connect({
      playerId: id,
      onMessage: (message: RoomHubMessage) => {
        if (message.kind === "broadcast") {
          broadcasts.push(message.payload as PublicGameStateView);
        } else {
          directMessages[id]!.push(message.payload);
        }
      },
    });
  }
  const orchestrator = new HostOrchestrator(hub);
  await orchestrator.startGame(players, seededRng(seed));
  return { orchestrator, hub, broadcasts, directMessages, players, keyPairs, allIds };
}

function approveAll(orchestrator: HostOrchestrator, allIds: readonly string[]): void {
  for (const id of allIds) {
    orchestrator.castVote(id, "Approve");
  }
}

function rejectAll(orchestrator: HostOrchestrator, allIds: readonly string[]): void {
  for (const id of allIds) {
    orchestrator.castVote(id, "Reject");
  }
}

const FIVE_PLAYER_IDS = ["p0", "p1", "p2", "p3", "p4"];

function expectedMerlinId(seed: number): string {
  const split = getRoleSplit(5);
  const pool = buildRolePool(split);
  const assignments = assignRoles(FIVE_PLAYER_IDS, pool, seededRng(seed));
  return assignments.find((a) => a.role.name === "Merlin")!.playerId;
}

describe("HostOrchestrator", () => {
  it("delivers each connected player an envelope decryptable only with their own key, matching assignRoles/computeHiddenKnowledge output", async () => {
    const { directMessages, keyPairs, allIds } = await setupOrchestrator(FIVE_PLAYER_IDS, 1);

    const split = getRoleSplit(5);
    const pool = buildRolePool(split);
    const expectedAssignments = assignRoles(FIVE_PLAYER_IDS, pool, seededRng(1));

    for (let i = 0; i < allIds.length; i += 1) {
      const id = allIds[i]!;
      expect(directMessages[id]).toHaveLength(1);
      const envelope = directMessages[id]![0] as EncryptedEnvelope;
      const decrypted = await decryptOwnPayload<{ role: { name: string; alignment: string }; hiddenKnowledge: unknown }>(
        keyPairs[i]!.privateKey,
        envelope,
      );
      const expected = expectedAssignments.find((a) => a.playerId === id)!;
      expect(decrypted.role).toEqual(expected.role);

      // Cannot be decrypted with a different player's private key.
      const otherIndex = (i + 1) % allIds.length;
      await expect(decryptOwnPayload(keyPairs[otherIndex]!.privateKey, envelope)).rejects.toThrow();
    }
  });

  it("broadcasts live vote progress, reveals the mission result only once the full team has submitted, and rotates the leader + rejection counter on a rejected proposal", async () => {
    const { orchestrator, broadcasts } = await setupOrchestrator(FIVE_PLAYER_IDS, 1);
    broadcasts.length = 0;

    expect(orchestrator.proposeTeam(["p0", "p1"]).valid).toBe(true);
    expect(broadcasts.at(-1)?.teamProposal).toEqual(["p0", "p1"]);

    orchestrator.castVote("p0", "Reject");
    expect(broadcasts.at(-1)?.votes).toEqual({ p0: "Reject" });
    orchestrator.castVote("p1", "Reject");
    orchestrator.castVote("p2", "Reject");
    orchestrator.castVote("p3", "Reject");
    expect(broadcasts.at(-1)?.votes).toEqual({ p0: "Reject", p1: "Reject", p2: "Reject", p3: "Reject" });
    expect(orchestrator.getRoundLoopState()?.missionResults).toEqual([]);
    expect(orchestrator.getRoundLoopState()?.leaderIndex).toBe(0);

    orchestrator.castVote("p4", "Reject");
    const stateAfterReject = orchestrator.getRoundLoopState()!;
    expect(stateAfterReject.leaderIndex).toBe(1);
    expect(stateAfterReject.rejectionCount).toBe(1);
    expect(broadcasts.at(-1)?.leaderId).toBe("p1");
    expect(broadcasts.at(-1)?.teamProposal).toBeUndefined();

    expect(orchestrator.proposeTeam(["p1", "p2"]).valid).toBe(true);
    approveAll(orchestrator, FIVE_PLAYER_IDS);
    expect(orchestrator.getRoundLoopState()?.phase).toBe("MissionResolution");

    orchestrator.submitMissionCard("p1", "Success");
    expect(orchestrator.getRoundLoopState()?.missionResults).toEqual([]);
    expect(broadcasts.at(-1)?.missionResults).toEqual([]);

    orchestrator.submitMissionCard("p2", "Success");
    expect(orchestrator.getRoundLoopState()?.missionResults).toEqual(["Success"]);
    expect(broadcasts.at(-1)?.missionResults).toEqual(["Success"]);
  });

  it("transitions to Assassination on the 3rd mission success before declaring any win, and broadcasts EvilWin for a correct assassin guess", async () => {
    const { orchestrator, broadcasts } = await setupOrchestrator(FIVE_PLAYER_IDS, 1);

    for (let mission = 1; mission <= 3; mission += 1) {
      const size = getRoleSplit(5).missionSizes[mission - 1]!;
      const team = FIVE_PLAYER_IDS.slice(0, size);
      orchestrator.proposeTeam(team);
      approveAll(orchestrator, FIVE_PLAYER_IDS);
      expect(orchestrator.getRoundLoopState()?.result).toBeNull();
      for (const id of team) {
        orchestrator.submitMissionCard(id, "Success");
      }
    }

    const state = orchestrator.getRoundLoopState()!;
    expect(state.phase).toBe("Assassination");
    expect(state.result).toBeNull();

    const merlinId = expectedMerlinId(1);
    orchestrator.submitAssassinationGuess(merlinId);

    expect(orchestrator.getRoundLoopState()?.result).toBe("EvilWin");
    expect(broadcasts.at(-1)?.result).toBe("EvilWin");
  });

  it("broadcasts GoodWin for an incorrect assassin guess", async () => {
    const { orchestrator } = await setupOrchestrator(FIVE_PLAYER_IDS, 1);

    for (let mission = 1; mission <= 3; mission += 1) {
      const size = getRoleSplit(5).missionSizes[mission - 1]!;
      const team = FIVE_PLAYER_IDS.slice(0, size);
      orchestrator.proposeTeam(team);
      approveAll(orchestrator, FIVE_PLAYER_IDS);
      for (const id of team) {
        orchestrator.submitMissionCard(id, "Success");
      }
    }

    const merlinId = expectedMerlinId(1);
    const wrongTarget = FIVE_PLAYER_IDS.find((id) => id !== merlinId)!;
    orchestrator.submitAssassinationGuess(wrongTarget);

    expect(orchestrator.getRoundLoopState()?.result).toBe("GoodWin");
  });

  it("declares EvilWin via the hammer rule without ever reaching mission resolution", async () => {
    const { orchestrator, broadcasts } = await setupOrchestrator(FIVE_PLAYER_IDS, 1);
    const size = getRoleSplit(5).missionSizes[0]!;
    const team = FIVE_PLAYER_IDS.slice(0, size);

    for (let i = 0; i < 5; i += 1) {
      orchestrator.proposeTeam(team);
      rejectAll(orchestrator, FIVE_PLAYER_IDS);
    }

    const state = orchestrator.getRoundLoopState()!;
    expect(state.result).toBe("EvilWin");
    expect(state.resultReason).toBe("5 consecutive rejected proposals");
    expect(state.missionResults).toEqual([]);
    expect(broadcasts.at(-1)?.result).toBe("EvilWin");
  });

  it("requestRematch broadcasts fresh encrypted role envelopes to the same connected players with no reconnection call", async () => {
    const { orchestrator, players, directMessages, keyPairs, allIds } = await setupOrchestrator(FIVE_PLAYER_IDS, 1);

    const firstEnvelopeByPlayer: Record<string, EncryptedEnvelope> = {};
    for (const id of allIds) {
      firstEnvelopeByPlayer[id] = directMessages[id]![0] as EncryptedEnvelope;
    }

    await orchestrator.requestRematch(seededRng(2));

    expect(orchestrator.getRoundLoopState()?.missionNumber).toBe(1);
    expect(orchestrator.getRoundLoopState()?.result).toBeNull();

    for (let i = 0; i < allIds.length; i += 1) {
      const id = allIds[i]!;
      expect(directMessages[id]).toHaveLength(2);
      const rematchEnvelope = directMessages[id]![1] as EncryptedEnvelope;
      expect(rematchEnvelope).not.toEqual(firstEnvelopeByPlayer[id]);

      const decrypted = await decryptOwnPayload(keyPairs[i]!.privateKey, rematchEnvelope);
      expect(decrypted).toHaveProperty("role");
      expect(players[i]!.playerId).toBe(id);
    }
  });
});
