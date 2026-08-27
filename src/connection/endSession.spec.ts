import { describe, expect, it, vi } from "vitest";
import { endSession } from "./endSession";

describe("endSession", () => {
  it("closes all peer connections and clears room state", () => {
    const closeA = vi.fn();
    const closeB = vi.fn();
    const peerConnections = [{ close: closeA }, { close: closeB }] as unknown as RTCPeerConnection[];
    const clearRoomState = vi.fn();

    endSession(peerConnections, clearRoomState);

    expect(closeA).toHaveBeenCalledTimes(1);
    expect(closeB).toHaveBeenCalledTimes(1);
    expect(clearRoomState).toHaveBeenCalledTimes(1);
  });
});
