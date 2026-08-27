import { describe, expect, it, vi } from "vitest";
import { generateKeyPair } from "./keyPair";

describe("generateKeyPair", () => {
  it("generates a usable RSA-OAEP key pair", async () => {
    const keyPair = await generateKeyPair();

    expect(keyPair.publicKey.type).toBe("public");
    expect(keyPair.privateKey.type).toBe("private");
    expect(keyPair.publicKey.algorithm.name).toBe("RSA-OAEP");
  });

  it("never logs or serializes the private key elsewhere", async () => {
    const consoleSpy = vi.spyOn(console, "log");

    const keyPair = await generateKeyPair();

    expect(consoleSpy).not.toHaveBeenCalled();
    // CryptoKey is an opaque handle — default JSON serialization exposes no key material.
    expect(JSON.stringify(keyPair.privateKey)).toBe("{}");

    consoleSpy.mockRestore();
  });
});
