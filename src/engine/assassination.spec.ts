import { describe, expect, it } from "vitest";
import { resolveAssassination } from "./assassination";

describe("resolveAssassination", () => {
  it("results in EvilWin when the Assassin correctly guesses Merlin", () => {
    const result = resolveAssassination("merlin-id", "merlin-id");
    expect(result.result).toBe("EvilWin");
    expect(result.reason).toBeTruthy();
  });

  it("results in GoodWin when the Assassin guesses incorrectly", () => {
    const result = resolveAssassination("wrong-id", "merlin-id");
    expect(result.result).toBe("GoodWin");
    expect(result.reason).toBeTruthy();
  });
});
