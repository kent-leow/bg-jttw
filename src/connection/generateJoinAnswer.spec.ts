import { describe, expect, it } from "vitest";
import { createFakePeerConnection } from "./generateHostOffer.spec";
import { generateJoinAnswer } from "./generateJoinAnswer";

describe("generateJoinAnswer", () => {
  it("produces a serializable answer for a valid offer", async () => {
    const { answer } = await generateJoinAnswer(
      { type: "offer", sdp: "fake-offer-sdp" },
      createFakePeerConnection,
    );

    expect(answer.type).toBe("answer");
    expect(typeof answer.sdp).toBe("string");
    expect(answer.sdp.length).toBeGreaterThan(0);
    expect(() => JSON.stringify(answer)).not.toThrow();
  });

  it("rejects a malformed offer with an explicit error", async () => {
    await expect(generateJoinAnswer({ type: "offer" }, createFakePeerConnection)).rejects.toThrow(
      /malformed host offer/i,
    );
    await expect(generateJoinAnswer(null, createFakePeerConnection)).rejects.toThrow(/malformed host offer/i);
    await expect(generateJoinAnswer("not-an-object", createFakePeerConnection)).rejects.toThrow(
      /malformed host offer/i,
    );
  });
});
