import { describe, expect, it } from "vitest";
import { rematch } from "./rematch";

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

describe("rematch", () => {
  const playerIds = Array.from({ length: 8 }, (_, i) => `player-${i}`);

  it("preserves the existing player ids (connections stay intact)", () => {
    const result = rematch(playerIds, seededRng(1));
    expect(new Set(result.roleAssignments.map((a) => a.playerId))).toEqual(new Set(playerIds));
  });

  it("produces a fresh round-loop state (no leftover result/mission progress)", () => {
    const result = rematch(playerIds, seededRng(1));
    expect(result.roundLoopState.result).toBeNull();
    expect(result.roundLoopState.missionNumber).toBe(1);
    expect(result.roundLoopState.missionResults).toEqual([]);
    expect(result.roundLoopState.phase).toBe("TeamProposal");
  });

  it("produces a fresh, independent role assignment across rematches", () => {
    const first = rematch(playerIds, seededRng(1));
    const second = rematch(playerIds, seededRng(2));
    expect(first.roleAssignments.map((a) => a.role.name)).not.toEqual(
      second.roleAssignments.map((a) => a.role.name),
    );
  });
});
