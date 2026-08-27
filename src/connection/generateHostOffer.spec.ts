import { describe, expect, it, vi } from "vitest";
import { generateHostOffer } from "./generateHostOffer";

/** Minimal in-memory stand-in for RTCDataChannel, enough to exercise queuing/open/message flows. */
export class FakeRTCDataChannel {
  readyState: "connecting" | "open" | "closed" = "connecting";
  peer: FakeRTCDataChannel | null = null;
  private readonly listeners: Record<string, Array<(event: { data?: string }) => void>> = {};

  addEventListener(event: string, handler: (event: { data?: string }) => void): void {
    (this.listeners[event] ??= []).push(handler);
  }

  removeEventListener(event: string, handler: (event: { data?: string }) => void): void {
    this.listeners[event] = (this.listeners[event] ?? []).filter((l) => l !== handler);
  }

  private dispatch(event: string, payload: { data?: string } = {}): void {
    for (const listener of this.listeners[event] ?? []) {
      listener(payload);
    }
  }

  send(data: string): void {
    if (this.readyState !== "open") {
      throw new Error("FakeRTCDataChannel: cannot send while not open");
    }
    this.peer?.dispatch("message", { data });
  }

  /** Test-only hook to simulate an inbound frame without requiring a paired peer. */
  receiveRaw(data: string): void {
    this.dispatch("message", { data });
  }

  open(): void {
    this.readyState = "open";
    this.dispatch("open");
  }

  close(): void {
    this.readyState = "closed";
    this.dispatch("close");
  }
}

export function createLoopbackChannelPair(): [FakeRTCDataChannel, FakeRTCDataChannel] {
  const a = new FakeRTCDataChannel();
  const b = new FakeRTCDataChannel();
  a.peer = b;
  b.peer = a;
  return [a, b];
}

/** Minimal in-memory stand-in for RTCPeerConnection, enough to exercise the non-trickle-ICE flow. */
export class FakeRTCPeerConnection {
  localDescription: { type: string; sdp: string } | null = null;
  iceGatheringState = "new";
  dataChannel: FakeRTCDataChannel | null = null;
  private readonly listeners: Record<string, Array<(event: unknown) => void>> = {};

  createDataChannel(): FakeRTCDataChannel {
    this.dataChannel = new FakeRTCDataChannel();
    return this.dataChannel;
  }

  /** Test-only hook to simulate the browser firing `ondatachannel` on this peer connection. */
  dispatchDataChannelEvent(channel: FakeRTCDataChannel): void {
    for (const listener of this.listeners["datachannel"] ?? []) {
      listener({ channel });
    }
  }

  addEventListener(event: string, callback: (event: unknown) => void): void {
    (this.listeners[event] ??= []).push(callback);
  }

  removeEventListener(event: string, callback: (event: unknown) => void): void {
    this.listeners[event] = (this.listeners[event] ?? []).filter((l) => l !== callback);
  }

  async createOffer(): Promise<{ type: string; sdp: string }> {
    return { type: "offer", sdp: "fake-offer-sdp-with-candidates" };
  }

  async createAnswer(): Promise<{ type: string; sdp: string }> {
    return { type: "answer", sdp: "fake-answer-sdp-with-candidates" };
  }

  async setLocalDescription(description: { type: string; sdp: string }): Promise<void> {
    this.localDescription = description;
    this.iceGatheringState = "complete";
    for (const listener of this.listeners["icegatheringstatechange"] ?? []) {
      listener(undefined);
    }
  }

  async setRemoteDescription(description: { type: string; sdp: string }): Promise<void> {
    if (description.sdp === "invalid-or-expired") {
      throw new Error("Invalid or expired remote description.");
    }
  }
}

export function createFakePeerConnection(): RTCPeerConnection {
  return new FakeRTCPeerConnection() as unknown as RTCPeerConnection;
}

describe("generateHostOffer", () => {
  it("produces a serializable offer payload with no external server call", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const { offer } = await generateHostOffer(createFakePeerConnection);

    expect(offer.type).toBe("offer");
    expect(typeof offer.sdp).toBe("string");
    expect(offer.sdp.length).toBeGreaterThan(0);
    expect(() => JSON.stringify(offer)).not.toThrow();
    expect(fetchSpy).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
  });

  it("includes the created data channel instance in the result", async () => {
    const { dataChannel } = await generateHostOffer(createFakePeerConnection);

    expect(dataChannel).toBeInstanceOf(FakeRTCDataChannel);
    expect((dataChannel as unknown as FakeRTCDataChannel).readyState).toBe("connecting");
  });
});

