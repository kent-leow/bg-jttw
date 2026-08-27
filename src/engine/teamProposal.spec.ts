import { describe, expect, it } from "vitest";
import { validateTeamProposal } from "./teamProposal";

describe("validateTeamProposal", () => {
  it("rejects a proposal with the wrong player count", () => {
    expect(validateTeamProposal(["a", "b"], 3).valid).toBe(false);
    expect(validateTeamProposal(["a", "b", "c", "d"], 3).valid).toBe(false);
  });

  it("accepts a valid-size proposal", () => {
    const result = validateTeamProposal(["a", "b", "c"], 3);
    expect(result.valid).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it("rejects a proposal with duplicate players", () => {
    expect(validateTeamProposal(["a", "a", "b"], 3).valid).toBe(false);
  });
});
