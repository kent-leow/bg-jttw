import { describe, expect, it } from "vitest";
import { resolveVotes } from "./voteResolution";

describe("resolveVotes", () => {
  it("passes when Approve is a strict majority", () => {
    const result = resolveVotes({ a: "Approve", b: "Approve", c: "Reject" });
    expect(result.passed).toBe(true);
  });

  it("fails on a tie (counts as Reject)", () => {
    const result = resolveVotes({ a: "Approve", b: "Reject" });
    expect(result.passed).toBe(false);
  });

  it("fails when Reject is the majority", () => {
    const result = resolveVotes({ a: "Approve", b: "Reject", c: "Reject" });
    expect(result.passed).toBe(false);
  });
});
