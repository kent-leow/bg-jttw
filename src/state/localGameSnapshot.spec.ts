import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { readSnapshot, writeSnapshot, clearSnapshot, type GameSnapshot } from "./localGameSnapshot";

describe("localGameSnapshot", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    // Clean up after each test
    localStorage.clear();
  });

  it("returns null when no snapshot exists", () => {
    const result = readSnapshot();
    expect(result).toBeNull();
  });

  it("round-trips a snapshot through write and read", () => {
    const snapshot: GameSnapshot = {
      roster: [
        { id: "p1", displayName: "Alice" },
        { id: "p2", displayName: "Bob" },
        { id: "p3", displayName: "Charlie" },
        { id: "p4", displayName: "Diana" },
        { id: "p5", displayName: "Eve" },
      ],
      roleAssignments: [
        { playerId: "p1", role: { name: "Merlin", alignment: "Good" } },
        { playerId: "p2", role: { name: "Percival", alignment: "Good" } },
        { playerId: "p3", role: { name: "Morgana", alignment: "Evil" } },
        { playerId: "p4", role: { name: "Assassin", alignment: "Evil" } },
        { playerId: "p5", role: { name: "LoyalServant", alignment: "Good" } },
      ],
      roundLoopState: {
        roleAssignments: [
          { playerId: "p1", role: { name: "Merlin", alignment: "Good" } },
          { playerId: "p2", role: { name: "Percival", alignment: "Good" } },
          { playerId: "p3", role: { name: "Morgana", alignment: "Evil" } },
          { playerId: "p4", role: { name: "Assassin", alignment: "Evil" } },
          { playerId: "p5", role: { name: "LoyalServant", alignment: "Good" } },
        ],
        playerCount: 5 as const,
        leaderIndex: 0,
        missionNumber: 1,
        rejectionCount: 0,
        missionResults: [],
        phase: "TeamProposal",
        result: null,
      },
    };

    writeSnapshot(snapshot);
    const restored = readSnapshot();

    expect(restored).toEqual(snapshot);
  });

  it("returns null when stored data is corrupt JSON", () => {
    // Manually set invalid JSON
    localStorage.setItem("pass-and-play-game-snapshot", "{invalid json");
    const result = readSnapshot();
    expect(result).toBeNull();
  });

  it("returns null when stored data is missing required fields", () => {
    // Store something that parses but lacks the required structure
    localStorage.setItem("pass-and-play-game-snapshot", JSON.stringify({ foo: "bar" }));
    const result = readSnapshot();
    expect(result).toBeNull();
  });

  it("clears the snapshot when clearSnapshot is called", () => {
    const snapshot: GameSnapshot = {
      roster: [
        { id: "p1", displayName: "Alice" },
        { id: "p2", displayName: "Bob" },
        { id: "p3", displayName: "Charlie" },
        { id: "p4", displayName: "Diana" },
        { id: "p5", displayName: "Eve" },
      ],
      roleAssignments: [
        { playerId: "p1", role: { name: "Merlin", alignment: "Good" } },
        { playerId: "p2", role: { name: "Percival", alignment: "Good" } },
        { playerId: "p3", role: { name: "Morgana", alignment: "Evil" } },
        { playerId: "p4", role: { name: "Assassin", alignment: "Evil" } },
        { playerId: "p5", role: { name: "LoyalServant", alignment: "Good" } },
      ],
      roundLoopState: {
        roleAssignments: [
          { playerId: "p1", role: { name: "Merlin", alignment: "Good" } },
          { playerId: "p2", role: { name: "Percival", alignment: "Good" } },
          { playerId: "p3", role: { name: "Morgana", alignment: "Evil" } },
          { playerId: "p4", role: { name: "Assassin", alignment: "Evil" } },
          { playerId: "p5", role: { name: "LoyalServant", alignment: "Good" } },
        ],
        playerCount: 5 as const,
        leaderIndex: 0,
        missionNumber: 1,
        rejectionCount: 0,
        missionResults: [],
        phase: "TeamProposal",
        result: null,
      },
    };

    writeSnapshot(snapshot);
    expect(readSnapshot()).not.toBeNull();

    clearSnapshot();
    expect(readSnapshot()).toBeNull();
  });
});
