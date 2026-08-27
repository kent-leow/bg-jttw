import { describe, expect, it, vi } from "vitest";
import { generateHostOffer } from "./generateHostOffer";

/** Minimal in-memory stand-in for RTCPeerConnection, enough to exercise the non-trickle-ICE flow. */
export class FakeRTCPeerConnection {
  localDescription: { type: string; sdp: string } | null = null;
  iceGatheringState = "new";
  private readonly listeners: Record<string, Array<() => void>> = {};

  createDataChannel(): object {
    return {};
  }

  addEventListener(event: string, callback: () => void): void {
    (this.listeners[event] ??= []).push(callback);
  }

  removeEventListener(event: string, callback: () => void): void {
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
      listener();
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
});
