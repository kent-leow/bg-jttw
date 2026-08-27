import { describe, expect, it } from "vitest";
import { reestablishConnection } from "./reestablishConnection";

describe("reestablishConnection", () => {
  it("succeeds and restores the current game/round state when the host is reachable", async () => {
    const currentState = { phase: "TeamProposal", missionNumber: 2 };
    const checkHostReachable = async () => ({ reachable: true, currentState });

    const result = await reestablishConnection("room-1", "p1", checkHostReachable);

    expect(result.reconnected).toBe(true);
    expect(result.currentState).toEqual(currentState);
  });

  it("returns reconnected == false and an explicit host-unreachable message otherwise", async () => {
    const checkHostReachable = async () => ({ reachable: false });

    const result = await reestablishConnection("room-1", "p1", checkHostReachable);

    expect(result.reconnected).toBe(false);
    expect(result.message).toMatch(/host unreachable/i);
  });
});
