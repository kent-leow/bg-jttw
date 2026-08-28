import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { useLocalGameState } from "./useLocalGameState";
import { readSnapshot, clearSnapshot, type LobbyPlayer } from "./localGameSnapshot";
import type { Vote } from "../engine/voteResolution";
import type { MissionCard } from "../engine/missionResolution";

describe("useLocalGameState", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("startGame deals roles and initializes round state for a roster", () => {
    const { result } = renderHook(() => useLocalGameState());

    const roster: LobbyPlayer[] = [
      { id: "p0", displayName: "Alice" },
      { id: "p1", displayName: "Bob" },
      { id: "p2", displayName: "Charlie" },
      { id: "p3", displayName: "Diana" },
      { id: "p4", displayName: "Eve" },
    ];

    act(() => {
      result.current.startGame(roster);
    });

    expect(result.current.roster).toEqual(roster);
    expect(result.current.roleAssignments).toHaveLength(5);
    expect(result.current.roundLoopState).not.toBeNull();
    expect(result.current.roundLoopState?.phase).toBe("TeamProposal");
    expect(result.current.roundLoopState?.missionNumber).toBe(1);
    expect(result.current.roundLoopState?.leaderIndex).toBe(0);
    expect(result.current.hiddenKnowledgeByPlayerId.size).toBe(5);
  });

  it("every action persists a snapshot", () => {
    const { result } = renderHook(() => useLocalGameState());

    const roster: LobbyPlayer[] = [
      { id: "p0", displayName: "Alice" },
      { id: "p1", displayName: "Bob" },
      { id: "p2", displayName: "Charlie" },
      { id: "p3", displayName: "Diana" },
      { id: "p4", displayName: "Eve" },
    ];

    act(() => {
      result.current.startGame(roster);
    });

    const snapshot1 = readSnapshot();
    expect(snapshot1).not.toBeNull();
    expect(snapshot1?.roster).toEqual(roster);
    expect(snapshot1?.roleAssignments).toHaveLength(5);

    const allIds = roster.map((p) => p.id);
    const votes: Record<string, Vote> = Object.fromEntries(allIds.map((id) => [id, "Approve" as const]));
    act(() => {
      result.current.castVote(votes);
    });

    const snapshot2 = readSnapshot();
    expect(snapshot2).not.toBeNull();
    expect(snapshot2?.roundLoopState.phase).toBe("MissionResolution");
  });

  it("proposeTeam validates team size", () => {
    const { result } = renderHook(() => useLocalGameState());

    const roster: LobbyPlayer[] = [
      { id: "p0", displayName: "Alice" },
      { id: "p1", displayName: "Bob" },
      { id: "p2", displayName: "Charlie" },
      { id: "p3", displayName: "Diana" },
      { id: "p4", displayName: "Eve" },
    ];

    act(() => {
      result.current.startGame(roster);
    });

    // For 5 players, mission 1 requires team size 2
    const result1 = result.current.proposeTeam(["p0", "p1"]);
    expect(result1.valid).toBe(true);

    // Wrong size should be invalid
    const result2 = result.current.proposeTeam(["p0"]);
    expect(result2.valid).toBe(false);
  });

  it("castVote returns no error when valid", () => {
    const { result } = renderHook(() => useLocalGameState());

    const roster: LobbyPlayer[] = [
      { id: "p0", displayName: "Alice" },
      { id: "p1", displayName: "Bob" },
      { id: "p2", displayName: "Charlie" },
      { id: "p3", displayName: "Diana" },
      { id: "p4", displayName: "Eve" },
    ];

    act(() => {
      result.current.startGame(roster);
    });

    const allIds = roster.map((p) => p.id);
    const votes: Record<string, Vote> = Object.fromEntries(allIds.map((id) => [id, "Approve" as const]));

    expect(() => {
      act(() => {
        result.current.castVote(votes);
      });
    }).not.toThrow();
    expect(result.current.roundLoopState?.phase).toBe("MissionResolution");
  });

  it("runs a full round loop to mission result identical to roundLoop tests", () => {
    const { result } = renderHook(() => useLocalGameState());

    const roster: LobbyPlayer[] = [
      { id: "p0", displayName: "Alice" },
      { id: "p1", displayName: "Bob" },
      { id: "p2", displayName: "Charlie" },
      { id: "p3", displayName: "Diana" },
      { id: "p4", displayName: "Eve" },
    ];

    act(() => {
      result.current.startGame(roster);
    });
    const allIds = roster.map((p) => p.id);

    // First mission
    expect(result.current.roundLoopState?.phase).toBe("TeamProposal");
    expect(result.current.roundLoopState?.missionNumber).toBe(1);

    // Propose team of size 2 for mission 1
    const proposalResult = result.current.proposeTeam(["p0", "p1"]);
    expect(proposalResult.valid).toBe(true);

    // Vote approve all
    const votes1: Record<string, Vote> = Object.fromEntries(allIds.map((id) => [id, "Approve" as const]));
    act(() => {
      result.current.castVote(votes1);
    });

    expect(result.current.roundLoopState?.phase).toBe("MissionResolution");

    // Submit mission cards: good team members submit Success
    const cards1: Record<string, MissionCard> = {
      p0: "Success",
      p1: "Success",
    };
    act(() => {
      result.current.submitMissionCard(["p0", "p1"], cards1);
    });

    // Should advance to next team proposal
    expect(result.current.roundLoopState?.phase).toBe("TeamProposal");
    expect(result.current.roundLoopState?.missionNumber).toBe(2);
  });

  it("runs to GameOver via evil wins with 3 failed missions", () => {
    const { result } = renderHook(() => useLocalGameState());

    const roster: LobbyPlayer[] = [
      { id: "p0", displayName: "Alice" },
      { id: "p1", displayName: "Bob" },
      { id: "p2", displayName: "Charlie" },
      { id: "p3", displayName: "Diana" },
      { id: "p4", displayName: "Eve" },
    ];

    act(() => {
      result.current.startGame(roster);
    });

    // Get role assignments to know who is evil
    const evilPlayerIds = result.current.roleAssignments
      .filter((a) => a.role.alignment === "Evil")
      .map((a) => a.playerId);
    const allIds = roster.map((p) => p.id);

    // Run 3 missions with fail each time
    for (let mission = 1; mission <= 3; mission += 1) {
      // Propose team with evil player included
      const team = [evilPlayerIds[0], ...allIds.filter((id) => id !== evilPlayerIds[0]).slice(0, 1)];
      result.current.proposeTeam(team);

      // Vote approve all
      const votes: Record<string, Vote> = Object.fromEntries(allIds.map((id) => [id, "Approve" as const]));
      act(() => {
        result.current.castVote(votes);
      });

      expect(result.current.roundLoopState?.phase).toBe("MissionResolution");

      // Submit mission cards: evil player submits Fail
      const cards: Record<string, MissionCard> = Object.fromEntries(
        team.map((id) => [id, id === evilPlayerIds[0] ? ("Fail" as const) : ("Success" as const)]),
      );
      act(() => {
        result.current.submitMissionCard(team, cards);
      });
    }

    expect(result.current.roundLoopState?.phase).toBe("GameOver");
    expect(result.current.roundLoopState?.result).toBe("EvilWin");
    expect(result.current.roundLoopState?.resultReason).toBe("3 failed missions");
  });

  it("runs to GameOver via hammer rule (5 consecutive rejections)", () => {
    const { result } = renderHook(() => useLocalGameState());

    const roster: LobbyPlayer[] = [
      { id: "p0", displayName: "Alice" },
      { id: "p1", displayName: "Bob" },
      { id: "p2", displayName: "Charlie" },
      { id: "p3", displayName: "Diana" },
      { id: "p4", displayName: "Eve" },
    ];

    act(() => {
      result.current.startGame(roster);
    });
    const allIds = roster.map((p) => p.id);

    // Propose and reject 5 times
    for (let i = 0; i < 5; i += 1) {
      const team = allIds.slice(0, 2); // Mission 1 size is 2
      result.current.proposeTeam(team);

      const votes: Record<string, Vote> = Object.fromEntries(allIds.map((id) => [id, "Reject" as const]));
      act(() => {
        result.current.castVote(votes);
      });
    }

    expect(result.current.roundLoopState?.phase).toBe("GameOver");
    expect(result.current.roundLoopState?.result).toBe("EvilWin");
    expect(result.current.roundLoopState?.resultReason).toBe("5 consecutive rejected proposals");
  });

  it("runs to Assassination after 3 successful missions", () => {
    const { result } = renderHook(() => useLocalGameState());

    const roster: LobbyPlayer[] = [
      { id: "p0", displayName: "Alice" },
      { id: "p1", displayName: "Bob" },
      { id: "p2", displayName: "Charlie" },
      { id: "p3", displayName: "Diana" },
      { id: "p4", displayName: "Eve" },
    ];

    act(() => {
      result.current.startGame(roster);
    });

    const goodPlayerIds = result.current.roleAssignments
      .filter((a) => a.role.alignment === "Good")
      .map((a) => a.playerId);
    const allIds = roster.map((p) => p.id);

    // Run 3 missions all successful
    for (let mission = 1; mission <= 3; mission += 1) {
      const missionSizes = [2, 3, 2, 3, 3];
      const size = missionSizes[mission - 1];

      const team = goodPlayerIds.slice(0, size);
      result.current.proposeTeam(team);

      const votes: Record<string, Vote> = Object.fromEntries(allIds.map((id) => [id, "Approve" as const]));
      act(() => {
        result.current.castVote(votes);
      });

      expect(result.current.roundLoopState?.phase).toBe("MissionResolution");

      const cards: Record<string, MissionCard> = Object.fromEntries(team.map((id) => [id, "Success" as const]));
      act(() => {
        result.current.submitMissionCard(team, cards);
      });
    }

    expect(result.current.roundLoopState?.phase).toBe("Assassination");
  });

  it("resolves assassination correctly", () => {
    const { result } = renderHook(() => useLocalGameState());

    const roster: LobbyPlayer[] = [
      { id: "p0", displayName: "Alice" },
      { id: "p1", displayName: "Bob" },
      { id: "p2", displayName: "Charlie" },
      { id: "p3", displayName: "Diana" },
      { id: "p4", displayName: "Eve" },
    ];

    act(() => {
      result.current.startGame(roster);
    });

    const merlinId = result.current.roleAssignments.find((a) => a.role.name === "Merlin")?.playerId;
    const assassinId = result.current.roleAssignments.find((a) => a.role.name === "Assassin")?.playerId;

    expect(merlinId).toBeDefined();
    expect(assassinId).toBeDefined();

    const goodPlayerIds = result.current.roleAssignments
      .filter((a) => a.role.alignment === "Good")
      .map((a) => a.playerId);
    const allIds = roster.map((p) => p.id);

    // Play 3 successful missions
    for (let mission = 1; mission <= 3; mission += 1) {
      const missionSizes = [2, 3, 2, 3, 3];
      const size = missionSizes[mission - 1];

      const team = goodPlayerIds.slice(0, size);
      result.current.proposeTeam(team);

      const votes: Record<string, Vote> = Object.fromEntries(allIds.map((id) => [id, "Approve" as const]));
      act(() => {
        result.current.castVote(votes);
      });

      const cards: Record<string, MissionCard> = Object.fromEntries(team.map((id) => [id, "Success" as const]));
      act(() => {
        result.current.submitMissionCard(team, cards);
      });
    }

    expect(result.current.roundLoopState?.phase).toBe("Assassination");

    // Guess wrong player (not Merlin)
    act(() => {
      result.current.submitAssassinationGuess(assassinId!);
    });

    expect(result.current.roundLoopState?.phase).toBe("GameOver");
    expect(result.current.roundLoopState?.result).toBe("GoodWin");
    expect(result.current.roundLoopState?.resultReason).toBe("Assassin failed to identify Merlin");

    // Now test guessing correctly
    act(() => {
      result.current.startGame(roster);
    });

    // Re-extract merlinId for the new game
    const merlinId2 = result.current.roleAssignments.find((a) => a.role.name === "Merlin")?.playerId;
    const goodPlayerIds2 = result.current.roleAssignments
      .filter((a) => a.role.alignment === "Good")
      .map((a) => a.playerId);

    for (let mission = 1; mission <= 3; mission += 1) {
      const missionSizes = [2, 3, 2, 3, 3];
      const size = missionSizes[mission - 1];

      const team = goodPlayerIds2.slice(0, size);
      result.current.proposeTeam(team);

      const votes: Record<string, Vote> = Object.fromEntries(allIds.map((id) => [id, "Approve" as const]));
      act(() => {
        result.current.castVote(votes);
      });

      const cards: Record<string, MissionCard> = Object.fromEntries(team.map((id) => [id, "Success" as const]));
      act(() => {
        result.current.submitMissionCard(team, cards);
      });
    }

    // Guess correct player (Merlin from second game)
    act(() => {
      result.current.submitAssassinationGuess(merlinId2!);
    });

    expect(result.current.roundLoopState?.phase).toBe("GameOver");
    expect(result.current.roundLoopState?.result).toBe("EvilWin");
    expect(result.current.roundLoopState?.resultReason).toBe("Assassin correctly identified Merlin");
  });

  it("rematch re-deals roles for the same roster", () => {
    const { result } = renderHook(() => useLocalGameState());

    const roster: LobbyPlayer[] = [
      { id: "p0", displayName: "Alice" },
      { id: "p1", displayName: "Bob" },
      { id: "p2", displayName: "Charlie" },
      { id: "p3", displayName: "Diana" },
      { id: "p4", displayName: "Eve" },
    ];

    act(() => {
      result.current.startGame(roster);
    });

    const firstAssignments = [...result.current.roleAssignments];

    // End game (simulate by running to game over)
    const allIds = roster.map((p) => p.id);
    for (let i = 0; i < 5; i += 1) {
      const team = allIds.slice(0, 2);
      result.current.proposeTeam(team);
      const votes: Record<string, Vote> = Object.fromEntries(allIds.map((id) => [id, "Reject" as const]));
      act(() => {
        result.current.castVote(votes);
      });
    }

    expect(result.current.roundLoopState?.result).not.toBeNull();

    // Rematch
    act(() => {
      result.current.rematch();
    });

    expect(result.current.roster).toEqual(roster);
    expect(result.current.roleAssignments).toHaveLength(5);
    expect(result.current.roundLoopState?.phase).toBe("TeamProposal");
    expect(result.current.roundLoopState?.missionNumber).toBe(1);
    expect(result.current.roundLoopState?.result).toBeNull();

    // Verify snapshot was written
    const snapshot = readSnapshot();
    expect(snapshot?.roster).toEqual(roster);
  });

  it("endSession clears the snapshot", () => {
    const { result } = renderHook(() => useLocalGameState());

    const roster: LobbyPlayer[] = [
      { id: "p0", displayName: "Alice" },
      { id: "p1", displayName: "Bob" },
      { id: "p2", displayName: "Charlie" },
      { id: "p3", displayName: "Diana" },
      { id: "p4", displayName: "Eve" },
    ];

    act(() => {
      result.current.startGame(roster);
    });

    let snapshot = readSnapshot();
    expect(snapshot).not.toBeNull();

    act(() => {
      result.current.endSession();
    });

    snapshot = readSnapshot();
    expect(snapshot).toBeNull();

    expect(result.current.roster).toHaveLength(0);
    expect(result.current.roleAssignments).toHaveLength(0);
    expect(result.current.roundLoopState).toBeNull();
    expect(result.current.hiddenKnowledgeByPlayerId.size).toBe(0);
  });
});
