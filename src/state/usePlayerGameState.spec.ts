import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HostOrchestrator } from "../connection/hostOrchestrator";
import { RoomHub } from "../connection/roomHub";
import { encryptForPlayer } from "../crypto/encryptForPlayer";
import { generateKeyPair } from "../crypto/keyPair";
import { usePlayerGameState } from "./usePlayerGameState";

describe("usePlayerGameState", () => {
  it("reflects each successive broadcast and unsubscribes from the hub on unmount", async () => {
    const hub = new RoomHub();
    const keyPair = await generateKeyPair();
    const { result, unmount } = renderHook(() =>
      usePlayerGameState({ roomHub: hub, playerId: "p1", privateKey: keyPair.privateKey, transport: { send: vi.fn() } }),
    );

    expect(result.current.gameState).toBeNull();

    act(() => {
      hub.broadcastPublicState({ kind: "gameState", phase: "TeamProposal", missionNumber: 1 });
    });
    expect(result.current.gameState).toEqual({ kind: "gameState", phase: "TeamProposal", missionNumber: 1 });

    act(() => {
      hub.broadcastPublicState({ kind: "gameState", phase: "MissionResolution", missionNumber: 1 });
    });
    expect(result.current.gameState).toEqual({ kind: "gameState", phase: "MissionResolution", missionNumber: 1 });

    const disconnectSpy = vi.spyOn(hub, "disconnect");
    unmount();
    expect(disconnectSpy).toHaveBeenCalledWith("p1");
  });

  it("decrypted role/hidden-knowledge becomes available only after this player's own envelope arrives, not another player's", async () => {
    const hub = new RoomHub();
    const keyPairP1 = await generateKeyPair();
    const keyPairP2 = await generateKeyPair();

    const { result: resultP1 } = renderHook(() =>
      usePlayerGameState({ roomHub: hub, playerId: "p1", privateKey: keyPairP1.privateKey, transport: { send: vi.fn() } }),
    );
    const { result: resultP2 } = renderHook(() =>
      usePlayerGameState({ roomHub: hub, playerId: "p2", privateKey: keyPairP2.privateKey, transport: { send: vi.fn() } }),
    );

    expect(resultP1.current.roleInfo).toBeNull();
    expect(resultP2.current.roleInfo).toBeNull();

    const envelopeForP1 = await encryptForPlayer(keyPairP1.publicKey, {
      role: { name: "Merlin", alignment: "Good" },
      hiddenKnowledge: { playerId: "p1" },
    });

    act(() => {
      hub.relayToPlayer("p1", envelopeForP1);
    });

    await waitFor(() => expect(resultP1.current.roleInfo).not.toBeNull());
    expect(resultP1.current.roleInfo?.role.name).toBe("Merlin");
    expect(resultP2.current.roleInfo).toBeNull();
  });

  it("each action sender transmits a correctly shaped message that the host orchestrator accepts", async () => {
    const allIds = ["p0", "p1", "p2", "p3", "p4"];
    const keyPairs = await Promise.all(allIds.map(() => generateKeyPair()));
    const hub = new RoomHub();
    const players = allIds.map((id, i) => ({ playerId: id, publicKey: keyPairs[i]!.publicKey }));
    const orchestrator = new HostOrchestrator(hub);

    function dispatchToOrchestrator(message: unknown): void {
      const m = message as { type: string; [key: string]: unknown };
      switch (m.type) {
        case "proposeTeam":
          orchestrator.proposeTeam(m.teamPlayerIds as readonly string[]);
          break;
        case "castVote":
          orchestrator.castVote(m.playerId as string, m.vote as "Approve" | "Reject");
          break;
        case "submitMissionCard":
          orchestrator.submitMissionCard(m.playerId as string, m.card as "Success" | "Fail");
          break;
        case "submitAssassinationGuess":
          orchestrator.submitAssassinationGuess(m.targetPlayerId as string);
          break;
        default:
          throw new Error(`Unknown message type: ${m.type}`);
      }
    }

    await orchestrator.startGame(players);

    const { result } = renderHook(() =>
      usePlayerGameState({
        roomHub: hub,
        playerId: "p1",
        privateKey: keyPairs[1]!.privateKey,
        transport: { send: dispatchToOrchestrator },
      }),
    );

    act(() => {
      result.current.proposeTeam(["p1", "p2"]);
    });
    expect(orchestrator.getRoundLoopState()?.phase).toBe("TeamProposal");

    act(() => {
      result.current.castVote("Approve");
    });
    orchestrator.castVote("p0", "Approve");
    orchestrator.castVote("p2", "Approve");
    orchestrator.castVote("p3", "Approve");
    orchestrator.castVote("p4", "Approve");
    expect(orchestrator.getRoundLoopState()?.phase).toBe("MissionResolution");

    act(() => {
      result.current.submitMissionCard("Success");
    });
    orchestrator.submitMissionCard("p2", "Success");
    expect(orchestrator.getRoundLoopState()?.missionResults).toEqual(["Success"]);

    act(() => {
      result.current.submitAssassinationGuess("p0");
    });
    expect(orchestrator.getRoundLoopState()?.result).not.toBeNull();
  });
});
