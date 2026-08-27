import { describe, expect, it } from "vitest";
import { createFakePeerConnection, FakeRTCDataChannel, FakeRTCPeerConnection } from "./generateHostOffer.spec";
import { generateJoinAnswer } from "./generateJoinAnswer";

describe("generateJoinAnswer", () => {
  it("resolves with an answer without waiting for the data channel to open", async () => {
    const { answer, dataChannel } = await generateJoinAnswer(
      { type: "offer", sdp: "fake-offer-sdp" },
      createFakePeerConnection,
    );

    expect(answer.type).toBe("answer");
    expect(typeof answer.sdp).toBe("string");
    expect(answer.sdp.length).toBeGreaterThan(0);
    expect(() => JSON.stringify(answer)).not.toThrow();
    // The data channel isn't open yet (nothing has dispatched the "datachannel" event) — it's a
    // promise the caller can await separately once the host completes their side of the handshake.
    expect(dataChannel).toBeInstanceOf(Promise);
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

  it("the dataChannel promise resolves once the host-created channel is received", async () => {
    let capturedPc: FakeRTCPeerConnection | undefined;
    const createAndCapture = () => {
      capturedPc = new FakeRTCPeerConnection();
      return capturedPc as unknown as RTCPeerConnection;
    };

    const { dataChannel } = await generateJoinAnswer({ type: "offer", sdp: "fake-offer-sdp" }, createAndCapture);
    const channel = new FakeRTCDataChannel();
    capturedPc!.dispatchDataChannelEvent(channel);

    expect(await dataChannel).toBe(channel);
  });

  it("the dataChannel promise rejects with an explicit error if no channel ever arrives", async () => {
    const { dataChannel } = await generateJoinAnswer(
      { type: "offer", sdp: "fake-offer-sdp" },
      createFakePeerConnection,
      10,
    );

    await expect(dataChannel).rejects.toThrow(/timed out waiting for the host's data channel/i);
  });
});


