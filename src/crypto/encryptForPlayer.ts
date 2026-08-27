export interface EncryptedEnvelope {
  readonly encryptedKey: string;
  readonly iv: string;
  readonly ciphertext: string;
}

export function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

export function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Hybrid encryption (AES-GCM payload + RSA-OAEP-wrapped AES key) so payloads of any size (e.g.,
 * role + hidden-knowledge lists) can be encrypted for a single recipient's public key, unlike
 * plain RSA-OAEP which is limited to a few hundred bytes.
 */
export async function encryptForPlayer(publicKey: CryptoKey, payload: unknown): Promise<EncryptedEnvelope> {
  const aesKey = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(payload));

  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, plaintext);
  const rawAesKey = await crypto.subtle.exportKey("raw", aesKey);
  const encryptedKey = await crypto.subtle.encrypt({ name: "RSA-OAEP" }, publicKey, rawAesKey);

  return {
    encryptedKey: bufferToBase64(encryptedKey),
    iv: bufferToBase64(iv.buffer),
    ciphertext: bufferToBase64(ciphertext),
  };
}
