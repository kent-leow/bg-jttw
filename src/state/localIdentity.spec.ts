import { beforeEach, describe, expect, it } from "vitest";
import { clearLocalIdentity, readLocalIdentity, writeLocalIdentity } from "./localIdentity";

describe("localIdentity", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("round-trips a stored identity across a simulated reload", () => {
    const identity = { playerId: "p1", roomId: "room-1", lastKnownState: { phase: "TeamProposal" } };
    writeLocalIdentity(identity);

    // Simulate a page reload: a fresh call to readLocalIdentity reads straight from storage.
    const restored = readLocalIdentity();

    expect(restored).toEqual(identity);
  });

  it("returns null when no identity is stored", () => {
    expect(readLocalIdentity()).toBeNull();
  });

  it("clears the stored identity", () => {
    writeLocalIdentity({ playerId: "p1", roomId: "room-1", lastKnownState: null });
    clearLocalIdentity();
    expect(readLocalIdentity()).toBeNull();
  });
});
