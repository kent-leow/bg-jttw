export interface PlayerKeyPair {
  readonly publicKey: CryptoKey;
  readonly privateKey: CryptoKey;
}

/**
 * Generates a per-player RSA-OAEP key pair, entirely on this device — the public key is safe to
 * share (e.g., relayed via the room hub); the private key must never leave this device.
 */
export async function generateKeyPair(): Promise<PlayerKeyPair> {
  const { publicKey, privateKey } = await crypto.subtle.generateKey(
    { name: "RSA-OAEP", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    true,
    ["encrypt", "decrypt"],
  );
  return { publicKey, privateKey };
}
