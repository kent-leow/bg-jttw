import { describe, expect, it } from "vitest";
import { createFakePeerConnection, FakeRTCDataChannel, FakeRTCPeerConnection } from "./generateHostOffer.spec";
import { generateJoinAnswer } from "./generateJoinAnswer";

describe("generateJoinAnswer", () => {
  it("produces a serializable answer for a valid offer", async () => {
    let capturedPc: FakeRTCPeerConnection | undefined;
    const createAndCapture = () => {
      capturedPc = new FakeRTCPeerConnection();
      return capturedPc as unknown as RTCPeerConnection;
    };
    const { answer, dataChannel } = await (async () => {
      const promise = generateJoinAnswer({ type: "offer", sdp: "fake-offer-sdp" }, createAndCapture);
      capturedPc!.dispatchDataChannelEvent(new FakeRTCDataChannel());
      return promise;
    })();

    expect(answer.type).toBe("answer");
    expect(typeof answer.sdp).toBe("string");
    expect(answer.sdp.length).toBeGreaterThan(0);
    expect(() => JSON.stringify(answer)).not.toThrow();
    expect(dataChannel).toBeInstanceOf(FakeRTCDataChannel);
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

  it("resolves only once the host-created channel has been received", async () => {
    let capturedPc: FakeRTCPeerConnection | undefined;
    const createAndCapture = () => {
      capturedPc = new FakeRTCPeerConnection();
      return capturedPc as unknown as RTCPeerConnection;
    };

    const resultPromise = generateJoinAnswer({ type: "offer", sdp: "fake-offer-sdp" }, createAndCapture);
    const channel = new FakeRTCDataChannel();
    capturedPc!.dispatchDataChannelEvent(channel);

    const result = await resultPromise;
    expect(result.dataChannel).toBe(channel);
  });

  it("rejects with an explicit error if no channel arrives", async () => {
    await expect(
      generateJoinAnswer({ type: "offer", sdp: "fake-offer-sdp" }, createFakePeerConnection, 10),
    ).rejects.toThrow(/timed out waiting for the host's data channel/i);
  });
});

