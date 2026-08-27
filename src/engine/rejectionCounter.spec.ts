import { describe, expect, it } from "vitest";
import { applyProposalVoteOutcome } from "./rejectionCounter";

describe("applyProposalVoteOutcome", () => {
  it("resets to 0 on approval", () => {
    expect(applyProposalVoteOutcome(4, true)).toEqual({ rejectionCount: 0, hammer: false });
  });

  it("increments on rejection without triggering the hammer before the 5th", () => {
    expect(applyProposalVoteOutcome(3, false)).toEqual({ rejectionCount: 4, hammer: false });
  });

  it("triggers the hammer exactly on the 5th consecutive rejection", () => {
    expect(applyProposalVoteOutcome(4, false)).toEqual({ rejectionCount: 5, hammer: true });
  });
});
