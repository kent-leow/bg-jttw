import { describe, expect, it } from "vitest";
import { decryptOwnPayload } from "./decryptOwnPayload";
import { encryptForPlayer } from "./encryptForPlayer";
import { generateKeyPair } from "./keyPair";

describe("decryptOwnPayload", () => {
  it("decrypts a payload encrypted for this key pair", async () => {
    const player = await generateKeyPair();
    const payload = { role: "Percival", hiddenKnowledge: ["merlin", "morgana"] };

    const envelope = await encryptForPlayer(player.publicKey, payload);
    const decrypted = await decryptOwnPayload(player.privateKey, envelope);

    expect(decrypted).toEqual(payload);
  });

  it("throws an explicit error for a payload encrypted for a different key pair", async () => {
    const intendedRecipient = await generateKeyPair();
    const otherPlayer = await generateKeyPair();
    const envelope = await encryptForPlayer(intendedRecipient.publicKey, { role: "Merlin" });

    await expect(decryptOwnPayload(otherPlayer.privateKey, envelope)).rejects.toThrow(
      /failed to decrypt payload/i,
    );
  });
});
