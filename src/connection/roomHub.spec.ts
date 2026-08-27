import { describe, expect, it, vi } from "vitest";
import { decryptOwnPayload } from "../crypto/decryptOwnPayload";
import { encryptForPlayer } from "../crypto/encryptForPlayer";
import { generateKeyPair } from "../crypto/keyPair";
import { createDataChannelTransport } from "./dataChannelTransport";
import { createLoopbackChannelPair } from "./generateHostOffer.spec";
import { RoomHub, type RoomHubMessage } from "./roomHub";

describe("RoomHub", () => {
  it("delivers a public broadcast to every connected peer", () => {
    const hub = new RoomHub();
    const received: Record<string, RoomHubMessage[]> = { a: [], b: [], c: [] };
    hub.connect({ playerId: "a", onMessage: (m) => received.a!.push(m) });
    hub.connect({ playerId: "b", onMessage: (m) => received.b!.push(m) });
    hub.connect({ playerId: "c", onMessage: (m) => received.c!.push(m) });

    hub.broadcastPublicState({ players: ["a", "b", "c"] });

    for (const id of ["a", "b", "c"]) {
      expect(received[id]).toEqual([{ kind: "broadcast", payload: { players: ["a", "b", "c"] } }]);
    }
  });

  it("delivers a private encrypted blob only to the addressed player, and the hub cannot decrypt it", async () => {
    const hub = new RoomHub();
    const playerB = await generateKeyPair();
    const receivedA = vi.fn();
    const receivedB = vi.fn();
    hub.connect({ playerId: "a", onMessage: receivedA });
    hub.connect({ playerId: "b", onMessage: receivedB });

    const secretRole = { role: "Merlin" };
    const envelope = await encryptForPlayer(playerB.publicKey, secretRole);
    hub.relayToPlayer("b", envelope);

    expect(receivedA).not.toHaveBeenCalled();
    expect(receivedB).toHaveBeenCalledWith({ kind: "direct", targetPlayerId: "b", payload: envelope });

    // The hub instance holds no private key material at all — it only routes ciphertext.
    expect(Object.getOwnPropertyNames(hub)).not.toContain("privateKey");
    expect(JSON.stringify(envelope.ciphertext)).not.toContain("Merlin");

    const decrypted = await decryptOwnPayload(playerB.privateKey, envelope);
    expect(decrypted).toEqual(secretRole);
  });

  it("delivers a broadcast and a direct message to a peer whose onMessage forwards through a real data channel transport", () => {
    const hub = new RoomHub();
    const [hostSideChannel, playerSideChannel] = createLoopbackChannelPair();
    hostSideChannel.open();
    playerSideChannel.open();
    const hostSideTransport = createDataChannelTransport(hostSideChannel as unknown as RTCDataChannel);
    const playerSideTransport = createDataChannelTransport(playerSideChannel as unknown as RTCDataChannel);
    const receivedOnPlayerSide = vi.fn();
    playerSideTransport.onMessage(receivedOnPlayerSide);

    hub.connect({ playerId: "p1", onMessage: (message) => hostSideTransport.send(message) });

    hub.broadcastPublicState({ phase: "Lobby" });
    expect(receivedOnPlayerSide).toHaveBeenCalledWith({ kind: "broadcast", payload: { phase: "Lobby" } });

    hub.relayToPlayer("p1", { ciphertext: "opaque" });
    expect(receivedOnPlayerSide).toHaveBeenCalledWith({
      kind: "direct",
      targetPlayerId: "p1",
      payload: { ciphertext: "opaque" },
    });
  });
});
