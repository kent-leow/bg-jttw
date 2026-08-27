import { describe, expect, it } from "vitest";
import { completeConnection } from "./completeConnection";
import { createFakePeerConnection } from "./generateHostOffer.spec";

describe("completeConnection", () => {
  it("completes the connection for a valid answer", async () => {
    const peerConnection = createFakePeerConnection();
    const result = await completeConnection(peerConnection, { type: "answer", sdp: "fake-answer-sdp" });
    expect(result.connectionEstablished).toBe(true);
  });

  it("returns connectionEstablished == false for an invalid/expired answer", async () => {
    const peerConnection = createFakePeerConnection();
    const result = await completeConnection(peerConnection, { type: "answer", sdp: "invalid-or-expired" });
    expect(result.connectionEstablished).toBe(false);
  });

  it("returns connectionEstablished == false for a malformed answer payload", async () => {
    const peerConnection = createFakePeerConnection();
    expect((await completeConnection(peerConnection, { type: "answer" })).connectionEstablished).toBe(false);
    expect((await completeConnection(peerConnection, null)).connectionEstablished).toBe(false);
  });
});
