import { describe, expect, it } from "vitest";
import { generateKeyPair } from "./keyPair";
import { encryptForPlayer } from "./encryptForPlayer";

describe("encryptForPlayer", () => {
  it("produces ciphertext that is undecryptable without the matching private key", async () => {
    const recipient = await generateKeyPair();
    const otherPlayer = await generateKeyPair();

    const envelope = await encryptForPlayer(recipient.publicKey, { role: "Merlin" });

    expect(envelope.ciphertext).not.toContain("Merlin");
    await expect(
      crypto.subtle.decrypt(
        { name: "RSA-OAEP" },
        otherPlayer.privateKey,
        Uint8Array.from(atob(envelope.encryptedKey), (c) => c.charCodeAt(0)),
      ),
    ).rejects.toThrow();
  });
});
