import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { AppRoot } from "./AppRoot";
import { writeSnapshot } from "../state/localGameSnapshot";
import type { GameSnapshot } from "../state/localGameSnapshot";

describe("AppRoot", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("renders new-setup path when no snapshot exists", async () => {
    const onNewSetup = vi.fn();
    const onResumedGame = vi.fn();

    render(<AppRoot onNewSetup={onNewSetup} onResumedGame={onResumedGame} />);

    await waitFor(() => {
      expect(onNewSetup).toHaveBeenCalledTimes(1);
    });

    expect(onResumedGame).not.toHaveBeenCalled();
  });

  it("renders resumed-game path when a snapshot exists", async () => {
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

    const onNewSetup = vi.fn();
    const onResumedGame = vi.fn();

    render(<AppRoot onNewSetup={onNewSetup} onResumedGame={onResumedGame} />);

    await waitFor(() => {
      expect(onResumedGame).toHaveBeenCalledTimes(1);
      expect(onResumedGame).toHaveBeenCalledWith(snapshot);
    });

    expect(onNewSetup).not.toHaveBeenCalled();
  });

  it("falls back to new-setup without throwing when snapshot is corrupt", async () => {
    // Set corrupt data in localStorage
    localStorage.setItem("pass-and-play-game-snapshot", "{invalid json");

    const onNewSetup = vi.fn();
    const onResumedGame = vi.fn();

    // Should not throw
    render(<AppRoot onNewSetup={onNewSetup} onResumedGame={onResumedGame} />);

    await waitFor(() => {
      expect(onNewSetup).toHaveBeenCalledTimes(1);
    });

    expect(onResumedGame).not.toHaveBeenCalled();
  });

  it("falls back to new-setup when stored data lacks required fields", async () => {
    localStorage.setItem("pass-and-play-game-snapshot", JSON.stringify({ foo: "bar" }));

    const onNewSetup = vi.fn();
    const onResumedGame = vi.fn();

    render(<AppRoot onNewSetup={onNewSetup} onResumedGame={onResumedGame} />);

    await waitFor(() => {
      expect(onNewSetup).toHaveBeenCalledTimes(1);
    });

    expect(onResumedGame).not.toHaveBeenCalled();
  });
});
